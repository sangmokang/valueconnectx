import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, serverError } from '@/lib/api/error'
import { parseSearchParams } from '@/lib/api/validation'
import { checkDirectoryAccess } from '@/lib/anti-scraping'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  tier: z.enum(['core', 'endorsed']).optional(),
  industry: z.string().optional(),
  q: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return unauthorized()

    // Determine requester type: vcx_member or vcx_corporate_user
    const { data: member } = await supabase
      .from('vcx_members')
      .select('id')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    const { data: corporateUser } = member
      ? { data: null }
      : await supabase
          .from('vcx_corporate_users')
          .select('id')
          .eq('id', user.id)
          .eq('is_active', true)
          .single()

    if (!member && !corporateUser) {
      return forbidden('VCX 멤버 또는 기업 회원만 접근할 수 있습니다')
    }

    const requesterIsMember = !!member
    const requesterIsCorporate = !!corporateUser

    const { action, message } = await checkDirectoryAccess(user.id)
    if (action === 'restrict' || action === 'block') {
      return NextResponse.json({ error: message }, { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    const parsed = parseSearchParams(searchParams, querySchema)
    if (parsed.error) return parsed.error

    const { page, limit, tier, industry, q } = parsed.data
    const offset = (page - 1) * limit

    let query = supabase
      .from('vcx_members')
      .select(
        'id, name, current_company, title, member_tier, professional_fields, industry, location, is_open_to_chat, avatar_url, join_date, linkedin_url',
        { count: 'exact' }
      )
      .eq('is_active', true)
      .range(offset, offset + limit - 1)

    // Enforce profile_visibility: filter out profiles the requester cannot see
    if (requesterIsCorporate) {
      // Corporate users cannot see members_only profiles
      query = query.neq('profile_visibility', 'members_only')
    } else if (requesterIsMember) {
      // Members cannot see corporate_only profiles
      query = query.neq('profile_visibility', 'corporate_only')
    }

    if (tier) query = query.eq('member_tier', tier)
    if (industry) query = query.eq('industry', industry)

    if (q) {
      query = query
        .textSearch('fts', q, { type: 'plain', config: 'simple' })
        .order('is_open_to_chat', { ascending: false })
        .order('join_date', { ascending: false })
    } else {
      query = query
        .order('is_open_to_chat', { ascending: false })
        .order('join_date', { ascending: false })
    }

    const { data, error, count } = await query
    if (error) {
      console.error('Directory query error:', error)
      return serverError()
    }

    // Profile completeness boost (in-memory, non-FTS only to preserve FTS relevance)
    const scored = (data ?? []).map((m) => {
      let score = 0
      if (m.name) score++
      if (m.current_company) score++
      if (m.title) score++
      if (m.linkedin_url) score++
      if (m.is_open_to_chat) score += 2
      return { ...m, _score: score }
    })

    const sorted = q
      ? scored
      : scored.sort((a, b) => b._score - a._score)

    const result = sorted.map(({ _score: _s, linkedin_url: _l, ...m }) => m)

    return NextResponse.json({ data: result, total: count, page, limit })
  } catch (error) {
    console.error('Directory error:', error)
    return serverError()
  }
}
