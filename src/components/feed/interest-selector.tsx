'use client'

import { useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAX_INTERESTS = 10

const DEFAULT_CHIPS = [
  '딥테크',
  '핀테크 B2B',
  'AI / ML',
  'Series A 스타트업',
  '엔터프라이즈 SaaS',
  '모빌리티',
  '헬스케어·바이오',
  '컨슈머 앱',
  '콘텐츠·미디어',
  '클라우드 인프라',
]

interface InterestSelectorProps {
  selectedChips: string[]
  onChange: (chips: string[]) => void
}

export function InterestSelector({ selectedChips, onChange }: InterestSelectorProps) {
  const [customInput, setCustomInput] = useState('')

  const toggleChip = (chip: string) => {
    if (selectedChips.includes(chip)) {
      onChange(selectedChips.filter((c) => c !== chip))
    } else if (selectedChips.length < MAX_INTERESTS) {
      onChange([...selectedChips, chip])
    }
  }

  const addCustom = () => {
    const trimmed = customInput.trim()
    if (trimmed && selectedChips.length < MAX_INTERESTS && !selectedChips.includes(trimmed)) {
      onChange([...selectedChips, trimmed])
      setCustomInput('')
    }
  }

  return (
    <section className="border-b border-vcx-dark/10 bg-white">
      <div className="mx-auto max-w-[1000px] px-5 py-7 sm:px-8 lg:px-12">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div>
            <div className="mb-4 font-vcx-sans text-[11px] font-semibold tracking-[0.12em] text-vcx-sub-4">
              관심 분야 선택 (최대 10개)
            </div>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_CHIPS.map((chip) => {
                const active = selectedChips.includes(chip)
                return (
                  <button
                    type="button"
                    key={chip}
                    onClick={() => toggleChip(chip)}
                    className={cn(
                      'inline-flex min-h-9 items-center gap-1.5 border px-3.5 py-1.5 font-vcx-sans text-[13px] transition-colors',
                      active
                        ? 'border-vcx-gold bg-vcx-gold/10 font-bold text-vcx-dark'
                        : 'border-vcx-dark/15 bg-transparent text-vcx-sub-3 hover:border-vcx-dark/30 hover:text-vcx-dark'
                    )}
                  >
                    {active && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                    {chip}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="mb-4 font-vcx-sans text-[11px] font-semibold tracking-[0.12em] text-vcx-sub-4">
              또는 직접 입력
            </div>
            <div className="flex gap-2">
              <input
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addCustom()
                }}
                placeholder="예: 'B2B SaaS 세일즈'"
                className="min-h-10 min-w-0 flex-1 border border-vcx-dark/15 bg-vcx-beige-light px-3.5 py-2 font-vcx-sans text-[13.5px] text-vcx-dark outline-none placeholder:text-vcx-sub-4 focus:border-vcx-gold"
              />
              <button
                type="button"
                onClick={addCustom}
                disabled={selectedChips.length >= MAX_INTERESTS}
                className="inline-flex min-h-10 items-center gap-1.5 bg-vcx-dark px-3.5 py-2 font-vcx-sans text-[13px] font-semibold text-vcx-beige disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                추가
              </button>
            </div>
            <div className="mt-2 font-vcx-sans text-[12px] text-vcx-sub-4">
              Enter 또는 추가 버튼으로 등록 · {MAX_INTERESTS - selectedChips.length}개 남음
            </div>
          </div>
        </div>

        {selectedChips.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-vcx-dark/10 pt-5">
            <span className="font-vcx-sans text-[12px] text-vcx-sub-4">
              구독 중:
            </span>
            {selectedChips.map((chip) => (
              <span
                key={chip}
                className="inline-flex min-h-7 items-center gap-1.5 border border-vcx-dark/10 bg-vcx-beige-light px-2.5 py-1 font-vcx-sans text-[12.5px] text-vcx-dark"
              >
                {chip}
                <button
                  type="button"
                  onClick={() => toggleChip(chip)}
                  className="text-vcx-sub-4 hover:text-vcx-dark"
                  aria-label={`${chip} 관심 분야 제거`}
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
