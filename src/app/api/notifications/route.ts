import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { badRequest, unauthorized, serverError } from '@/lib/api/error';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return unauthorized();
  }

  const { data: notifications, error } = await supabase
    .from('vcx_notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return serverError('알림을 불러오는 중 오류가 발생했습니다');
  }

  const unreadCount = (notifications ?? []).filter((n) => !n.is_read).length;

  return NextResponse.json({ data: notifications ?? [], unreadCount });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return unauthorized();
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest('요청 본문이 올바르지 않습니다');
  }

  if (typeof body !== 'object' || body === null) {
    return badRequest('요청 본문이 올바르지 않습니다');
  }

  const payload = body as Record<string, unknown>;

  if (payload.markAllRead === true) {
    const { error } = await supabase
      .from('vcx_notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      return serverError('알림 업데이트 중 오류가 발생했습니다');
    }

    return NextResponse.json({ success: true });
  }

  if (
    Array.isArray(payload.notificationIds) &&
    payload.notificationIds.length > 0
  ) {
    const ids = payload.notificationIds as string[];

    const { error } = await supabase
      .from('vcx_notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .in('id', ids);

    if (error) {
      return serverError('알림 업데이트 중 오류가 발생했습니다');
    }

    return NextResponse.json({ success: true });
  }

  return badRequest('notificationIds 또는 markAllRead 필드가 필요합니다');
}
