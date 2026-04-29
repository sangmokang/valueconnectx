'use client'

import { useState } from 'react'
import type { FeedItem } from './curation-form'

interface CurationListProps {
  items: FeedItem[]
  onEdit: (item: FeedItem) => void
  onDelete: (id: string) => void
}

export function CurationList({ items, onEdit, onDelete }: CurationListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('이 피드 아이템을 삭제하시겠습니까?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/feed/${id}`, { method: 'DELETE' })
      if (res.ok) {
        onDelete(id)
      } else {
        alert('삭제에 실패했습니다')
      }
    } catch {
      alert('네트워크 오류가 발생했습니다')
    } finally {
      setDeletingId(null)
    }
  }

  if (items.length === 0) {
    return (
      <div style={{
        padding: '48px 24px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.08)',
        background: '#fff', fontFamily: 'system-ui, sans-serif',
      }}>
        <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>등록된 피드 아이템이 없습니다</p>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%', borderCollapse: 'collapse', fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
      }}>
        <thead>
          <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.1)' }}>
            {['회사', '역할', '레벨', '위치', '게시일', '익스클루시브', '액션'].map((h) => (
              <th
                key={h}
                style={{
                  padding: '12px 16px', textAlign: 'left', fontWeight: 700,
                  color: '#1a1a1a', fontSize: '11px', letterSpacing: '0.08em',
                  textTransform: 'uppercase', whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr
              key={item.id}
              style={{
                background: idx % 2 === 0 ? '#fff' : '#faf8f4',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                <div style={{ fontWeight: 700, color: '#1a1a1a' }}>{item.company}</div>
                {item.company_tag && (
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{item.company_tag}</div>
                )}
              </td>
              <td style={{ padding: '14px 16px', color: '#333', maxWidth: '200px' }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.role}
                </div>
              </td>
              <td style={{ padding: '14px 16px', color: '#555', whiteSpace: 'nowrap' }}>
                {item.level ?? '—'}
              </td>
              <td style={{ padding: '14px 16px', color: '#555', whiteSpace: 'nowrap' }}>
                {item.location ?? '—'}
              </td>
              <td style={{ padding: '14px 16px', color: '#555', whiteSpace: 'nowrap' }}>
                {item.published_at
                  ? new Date(item.published_at).toLocaleDateString('ko-KR', {
                      year: 'numeric', month: '2-digit', day: '2-digit',
                    })
                  : '—'}
              </td>
              <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                {item.exclusive ? (
                  <span style={{
                    display: 'inline-block', padding: '3px 8px',
                    background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.4)',
                    color: '#a07830', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em',
                  }}>
                    EXCLUSIVE
                  </span>
                ) : (
                  <span style={{ color: '#bbb', fontSize: '12px' }}>—</span>
                )}
              </td>
              <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                <button
                  onClick={() => onEdit(item)}
                  style={{
                    padding: '6px 14px', background: 'transparent',
                    border: '1px solid rgba(0,0,0,0.2)', cursor: 'pointer',
                    fontSize: '12px', fontWeight: 600, fontFamily: 'system-ui, sans-serif',
                    marginRight: '8px',
                  }}
                >
                  편집
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  style={{
                    padding: '6px 14px',
                    background: deletingId === item.id ? '#999' : 'transparent',
                    border: '1px solid rgba(192,57,43,0.4)',
                    cursor: deletingId === item.id ? 'not-allowed' : 'pointer',
                    fontSize: '12px', fontWeight: 600, color: '#c0392b',
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  {deletingId === item.id ? '삭제 중...' : '삭제'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
