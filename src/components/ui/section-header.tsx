import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  title: string
  subtitle?: string
  filters?: React.ReactNode
  className?: string
}

export function SectionHeader({ title, subtitle, filters, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="flex flex-col gap-1">
        <h2 className="font-vcx-serif text-[22px] font-bold leading-tight text-vcx-dark">
          {title}
        </h2>
        {subtitle && (
          <p className="font-vcx-sans text-[13px] leading-snug text-vcx-sub-4">
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
