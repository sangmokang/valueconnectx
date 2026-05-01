import { cn } from "@/lib/utils"

interface GoldLineProps {
  label?: string
  className?: string
}

export function GoldLine({ label, className }: GoldLineProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="w-8 h-px bg-[#00d992] shrink-0" />
      {label && (
        <span
          className="text-[13px] uppercase text-[#00d992] font-sans font-semibold leading-none"
          style={{ letterSpacing: "0.08em" }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
