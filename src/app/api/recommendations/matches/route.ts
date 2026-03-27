import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type MemberRow = {
  id: string
  user_id: string | null
  name: string
  current_company: string | null
  title: string | null
  professional_fields: string[] | null
  years_of_experience: number | null
  industry: string | null
  is_open_to_chat: boolean | null
  bio: string | null
  linkedin_url: string | null
}

function calcScore(current: MemberRow, candidate: MemberRow): number {
  let score = 0

  // professional_fields overlap × 30
  const currentFields = current.professional_fields ?? []
  const candidateFields = candidate.professional_fields ?? []
  const overlap = currentFields.filter((f) => candidateFields.includes(f)).length
  score += overlap * 30

  // same industry × 20
  if (current.industry && candidate.industry && current.industry === candidate.industry) {
    score += 20
  }

  // years_of_experience diff ≤ 5 × 15
  if (
    current.years_of_experience != null &&
    candidate.years_of_experience != null &&
    Math.abs(current.years_of_experience - candidate.years_of_experience) <= 5
  ) {
    score += 15
  }

  // is_open_to_chat × 20
  if (candidate.is_open_to_chat) {
    score += 20
  }

  // profile completeness × 15
  const isComplete =
    candidate.name &&
    candidate.current_company &&
    candidate.title &&
    candidate.linkedin_url
  if (isComplete) {
    score += 15
  }

  return score
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // Fetch current user's member profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: currentMember, error: currentErr } = await (supabase as any)
      .from('vcx_members')
      .select(
        'id, name, current_company, title, professional_fields, years_of_experience, industry, is_open_to_chat, bio, linkedin_url'
      )
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    if (currentErr || !currentMember) {
      return NextResponse.json({ error: '멤버 프로필을 찾을 수 없습니다' }, { status: 404 })
    }

    // Get peer coffee chat partners already in progress (matched)
    const { data: activeChats } = await supabase
      .from('peer_coffee_chats')
      .select('author_id')
      .eq('status', 'matched')

    // Get applications where current user is applicant for matched chats
    const { data: myApplications } = await supabase
      .from('peer_coffee_applications')
      .select('chat_id, peer_coffee_chats(author_id)')
      .eq('applicant_id', currentMember.id)
      .eq('status', 'accepted')

    // Build excluded member id set
    const excludedIds = new Set<string>()
    excludedIds.add(currentMember.id)

    // Exclude authors of chats that are matched and belong to current user
    if (activeChats) {
      for (const chat of activeChats) {
        if (chat.author_id === currentMember.id) {
          // The current user's own matched chats — exclude applicants (handled below)
        }
      }
    }

    // Exclude members already in an accepted coffee chat with current user
    if (myApplications) {
      for (const app of myApplications as unknown as { chat_id: string; peer_coffee_chats: { author_id: string } | null }[]) {
        if (app.peer_coffee_chats?.author_id) {
          excludedIds.add(app.peer_coffee_chats.author_id)
        }
      }
    }

    // Also exclude applicants who have been accepted into current user's chats
    const { data: myMatchedChats } = await supabase
      .from('peer_coffee_chats')
      .select('id')
      .eq('author_id', currentMember.id)
      .eq('status', 'matched')

    if (myMatchedChats && myMatchedChats.length > 0) {
      const chatIds = myMatchedChats.map((c) => c.id)
      const { data: acceptedApplicants } = await supabase
        .from('peer_coffee_applications')
        .select('applicant_id')
        .in('chat_id', chatIds)
        .eq('status', 'accepted')

      if (acceptedApplicants) {
        for (const a of acceptedApplicants) {
          excludedIds.add(a.applicant_id)
        }
      }
    }

    // Fetch all active members except excluded
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: candidates, error: candidatesErr } = await (supabase as any)
      .from('vcx_members')
      .select(
        'id, name, current_company, title, professional_fields, years_of_experience, industry, is_open_to_chat, bio, linkedin_url'
      )
      .eq('is_active', true)
      .not('id', 'in', `(${[...excludedIds].join(',')})`)

    if (candidatesErr) {
      return NextResponse.json({ error: '멤버 조회에 실패했습니다' }, { status: 500 })
    }

    const current = currentMember as MemberRow
    const scored = ((candidates ?? []) as MemberRow[])
      .map((candidate) => {
        const c = candidate as MemberRow
        const score = calcScore(current, c)
        const maxScore = 100
        const pct = Math.min(Math.round((score / maxScore) * 100), 100)

        // Compute common fields for display
        const currentFields = current.professional_fields ?? []
        const candidateFields = c.professional_fields ?? []
        const commonFields = currentFields.filter((f) => candidateFields.includes(f))

        return {
          id: c.id,
          name: c.name,
          title: c.title,
          current_company: c.current_company,
          industry: c.industry,
          professional_fields: c.professional_fields,
          is_open_to_chat: c.is_open_to_chat,
          score,
          matchPercent: pct,
          commonFields,
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)

    return NextResponse.json({ data: scored })
  } catch (error) {
    console.error('Matches recommendation error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
