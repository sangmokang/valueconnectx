import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isPublicRoute, isSemiPublicRoute, isProtectedRoute, isAdminRoute, isAuthRoute } from '@/lib/auth/routes'
import type { Database } from '@/types/supabase'
import { rateLimit, apiLimiter, directoryLimiter, directoryBurstLimiter, directoryDailyLimiter } from '@/lib/rate-limit'
import { createApiError, unauthorized, forbidden, serverError } from '@/lib/api/error'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // x-pathname 헤더를 모든 응답에 전달 (GNB 활성 상태 판별용)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/invites/verify') ||
    pathname.includes('.')
  ) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  if (isAuthRoute(pathname)) return NextResponse.next({ request: { headers: requestHeaders } })
  if (isPublicRoute(pathname)) return NextResponse.next({ request: { headers: requestHeaders } })

  let response = NextResponse.next({ request: { headers: requestHeaders } })
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // 쿠키 갱신 후 request.headers에서 최신 Cookie 헤더를 반영한 헤더 재생성
          const updatedHeaders = new Headers(request.headers)
          updatedHeaders.set('x-pathname', pathname)
          response = NextResponse.next({ request: { headers: updatedHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // DB call 1: JWT 검증 (불가피)
  const { data: { user } } = await supabase.auth.getUser()

  // API routes
  if (pathname.startsWith('/api/')) {
    // Rate limit check (before auth to prevent brute force)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
    const { success: rateLimitOk } = await rateLimit(apiLimiter, `api:${ip}`)
    if (!rateLimitOk) {
      return createApiError(429, '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.', 'RATE_LIMITED')
    }
    if (!user) return unauthorized('인증이 필요합니다')
    // DB call 2: member + corporate 단일 RPC 호출 (기존 2회 → 1회)
    const { data: info, error: rpcError } = await supabase.rpc('vcx_get_user_info', { p_user_id: user.id })
    if (rpcError) {
      console.error('[미들웨어] vcx_get_user_info RPC 실패(API):', rpcError.message)
      return serverError('서버 오류가 발생했습니다')
    }
    if (!info?.member && !info?.corporate) {
      return forbidden('VCX 멤버가 아닙니다')
    }

    // 디렉토리 API 스크래핑 방지
    if (pathname.startsWith('/api/directory')) {
      const dirId = `dir:${ip}`
      const { success: dailyOk } = await rateLimit(directoryDailyLimiter, dirId)
      if (!dailyOk) {
        return createApiError(429, '일일 프로필 조회 한도를 초과했습니다. 내일 다시 시도해주세요.', 'RATE_LIMITED')
      }
      const { success: burstOk } = await rateLimit(directoryBurstLimiter, dirId)
      if (!burstOk) {
        const blocked = createApiError(429, '프로필 조회가 너무 빠릅니다. 잠시 후 다시 시도해주세요.', 'RATE_LIMITED')
        blocked.headers.set('x-vcx-scraping-warning', 'blocked')
        return blocked
      }
      const { success: limitOk } = await rateLimit(directoryLimiter, dirId)
      if (!limitOk) {
        response.headers.set('x-vcx-scraping-warning', 'slow-down')
      }
    }

    // 프로필 미완성 멤버의 쓰기 API 차단 (GET/directory/me는 허용 — 온보딩 폼에서 사용)
    if (
      info?.member &&
      !info?.corporate &&
      request.method !== 'GET' &&
      !pathname.startsWith('/api/directory/me')
    ) {
      const m = info.member as { name?: string | null; current_company?: string | null; title?: string | null; linkedin_url?: string | null }
      if (!m.name || !m.current_company || !m.title || !m.linkedin_url) {
        return forbidden('프로필을 먼저 완성해주세요')
      }
    }

    return response
  }

  if (isSemiPublicRoute(pathname)) {
    response.headers.set('x-vcx-authenticated', user ? 'true' : 'false')
    return response
  }

  if (isAdminRoute(pathname)) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    // DB call 2: member + corporate 단일 RPC 호출
    const { data: info, error: rpcError } = await supabase.rpc('vcx_get_user_info', { p_user_id: user.id })
    if (rpcError) {
      console.error('[미들웨어] vcx_get_user_info RPC 실패(admin):', rpcError.message)
      return NextResponse.redirect(new URL('/', request.url))
    }
    const isAdmin =
      info?.member?.system_role === 'admin' ||
      info?.member?.system_role === 'super_admin'
    if (!isAdmin) return NextResponse.redirect(new URL('/', request.url))
    return response
  }

  if (isProtectedRoute(pathname)) {
    if (!user) {
      response.headers.set('x-vcx-authenticated', 'false')
      return response
    }
    // DB call 2: member + corporate 단일 RPC 호출
    const { data: info, error: rpcError } = await supabase.rpc('vcx_get_user_info', { p_user_id: user.id })
    if (rpcError) {
      console.error('[미들웨어] vcx_get_user_info RPC 실패(protected):', rpcError.message)
      response.headers.set('x-vcx-authenticated', 'false')
      return response
    }
    response.headers.set('x-vcx-authenticated', (!info?.member && !info?.corporate) ? 'false' : 'true')

    // 멤버 프로필 미완성 시 온보딩 강제 리다이렉트 (corporate 유저 제외)
    if (
      info?.member &&
      !info?.corporate &&
      !pathname.startsWith('/onboarding')
    ) {
      const m = info.member as { name?: string | null; current_company?: string | null; title?: string | null; linkedin_url?: string | null }
      const isProfileIncomplete =
        !m.name || !m.current_company || !m.title || !m.linkedin_url
      if (isProfileIncomplete) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
    }

    return response
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
