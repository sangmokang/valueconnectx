import { cn } from '@/lib/utils'

interface ProfileCompletionProps {
  name: string | null
  current_company: string | null
  title: string | null
  professional_fields: string[]
  years_of_experience: number | null
  bio: string | null
  linkedin_url: string | null
  className?: string
}

interface CompletionItem {
  label: string
  weight: number
  filled: boolean
}

function getCompletionItems(data: Omit<ProfileCompletionProps, 'className'>): CompletionItem[] {
  return [
    { label: '이름', weight: 10, filled: !!data.name?.trim() },
    { label: '회사', weight: 15, filled: !!data.current_company?.trim() },
    { label: '직함', weight: 15, filled: !!data.title?.trim() },
    { label: '전문 분야', weight: 15, filled: data.professional_fields.length > 0 },
    { label: '경력 연수', weight: 10, filled: data.years_of_experience != null },
    { label: '소개', weight: 15, filled: !!data.bio?.trim() },
    { label: 'LinkedIn', weight: 20, filled: !!data.linkedin_url?.trim() },
  ]
}

export function ProfileCompletion({
  name,
  current_company,
  title,
  professional_fields,
  years_of_experience,
  bio,
  linkedin_url,
  className,
}: ProfileCompletionProps) {
  const items = getCompletionItems({
    name,
    current_company,
    title,
    professional_fields,
    years_of_experience,
    bio,
    linkedin_url,
  })

  const completionPercent = items.reduce((sum, item) => sum + (item.filled ? item.weight : 0), 0)
  const incomplete = items.filter((item) => !item.filled)

  return (
    <div className={cn('bg-white border border-[#e0d9ce] p-4', className)}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-vcx-sans font-medium text-[#1a1a1a]">프로필 완성도</p>
        <p className="text-sm font-vcx-sans font-bold text-[#c9a84c]">{completionPercent}%</p>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-[#e0d9ce] mb-4" style={{ borderRadius: 0 }}>
        <div
          className="h-2 bg-[#c9a84c] transition-all duration-500"
          style={{ width: `${completionPercent}%`, borderRadius: 0 }}
        />
      </div>

      {/* Item checklist */}
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item.label}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 text-xs font-vcx-sans',
              item.filled
                ? 'bg-[#f0fdf4] text-[#166534] border border-[#86efac]'
                : 'bg-[#fdf9f2] text-[#92400e] border border-[#f0d49a]'
            )}
            style={{ borderRadius: 0 }}
          >
            <span>{item.filled ? '✓' : '○'}</span>
            <span>{item.label}</span>
            <span className="text-[10px] opacity-60">({item.weight}%)</span>
          </span>
        ))}
      </div>

      {/* Incomplete hint */}
      {incomplete.length > 0 && (
        <p className="text-xs font-vcx-sans text-[#888888] mt-3">
          미완성 항목: {incomplete.map((i) => i.label).join(', ')}
        </p>
      )}
    </div>
  )
}
