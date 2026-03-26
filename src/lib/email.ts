import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || '')
}

interface SendInviteEmailParams {
  to: string
  inviterName: string
  token: string
  memberTier: 'core' | 'endorsed'
}

export async function sendInviteEmail({ to, inviterName, token, memberTier }: SendInviteEmailParams) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const inviteUrl = `${siteUrl}/invite/accept?token=${token}`

  if (!process.env.RESEND_API_KEY) {
    console.log('=== INVITE EMAIL (dev mode) ===')
    console.log(`To: ${to}`)
    console.log(`From: ${inviterName}`)
    console.log(`Tier: ${memberTier}`)
    console.log(`Link: ${inviteUrl}`)
    console.log('===============================')
    return { success: true, dev: true }
  }

  const { data, error } = await getResend().emails.send({
    from: 'ValueConnect X <invite@valueconnectx.com>',
    to,
    subject: `${inviterName}님이 ValueConnect X에 초대했습니다`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#0F172A;font-family:Georgia,serif;">
        <div style="max-width:520px;margin:40px auto;background:#f0ebe2;padding:48px 40px;">
          <div style="text-align:center;margin-bottom:32px;">
            <span style="font-size:20px;font-weight:800;color:#1a1a1a;">ValueConnect</span>
            <span style="font-size:20px;font-weight:800;color:#c9a84c;">X</span>
          </div>
          <div style="width:32px;height:1.5px;background:#c9a84c;margin:0 auto 24px;"></div>
          <h1 style="font-size:22px;text-align:center;color:#1a1a1a;margin:0 0 16px;font-family:Georgia,serif;">
            당신은 이미 검증되었습니다
          </h1>
          <p style="font-size:14px;text-align:center;color:#666;line-height:1.8;font-family:system-ui,sans-serif;margin:0 0 32px;">
            <strong style="color:#1a1a1a;">${inviterName}</strong>님이 당신을 ValueConnect X 네트워크에 초대했습니다.<br/>
            ${memberTier === 'core' ? 'Core Member' : 'Endorsed Member'}로 초대되었습니다.
          </p>
          <div style="text-align:center;margin-bottom:32px;">
            <a href="${inviteUrl}" style="display:inline-block;background:#1a1a1a;color:#f0ebe2;font-size:14px;font-family:system-ui,sans-serif;padding:14px 32px;text-decoration:none;font-weight:600;">
              초대 수락하기 →
            </a>
          </div>
          <p style="font-size:12px;text-align:center;color:#999;font-family:system-ui,sans-serif;margin:0;">
            이 링크는 24시간 동안 유효합니다.
          </p>
        </div>
      </body>
      </html>
    `,
  })

  if (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
  return { success: true, data }
}

interface SendNotificationEmailParams {
  to: string
  type: string
  title: string
  body?: string
  link?: string
}

export async function sendNotificationEmail({
  to,
  type,
  title,
  body,
  link,
}: SendNotificationEmailParams) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const actionUrl = link ? `${siteUrl}${link}` : siteUrl

  const isApplied = type === 'coffeechat_applied' || type === 'peer_chat_applied'
  const isAccepted = type === 'coffeechat_accepted' || type === 'peer_chat_accepted'
  const isRejected = type === 'coffeechat_rejected' || type === 'peer_chat_rejected'

  let subject = title
  let actionLabel = '확인하기 →'
  let accentColor = '#c9a84c'

  if (isApplied) {
    subject = '새로운 커피챗 신청이 도착했습니다'
    actionLabel = '신청 확인하기 →'
  } else if (isAccepted) {
    subject = '커피챗 신청이 수락되었습니다'
    actionLabel = '커피챗 보기 →'
    accentColor = '#4caf7d'
  } else if (isRejected) {
    subject = '커피챗 신청 결과를 확인해주세요'
    actionLabel = '결과 확인하기 →'
    accentColor = '#999'
  }

  if (!process.env.RESEND_API_KEY) {
    console.log('=== NOTIFICATION EMAIL (dev mode) ===')
    console.log(`To: ${to}`)
    console.log(`Type: ${type}`)
    console.log(`Title: ${title}`)
    console.log(`Body: ${body ?? ''}`)
    console.log(`Link: ${actionUrl}`)
    console.log('=====================================')
    return { success: true, dev: true }
  }

  const { data, error } = await getResend().emails.send({
    from: 'ValueConnect X <noreply@valueconnectx.com>',
    to,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#0F172A;font-family:Georgia,serif;">
        <div style="max-width:520px;margin:40px auto;background:#f0ebe2;padding:48px 40px;">
          <div style="text-align:center;margin-bottom:32px;">
            <span style="font-size:20px;font-weight:800;color:#1a1a1a;">ValueConnect</span>
            <span style="font-size:20px;font-weight:800;color:#c9a84c;">X</span>
          </div>
          <div style="width:32px;height:1.5px;background:${accentColor};margin:0 auto 24px;"></div>
          <h1 style="font-size:20px;text-align:center;color:#1a1a1a;margin:0 0 16px;font-family:Georgia,serif;">
            ${title}
          </h1>
          ${body ? `<p style="font-size:14px;text-align:center;color:#666;line-height:1.8;font-family:system-ui,sans-serif;margin:0 0 32px;">${body}</p>` : '<div style="margin-bottom:32px;"></div>'}
          <div style="text-align:center;margin-bottom:32px;">
            <a href="${actionUrl}" style="display:inline-block;background:#1a1a1a;color:#f0ebe2;font-size:14px;font-family:system-ui,sans-serif;padding:14px 32px;text-decoration:none;font-weight:600;">
              ${actionLabel}
            </a>
          </div>
          <p style="font-size:12px;text-align:center;color:#999;font-family:system-ui,sans-serif;margin:0;">
            ValueConnect X — 검증된 핵심 인재 네트워크
          </p>
        </div>
      </body>
      </html>
    `,
  })

  if (error) {
    console.error('Notification email send error:', error)
    return { success: false, error }
  }
  return { success: true, data }
}
