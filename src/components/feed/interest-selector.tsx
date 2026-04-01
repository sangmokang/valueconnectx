'use client'

import { useState } from 'react'

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
    } else if (selectedChips.length < 5) {
      onChange([...selectedChips, chip])
    }
  }

  const addCustom = () => {
    const trimmed = customInput.trim()
    if (trimmed && selectedChips.length < 5 && !selectedChips.includes(trimmed)) {
      onChange([...selectedChips, trimmed])
      setCustomInput('')
    }
  }

  return (
    <div
      style={{
        background: '#ffffff',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          margin: '0 auto',
          padding: '32px 48px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 32,
            flexWrap: 'wrap',
          }}
        >
          {/* 칩 선택 */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <div
              style={{
                fontSize: 11,
                color: '#888',
                letterSpacing: '0.12em',
                fontWeight: 600,
                marginBottom: 14,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              관심 분야 선택 (최대 5개)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DEFAULT_CHIPS.map((chip) => {
                const active = selectedChips.includes(chip)
                return (
                  <button
                    key={chip}
                    onClick={() => toggleChip(chip)}
                    style={{
                      padding: '7px 14px',
                      fontSize: 13,
                      border: `1.5px solid ${active ? '#c9a84c' : 'rgba(0,0,0,0.12)'}`,
                      background: active ? 'rgba(201,168,76,0.1)' : 'transparent',
                      color: active ? '#a8892e' : '#666',
                      cursor: 'pointer',
                      fontWeight: active ? 700 : 400,
                      fontFamily: 'system-ui, sans-serif',
                    }}
                  >
                    {active ? `✓ ${chip}` : chip}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 직접 입력 */}
          <div style={{ minWidth: 240 }}>
            <div
              style={{
                fontSize: 11,
                color: '#888',
                letterSpacing: '0.12em',
                fontWeight: 600,
                marginBottom: 14,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              또는 직접 입력
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addCustom()
                }}
                placeholder="예: 'B2B SaaS 세일즈'"
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  border: '1px solid rgba(0,0,0,0.12)',
                  background: '#faf8f4',
                  fontSize: 13.5,
                  outline: 'none',
                  fontFamily: 'system-ui, sans-serif',
                }}
              />
              <button
                onClick={addCustom}
                style={{
                  padding: '9px 16px',
                  background: '#1a1a1a',
                  color: '#f5f0e8',
                  border: 'none',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                추가
              </button>
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: '#aaa',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              Enter 또는 추가 버튼으로 등록 · {5 - selectedChips.length}개 남음
            </div>
          </div>
        </div>

        {/* 선택된 태그 */}
        {selectedChips.length > 0 && (
          <div
            style={{
              marginTop: 20,
              paddingTop: 20,
              borderTop: '1px solid rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: '#888',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              구독 중:
            </span>
            {selectedChips.map((chip) => (
              <span
                key={chip}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  background: '#f5f0e8',
                  border: '1px solid rgba(0,0,0,0.1)',
                  fontSize: 12.5,
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                {chip}
                <span
                  onClick={() => toggleChip(chip)}
                  style={{ cursor: 'pointer', color: '#bbb', fontSize: 14, lineHeight: 1 }}
                >
                  ×
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
