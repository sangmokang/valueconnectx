'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const categoryOptions = [
  { value: 'general', label: '일반' },
  { value: 'career', label: '커리어' },
  { value: 'hiring', label: '채용' },
  { value: 'mentoring', label: '멘토링' },
]

interface PeerChatFormProps {
  initialData?: {
    title: string
    content: string
    category: 'general' | 'career' | 'hiring' | 'mentoring'
  }
  chatId?: string
}

export function PeerChatForm({ initialData, chatId }: PeerChatFormProps) {
  const isEdit = !!chatId && !!initialData
  const router = useRouter()
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [content, setContent] = useState(initialData?.content ?? '')
  const [category, setCategory] = useState<'general' | 'career' | 'hiring' | 'mentoring'>(initialData?.category ?? 'general')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = isEdit ? `/api/peer-coffeechat/${chatId}` : '/api/peer-coffeechat'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content: content.trim(), category }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? (isEdit ? '글 수정에 실패했습니다' : '글 작성에 실패했습니다'))
        return
      }
      const targetId = isEdit ? chatId : data.data.id
      router.push(`/coffeechat/${targetId}`)
      router.refresh()
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Category */}
      <div>
        <label className="vcx-label text-vcx-sub-3 block mb-2">카테고리</label>
        <div className="flex flex-wrap gap-2">
          {categoryOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCategory(opt.value as typeof category)}
              className={`vcx-label px-4 py-2 border transition-colors ${
                category === opt.value
                  ? 'border-[#c9a84c] text-[#c9a84c] bg-[#fdf8f0]'
                  : 'border-[#ccc] text-vcx-sub-4 hover:border-[#1a1a1a]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="vcx-label text-vcx-sub-3 block mb-2">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="커피챗 제목을 입력해주세요"
          maxLength={100}
          required
          className="w-full border border-[#1a1a1a] bg-white px-4 py-3 text-[14px] font-vcx-sans text-vcx-dark placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]"
          disabled={loading}
        />
        <p className="text-[11px] text-vcx-sub-5 text-right mt-1">{title.length}/100</p>
      </div>

      {/* Content */}
      <div>
        <label className="vcx-label text-vcx-sub-3 block mb-2">
          내용 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="어떤 분과 커피챗을 하고 싶으신지, 어떤 주제로 이야기 나누고 싶은지 자유롭게 적어주세요"
          maxLength={3000}
          rows={8}
          required
          className="w-full border border-[#1a1a1a] bg-white px-4 py-3 text-[14px] font-vcx-sans text-vcx-dark placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c] resize-none leading-relaxed"
          disabled={loading}
        />
        <p className="text-[11px] text-vcx-sub-5 text-right mt-1">{content.length}/3000</p>
      </div>

      {/* Notice */}
      <div className="bg-[#f7f3ed] border border-[#e8e2d9] p-4">
        <p className="text-[12px] font-vcx-sans text-vcx-sub-3">
          신청자 목록은 작성자에게만 공개됩니다. 다른 멤버들은 누가 신청했는지 볼 수 없습니다.
        </p>
      </div>

      {error && (
        <p className="text-[13px] text-red-600 font-vcx-sans">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={loading}
          className="flex-1"
        >
          취소
        </Button>
        <Button
          type="submit"
          variant="gold"
          disabled={loading || !title.trim() || !content.trim()}
          className="flex-1"
        >
          {loading ? (isEdit ? '수정 중...' : '등록 중...') : (isEdit ? '글 수정하기' : '글 등록하기')}
        </Button>
      </div>
    </form>
  )
}
