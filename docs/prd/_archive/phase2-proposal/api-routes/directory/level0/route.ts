import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, serverError } from '@/lib/api/error'
import type { DirectoryLevel0Bucket } from '@/types/vcx-schema-v61'

export const dynamic = 'force-dynamic'

/**
 * Directory Level 0 집계 엔드포인트.
 * "시대의 인재들이 실재한다"는 사회적 증명을 개인정보 노출 없이 제공.
 * k-anonymity floor(k=10)는 025d 함수 `vcx_safe_count`가 DB 또는 API 레이어에서 강제.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return unauthorized()

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

    const [industry, tier, totals] = await Promise.all([
      fetchIndustryBuckets(supabase),
      fetchTierBuckets(supabase),
      fetchTotals(supabase),
    ])

    return NextResponse.json({
      data: {
        by_industry: industry,
        by_tier: tier,
        totals,
      },
      meta: { disclosure_level: 0, k_anonymity: 10 },
    })
  } catch (error) {
    console.error('Directory Level 0 error:', error)
    return serverError()
  }
}

type SupabaseLike = Awaited<ReturnType<typeof createClient>>

async function fetchIndustryBuckets(supabase: SupabaseLike): Promise<DirectoryLevel0Bucket[]> {
  const viewClient = supabase as unknown as {
    from: (t: string) => ReturnType<typeof supabase.from>
  }

  const { data, error } = await viewClient
    .from('members_directory_level0_industry')
    .select('industry, safe_count, safe_num')
    .order('safe_num', { ascending: false, nullsFirst: false })

  if (error || !data) return []

  const rows = data as unknown as Array<{
    industry: string | null
    safe_count: string | null
    safe_num: number | null
  }>

  return rows.map((row) => ({
    dimension: 'industry',
    label: row.industry ?? '기타',
    safe_count: row.safe_count,
    safe_count_numeric: row.safe_num,
  }))
}

async function fetchTierBuckets(supabase: SupabaseLike): Promise<DirectoryLevel0Bucket[]> {
  const { data, error } = await supabase
    .from('vcx_members')
    .select('member_tier')
    .eq('is_active', true)

  if (error || !data) return []

  const counts = new Map<string, number>()
  for (const row of data) {
    const t = (row as { member_tier: string | null }).member_tier ?? 'unknown'
    counts.set(t, (counts.get(t) ?? 0) + 1)
  }

  return Array.from(counts.entries()).map(([tier, n]) => ({
    dimension: 'function',
    label: tier === 'core' ? 'Core' : tier === 'endorsed' ? 'Endorsed' : tier,
    safe_count: applyAnonymityFloor(n),
    safe_count_numeric: n < 10 ? null : Math.floor(n / 10) * 10,
  }))
}

async function fetchTotals(supabase: SupabaseLike) {
  const { count, error } = await supabase
    .from('vcx_members')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)

  if (error || count === null) {
    return { safe_count: null, safe_count_numeric: null }
  }

  return {
    safe_count: applyAnonymityFloor(count),
    safe_count_numeric: count < 10 ? null : Math.floor(count / 10) * 10,
  }
}

function applyAnonymityFloor(n: number): string {
  if (n < 10) return '10명 미만'
  if (n < 50) return `${Math.floor(n / 10) * 10}+`
  if (n < 500) return `${Math.floor(n / 50) * 50}+`
  return `${Math.floor(n / 100) * 100}+`
}
