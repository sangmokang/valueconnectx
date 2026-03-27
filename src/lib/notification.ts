import { createAdminClient } from '@/lib/supabase/admin'
import { sendNotificationEmail } from '@/lib/email'

export type NotificationType =
  | 'coffeechat_applied'
  | 'coffeechat_accepted'
  | 'coffeechat_rejected'
  | 'peer_chat_applied'
  | 'peer_chat_accepted'
  | 'peer_chat_rejected'
  | 'invite_accepted'
  | 'community_comment'
  | 'community_reaction'
  | 'position_interest'

interface NotificationData {
  title: string
  body?: string
  link?: string
}

export async function sendNotification(
  userId: string,
  type: NotificationType,
  data: NotificationData
): Promise<void> {
  const adminClient = createAdminClient()

  // 1. In-app notification insert (admin client bypasses RLS)
  try {
    await adminClient.from('vcx_notifications').insert({
      user_id: userId,
      type,
      title: data.title,
      body: data.body || null,
      link: data.link || null,
    })
  } catch (error) {
    console.error('Notification insert failed:', error)
  }

  // 2. Email notification (best-effort)
  try {
    const { data: userData } = await adminClient.auth.admin.getUserById(userId)
    if (userData?.user?.email) {
      await sendNotificationEmail({
        to: userData.user.email,
        type,
        title: data.title,
        body: data.body,
        link: data.link,
      })
    }
  } catch (error) {
    console.error('Email notification failed:', error)
  }
}
