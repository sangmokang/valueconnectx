import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function getWeekAgo(): string {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString()
}

function getLast7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { data: admin } = await supabase
      .from('vcx_members')
      .select('id, system_role')
      .eq('id', user.id)
      .in('system_role', ['admin', 'super_admin'])
      .single()
    if (!admin) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 })
    }

    const weekAgo = getWeekAgo()
    const days = getLast7Days()

    // Total counts
    const [
      { count: totalMembers },
      { count: newMembers },
      { count: totalCeoCoffee },
      { count: newCeoCoffee },
      { count: totalPeerCoffee },
      { count: newPeerCoffee },
      { count: totalPosts },
      { count: newPosts },
      { count: totalPositions },
      { count: newPositions },
    ] = await Promise.all([
      supabase.from('vcx_members').select('*', { count: 'exact', head: true }),
      supabase.from('vcx_members').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
      supabase.from('vcx_ceo_coffee_sessions').select('*', { count: 'exact', head: true }),
      supabase.from('vcx_ceo_coffee_sessions').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
      supabase.from('peer_coffee_chats').select('*', { count: 'exact', head: true }),
      supabase.from('peer_coffee_chats').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
      supabase.from('community_posts').select('*', { count: 'exact', head: true }),
      supabase.from('community_posts').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
      supabase.from('positions').select('*', { count: 'exact', head: true }),
      supabase.from('positions').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
    ])

    // Daily member signups (last 7 days)
    const startOfRange = days[0] + 'T00:00:00.000Z'
    const { data: recentMembers } = await supabase
      .from('vcx_members')
      .select('created_at')
      .gte('created_at', startOfRange)

    const { data: recentCoffee } = await supabase
      .from('vcx_ceo_coffee_sessions')
      .select('created_at')
      .gte('created_at', startOfRange)

    const { data: recentPeerCoffee } = await supabase
      .from('peer_coffee_chats')
      .select('created_at')
      .gte('created_at', startOfRange)

    // Build daily chart data
    const membersByDay: Record<string, number> = {}
    const coffeeByDay: Record<string, number> = {}
    days.forEach(d => { membersByDay[d] = 0; coffeeByDay[d] = 0 })

    ;(recentMembers ?? []).forEach(m => {
      const day = m.created_at.slice(0, 10)
      if (day in membersByDay) membersByDay[day]++
    })
    ;(recentCoffee ?? []).forEach(c => {
      const day = c.created_at.slice(0, 10)
      if (day in coffeeByDay) coffeeByDay[day]++
    })
    ;(recentPeerCoffee ?? []).forEach(c => {
      const day = c.created_at.slice(0, 10)
      if (day in coffeeByDay) coffeeByDay[day]++
    })

    const dailyChart = days.map(day => ({
      date: day,
      label: day.slice(5), // MM-DD
      members: membersByDay[day],
      coffeechats: coffeeByDay[day],
    }))

    // Field distribution (pie chart)
    const { data: allMembers } = await supabase
      .from('vcx_members')
      .select('professional_fields')
      .eq('is_active', true)

    const fieldCounts: Record<string, number> = {}
    ;(allMembers ?? []).forEach(m => {
      const fields: string[] = m.professional_fields ?? []
      fields.forEach(f => {
        if (f) fieldCounts[f] = (fieldCounts[f] ?? 0) + 1
      })
    })

    const fieldDistribution = Object.entries(fieldCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }))

    return NextResponse.json({
      kpi: {
        totalMembers: totalMembers ?? 0,
        newMembers: newMembers ?? 0,
        totalCoffeechats: (totalCeoCoffee ?? 0) + (totalPeerCoffee ?? 0),
        newCoffeechats: (newCeoCoffee ?? 0) + (newPeerCoffee ?? 0),
        totalPosts: totalPosts ?? 0,
        newPosts: newPosts ?? 0,
        totalPositions: totalPositions ?? 0,
        newPositions: newPositions ?? 0,
      },
      dailyChart,
      fieldDistribution,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
