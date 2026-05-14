import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, serverError } from '@/lib/api/error'
import { isMissingSchemaError } from '@/lib/api/supabase-errors'

export const dynamic = 'force-dynamic'

type PeerChatRow = {
  id: string
  title: string
  status: 'open' | 'matched' | 'closed'
  created_at: string
  category: string
}

type PeerApplicationRow = {
  id: string
  chat_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  chat: { id: string; title: string; status: string } | null
}

type CeoApplicationRow = {
  id: string
  session_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  session: { id: string; title: string; status: string; session_date: string } | null
}

export type MyCoffeechatItem = {
  id: string
  kind: 'peer_authored' | 'peer_applied' | 'ceo_applied'
  title: string
  status: string
  created_at: string
  link: string
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return unauthorized()

    const items: MyCoffeechatItem[] = []

    // 1) peer chats authored by me
    {
      const { data, error } = await supabase
        .from('peer_coffee_chats')
        .select('id, title, status, created_at, category')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })

      if (error && !isMissingSchemaError(error)) {
        console.error('My coffeechats peer authored error:', error)
      } else {
        for (const row of (data ?? []) as PeerChatRow[]) {
          items.push({
            id: `peer-chat-${row.id}`,
            kind: 'peer_authored',
            title: row.title,
            status: row.status,
            created_at: row.created_at,
            link: `/coffeechat/${row.id}`,
          })
        }
      }
    }

    // 2) peer applications I sent
    {
      const { data, error } = await supabase
        .from('peer_coffee_applications')
        .select('id, chat_id, status, created_at, chat:peer_coffee_chats(id, title, status)')
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false })

      if (error && !isMissingSchemaError(error)) {
        console.error('My coffeechats peer applied error:', error)
      } else {
        for (const row of (data ?? []) as unknown as PeerApplicationRow[]) {
          items.push({
            id: `peer-app-${row.id}`,
            kind: 'peer_applied',
            title: row.chat?.title ?? '(삭제된 글)',
            status: row.status,
            created_at: row.created_at,
            link: row.chat ? `/coffeechat/${row.chat.id}` : '/coffeechat',
          })
        }
      }
    }

    // 3) CEO coffeechat applications I sent
    {
      const { data, error } = await supabase
        .from('vcx_coffee_applications')
        .select(
          'id, session_id, status, created_at, session:vcx_ceo_coffee_sessions(id, title, status, session_date)'
        )
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false })

      if (error && !isMissingSchemaError(error)) {
        console.error('My coffeechats ceo applied error:', error)
      } else {
        for (const row of (data ?? []) as unknown as CeoApplicationRow[]) {
          items.push({
            id: `ceo-app-${row.id}`,
            kind: 'ceo_applied',
            title: row.session?.title ?? '(삭제된 세션)',
            status: row.status,
            created_at: row.created_at,
            link: row.session ? `/ceo-coffeechat/${row.session.id}` : '/ceo-coffeechat',
          })
        }
      }
    }

    items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    return NextResponse.json({ data: items })
  } catch (error) {
    console.error('GET /api/me/coffeechats error:', error)
    return serverError()
  }
}
