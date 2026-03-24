import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  title: string
  subtitle?: string
  filters?: React.ReactNode
  className?: string
}

export function SectionHeader({ title, subtitle, filters, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between", className)}>
      <div className="flex flex-col gap-1">
        <h2 className="text-[22px] font-bold text-[#1a1a1a] leading-tight" style={{ fontFamily: "Georgia, serif" }}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-[13px] text-[#888888] font-sans leading-snug">
            {subtitle}
          </p>
        )}
      </div>
      {filters && (
        <div className="flex items-center gap-2 shrink-0">
          {filters}
        </div>
      )}
    </div>
  )
}
