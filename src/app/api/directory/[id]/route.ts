import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, notFound, serverError } from '@/lib/api/error'
import { checkDirectoryAccess } from '@/lib/anti-scraping'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return unauthorized()

    const { data: currentMember } = await supabase
      .from('vcx_members')
      .select('id')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()
    if (!currentMember) return forbidden('VCX 멤버만 접근할 수 있습니다')

    const { action, message } = await checkDirectoryAccess(user.id)
    if (action === 'restrict' || action === 'block') {
      return NextResponse.json({ error: message }, { status: 429 })
    }

    const { id } = await params

    const { data, error } = await supabase
      .from('vcx_members')
      .select(
        'id, name, email, current_company, title, professional_fields, years_of_experience, bio, linkedin_url, member_tier, avatar_url, join_date, industry, location, is_open_to_chat, profile_visibility, endorsed_by_name'
      )
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error || !data) return notFound('멤버를 찾을 수 없습니다')

    const response = NextResponse.json({ data })
    if (action === 'warn') {
      response.headers.set('x-vcx-scraping-warning', 'true')
    }
    return response
  } catch (error) {
    console.error('Directory [id] error:', error)
    return serverError()
  }
}
