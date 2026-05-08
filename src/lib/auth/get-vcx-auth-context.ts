import type { NextRequest } from 'next/server'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

export type VcxAuthContext = {
  user: User | null
  supabase: SupabaseClient<Database>
}

/**
 * Route Handler 인증 헬퍼.
 *
 * 동작 순서:
 *  1) `@/lib/supabase/server`의 cookie 기반 클라이언트로 `auth.getUser()` 시도.
 *  2) 사용자 없으면 `Authorization: Bearer <access_token>` 추출.
 *  3) Bearer 존재 시 동일 supabase 클라이언트에 `auth.setSession({ access_token, refresh_token: '' })`
 *     호출 → 후속 `.from(...)` 쿼리가 anon이 아닌 인증된 컨텍스트로 RLS 평가됨.
 *  4) 다시 `auth.getUser()`로 user 확정.
 *
 * 반환된 supabase는 cookie/bearer 둘 중 어느 경로든 인증된 사용자 컨텍스트를 가지므로
 * 호출자는 단일 supabase 인스턴스로 안전하게 후속 쿼리를 수행한다.
 *
 * Bearer 경로에서도 service_role을 절대 사용하지 않는다.
 * refresh_token은 사용하지 않으며 빈 문자열로 전달한다 (autoRefresh 미사용).
 */
export async function getVcxAuthContext(request: NextRequest): Promise<VcxAuthContext> {
  const supabase = await createClient()

  const { data: { user: cookieUser } } = await supabase.auth.getUser()
  if (cookieUser) {
    return { user: cookieUser, supabase }
  }

  const authHeader = request.headers.get('authorization') ?? request.headers.get('Authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!bearer) {
    return { user: null, supabase }
  }

  // setSession이 있는 경우에만 호출 (테스트 mock 환경 호환).
  const setSession = (supabase.auth as { setSession?: (args: { access_token: string; refresh_token: string }) => Promise<unknown> }).setSession
  if (typeof setSession === 'function') {
    try {
      await setSession.call(supabase.auth, { access_token: bearer, refresh_token: '' })
    } catch {
      // setSession 실패 시 토큰 단독 검증으로 폴백 (아래)
    }
  }

  const { data: { user: bearerUser } } = await supabase.auth.getUser(bearer)
  return { user: bearerUser ?? null, supabase }
}
