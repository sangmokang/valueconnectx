export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getVcxUser } from '@/lib/auth/get-vcx-user'
import { unauthorized, serverError } from '@/lib/api/error'
import { parseBody } from '@/lib/api/validation'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getVcxUser()
    if (!user) return unauthorized()

    const supabase = await createClient()

    const { id } = await params

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

    const { id } = await params

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
