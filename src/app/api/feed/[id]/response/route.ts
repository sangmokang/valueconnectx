export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, serverError } from '@/lib/api/error'
import { parseBody } from '@/lib/api/validation'

const schema = z.object({
  response: z.enum(['yes', 'skip']),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return unauthorized()

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
