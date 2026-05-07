'use client'

import { useState, useEffect, useCallback } from 'react'
import { CurationList } from '@/components/admin/curation/curation-list'
import { CurationForm } from '@/components/admin/curation/curation-form'
import type { FeedItem } from '@/components/admin/curation/curation-form'

type ModalMode = 'create' | 'edit' | null

export default function CurationPage() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [editingItem, setEditingItem] = useState<FeedItem | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/feed')
      if (!res.ok) {
        setError('피드 아이템을 불러오는데 실패했습니다')
        return
      }
      const json = await res.json()
      setItems(json.items ?? [])
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  function openCreate() {
    setEditingItem(null)
    setModalMode('create')
  }

  function openEdit(item: FeedItem) {
    setEditingItem(item)
    setModalMode('edit')
  }

  function closeModal() {
    setModalMode(null)
    setEditingItem(null)
  }

  function handleSuccess() {
    closeModal()
    fetchItems()
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div>
      {/* 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '28px', flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <h2 style={{
            fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 800,
            color: 'var(--color-vcx-dark)', margin: '0 0 4px', letterSpacing: '-0.5px',
          }}>
            큐레이션 피드 관리
          </h2>
          <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#888', margin: 0 }}>
            멤버에게 노출되는 피드 아이템을 생성, 편집, 삭제합니다
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            padding: '12px 24px', background: 'var(--color-vcx-gold)', color: '#fff',
            border: 'none', cursor: 'pointer', fontSize: '14px',
            fontFamily: 'system-ui, sans-serif', fontWeight: 700,
            letterSpacing: '0.04em',
          }}
        >
          + 새 아이템 생성
        </button>
      </div>

      {/* 아이템 수 */}
      {!loading && !error && (
        <p style={{
          fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#888',
          marginBottom: '16px',
        }}>
          총 {items.length}개 아이템
        </p>
      )}

      {/* 로딩 */}
      {loading && (
        <div style={{
          padding: '48px 24px', textAlign: 'center',
          fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#888',
        }}>
          불러오는 중...
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div style={{
          padding: '16px', background: '#fef2f2', border: '1px solid #fca5a5',
          fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#c0392b',
          marginBottom: '20px',
        }}>
          {error}
          <button
            onClick={fetchItems}
            style={{
              marginLeft: '12px', background: 'none', border: 'none', cursor: 'pointer',
              color: '#c0392b', fontWeight: 700, textDecoration: 'underline', fontSize: '14px',
            }}
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 목록 */}
      {!loading && !error && (
        <CurationList items={items} onEdit={openEdit} onDelete={handleDelete} />
      )}

      {/* 모달 */}
      {modalMode !== null && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            zIndex: 1000, padding: '40px 16px', overflowY: 'auto',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div style={{
            background: '#fff', width: '100%', maxWidth: '760px',
            padding: '40px', position: 'relative',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '32px',
            }}>
              <h3 style={{
                fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 800,
                color: 'var(--color-vcx-dark)', margin: 0,
              }}>
                {modalMode === 'create' ? '새 피드 아이템 생성' : '피드 아이템 편집'}
              </h3>
              <button
                onClick={closeModal}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '22px', color: '#888', lineHeight: 1,
                }}
                aria-label="닫기"
              >
                ×
              </button>
            </div>
            <CurationForm
              item={editingItem ?? undefined}
              onSuccess={handleSuccess}
              onCancel={closeModal}
            />
          </div>
        </div>
      )}
    </div>
  )
}
