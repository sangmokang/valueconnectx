import { NextRequest, NextResponse } from 'next/server'
import { getVcxAuthContext } from '@/lib/auth/get-vcx-auth-context'
import { unauthorized, notFound, forbidden, serverError } from '@/lib/api/error'

type PeerBriefApplication = {
  id: string
  applicant_id: string
  host_brief: string | null
  applicant_brief: string | null
  brief_generated_at: string | null
  status: string
  message: string | null
}

type PeerChatBriefRow = {
  author_id: string
  title: string
  content: string
}

type PeerApplicationQueryTable = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => Promise<{ data: PeerBriefApplication | null; error: unknown }>
        }
      }
    }
  }
}

function buildFallbackBrief(chat: PeerChatBriefRow, application: PeerBriefApplication, role: 'host' | 'applicant') {
  const counterpart = role === 'host' ? '신청자' : '작성자'
  const message = application.message ? `\n신청 메시지: ${application.message}` : ''

  return [
    '[AI 브리프 기본 안내]',
    `"${chat.title}" 커피챗이 수락되었습니다. AI 브리프 생성 환경이 준비되지 않아 기본 브리프를 제공합니다.`,
    `${counterpart}와 대화하기 전에 글의 목적, 기대하는 도움, 다음 액션 1가지를 정리해주세요.`,
    `주제 요약: ${chat.content.slice(0, 240)}${message}`,
  ].join('\n')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, supabase } = await getVcxAuthContext(request)
    if (!user) return unauthorized()

    const { id: chatId } = await params

    const { data: chat } = await supabase
      .from('peer_coffee_chats')
      .select('author_id, title, content')
      .eq('id', chatId)
      .single()

    if (!chat) return notFound('커피챗을 찾을 수 없습니다')

    const isHost = chat.author_id === user.id
    const { data: application, error } = await (supabase.from('peer_coffee_applications') as unknown as PeerApplicationQueryTable)
      .select('id, applicant_id, host_brief, applicant_brief, brief_generated_at, status, message')
      .eq('chat_id', chatId)
      .eq('status', 'accepted')
      .eq(isHost ? 'chat_id' : 'applicant_id', isHost ? chatId : user.id)
      .maybeSingle()

    if (error) return serverError('브리프 조회에 실패했습니다')
    if (!application) {
      if (isHost) return NextResponse.json({ brief: null, briefGeneratedAt: null })
      return forbidden('이 커피챗의 브리프에 접근할 권한이 없습니다')
    }

    const storedBrief = isHost ? application.host_brief : application.applicant_brief
    const role = isHost ? 'host' : 'applicant'
    const isFallback = !storedBrief

    return NextResponse.json({
      brief: storedBrief || buildFallbackBrief(chat, application, role),
      briefGeneratedAt: application.brief_generated_at,
      applicationId: application.id,
      isFallback,
    })
  } catch {
    return serverError()
  }
}
