import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { badRequest, unauthorized, serverError } from '@/lib/api/error';
import { parseBody } from '@/lib/api/validation';
import { z } from 'zod';

function isMissingNotificationsTable(error: { code?: string } | null) {
  return error?.code === 'PGRST205' || error?.code === '42P01';
}

const PatchNotificationSchema = z.union([
  z.object({
    markAllRead: z.literal(true),
  }).strict(),
  z.object({
    notificationIds: z.array(z.string().min(1, '알림 ID가 올바르지 않습니다')).min(1, '읽음 처리할 알림을 선택해주세요'),
  }).strict(),
]);

export async function GET() {
  try {
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
      if (isMissingNotificationsTable(error)) {
        return NextResponse.json({ data: [], unreadCount: 0 });
      }
      return serverError('알림을 불러오는 중 오류가 발생했습니다');
    }

    const { count: unreadCount, error: countError } = await supabase
      .from('vcx_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (countError) {
      if (isMissingNotificationsTable(countError)) {
        return NextResponse.json({ data: notifications ?? [], unreadCount: 0 });
      }
      return serverError('알림을 불러오는 중 오류가 발생했습니다');
    }

    return NextResponse.json({ data: notifications ?? [], unreadCount: unreadCount ?? 0 });
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return serverError();
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorized();
    }

    const { data: payload, error: parseError } = await parseBody(req, PatchNotificationSchema);
    if (parseError) return parseError;

    if ('markAllRead' in payload && payload.markAllRead === true) {
      const { error } = await supabase
        .from('vcx_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        if (isMissingNotificationsTable(error)) {
          return NextResponse.json({ success: true });
        }
        return serverError('알림 업데이트 중 오류가 발생했습니다');
      }

      return NextResponse.json({ success: true });
    }

    if ('notificationIds' in payload) {
      const { error } = await supabase
        .from('vcx_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .in('id', payload.notificationIds);

      if (error) {
        if (isMissingNotificationsTable(error)) {
          return NextResponse.json({ success: true });
        }
        return serverError('알림 업데이트 중 오류가 발생했습니다');
      }

      return NextResponse.json({ success: true });
    }

    return badRequest('notificationIds 또는 markAllRead 필드가 필요합니다');
  } catch (error) {
    console.error('PATCH /api/notifications error:', error);
    return serverError();
  }
}
