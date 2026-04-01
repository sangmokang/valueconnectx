import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, serverError } from '@/lib/api/error'
import { parseBody } from '@/lib/api/validation'

const schema = z.object({
  chips: z.array(z.string()),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return unauthorized()

    const parsed = await parseBody(request, schema)
    if (parsed.error) return parsed.error

    const { chips } = parsed.data

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('vcx_feed_interests')
      .upsert(
        { user_id: user.id, chips, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('Feed interests upsert error:', error)
      return serverError()
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Feed interests POST error:', error)
    return serverError()
  }
}
