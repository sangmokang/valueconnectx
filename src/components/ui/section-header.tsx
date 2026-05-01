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
        <h2 className="text-[22px] font-bold text-[#f2f2f2] leading-tight sm:text-[24px]">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[15px] text-[#b8b3b0] font-sans leading-relaxed">
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
