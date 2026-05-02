import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getVcxUser } from '@/lib/auth/get-vcx-user'
import { unauthorized, serverError } from '@/lib/api/error'
import { parseBody } from '@/lib/api/validation'
import { isMissingSchemaError } from '@/lib/api/supabase-errors'
import {
  INTEREST_TAG_LIMIT,
  normalizeInterestTags,
} from '@/constants/profile'

export async function GET() {
  try {
    const user = await getVcxUser()
    if (!user) return unauthorized()

    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = supabase as any
    const { data, error } = await supa
      .from('vcx_feed_interests')
      .select('chips')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error && !isMissingSchemaError(error)) {
      console.error('Feed interests GET error:', error)
      return serverError()
    }

    if (!error && data) {
      return NextResponse.json({ chips: data.chips ?? [] })
    }

    const { data: member, error: memberError } = await supa
      .from('vcx_members')
      .select('professional_fields')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    if (memberError && memberError.code !== 'PGRST116') {
      console.error('Feed interests member fallback error:', memberError)
      return serverError()
    }

    return NextResponse.json({ chips: member?.professional_fields ?? [] })
  } catch (error) {
    console.error('Feed interests GET error:', error)
    return serverError()
  }
}

const schema = z.object({
  chips: z
    .array(z.string().trim().min(1, '관심 분야를 입력해주세요'))
    .max(INTEREST_TAG_LIMIT, `관심 분야는 최대 ${INTEREST_TAG_LIMIT}개까지 선택할 수 있습니다`)
    .transform(normalizeInterestTags),
}).strict()

export async function POST(request: NextRequest) {
  try {
    const user = await getVcxUser()
    if (!user) return unauthorized()

    const supabase = await createClient()
    const parsed = await parseBody(request, schema)
    if (parsed.error) return parsed.error

    const { chips } = parsed.data

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = supabase as any
    const { data, error } = await supa
      .from('vcx_feed_interests')
      .upsert(
        { user_id: user.id, chips, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error && !isMissingSchemaError(error)) {
      console.error('Feed interests upsert error:', error)
      return serverError()
    }

    const { error: memberError } = await supa
      .from('vcx_members')
      .update({ professional_fields: chips, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .eq('is_active', true)

    if (memberError) {
      console.error('Feed interests member sync error:', memberError)
      return serverError()
    }

    return NextResponse.json({ chips: data?.chips ?? chips })
  } catch (error) {
    console.error('Feed interests POST error:', error)
    return serverError()
  }
}
