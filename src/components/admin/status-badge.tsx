const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: '대기', color: 'var(--color-vcx-gold)', bgColor: 'rgba(201,168,76,0.1)' },
  approved: { label: '승인', color: '#10B981', bgColor: 'rgba(16,185,129,0.1)' },
  rejected: { label: '거절', color: '#EF4444', bgColor: 'rgba(239,68,68,0.1)' },
  accepted: { label: '수락', color: '#10B981', bgColor: 'rgba(16,185,129,0.1)' },
  expired: { label: '만료', color: 'var(--color-vcx-sub-4)', bgColor: 'rgba(136,136,136,0.1)' },
  revoked: { label: '취소', color: '#EF4444', bgColor: 'rgba(239,68,68,0.1)' },
}

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, color: 'var(--color-vcx-sub-4)', bgColor: 'rgba(136,136,136,0.1)' }
  return (
    <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '11px', fontWeight: 600, color: config.color, background: config.bgColor, padding: '3px 10px', borderRadius: 0, letterSpacing: '0.05em' }}>
      {config.label}
    </span>
  )
}
