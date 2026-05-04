export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getVcxUser } from '@/lib/auth/get-vcx-user'
import { badRequest, unauthorized, serverError } from '@/lib/api/error'
import { parseBody } from '@/lib/api/validation'

const paramsSchema = z.object({
  id: z.string().trim().min(1, '피드 항목을 찾을 수 없습니다'),
})

function parseFeedParams(params: { id: string }) {
  const parsed = paramsSchema.safeParse(params)
  if (!parsed.success) {
    return {
      data: null,
      error: badRequest('유효하지 않은 피드 항목입니다', parsed.error.issues),
    }
  }

  return { data: parsed.data, error: null }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getVcxUser()
    if (!user) return unauthorized()

    const supabase = await createClient()

    const parsedParams = parseFeedParams(await params)
    if (parsedParams.error) return parsedParams.error
    const { id } = parsedParams.data

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('vcx_feed_responses')
      .delete()
      .eq('user_id', user.id)
      .eq('feed_item_id', id)

    if (error) {
      console.error('Feed response DELETE error:', error)
      return serverError()
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Feed response DELETE error:', error)
    return serverError()
  }
}

const schema = z.object({
  response: z.enum(['yes', 'skip']),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getVcxUser()
    if (!user) return unauthorized()

    const supabase = await createClient()

    const parsedParams = parseFeedParams(await params)
    if (parsedParams.error) return parsedParams.error
    const { id } = parsedParams.data

    const parsed = await parseBody(request, schema)
    if (parsed.error) return parsed.error

    const { response } = parsed.data

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('vcx_feed_responses')
      .upsert(
        { user_id: user.id, feed_item_id: id, response },
        { onConflict: 'user_id,feed_item_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('Feed response upsert error:', error)
      return serverError()
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Feed response POST error:', error)
    return serverError()
  }
}
