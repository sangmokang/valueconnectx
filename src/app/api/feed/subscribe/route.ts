export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, serverError } from '@/lib/api/error'
import { parseBody } from '@/lib/api/validation'

const schema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요'),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return unauthorized()

    const parsed = await parseBody(request, schema)
    if (parsed.error) return parsed.error

    const { email } = parsed.data

    const { data, error } = // eslint-disable-next-line @typescript-eslint/no-explicit-any
await (supabase as any)
      .from('vcx_feed_subscriptions')
      .insert({ user_id: user.id, email, active: true })
      .select()
      .single()

    if (error) {
      console.error('Feed subscribe insert error:', error)
      return serverError()
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Feed subscribe POST error:', error)
    return serverError()
  }
}

