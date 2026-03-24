import { cn } from "@/lib/utils"

interface GoldLineProps {
  label?: string
  className?: string
}

export function GoldLine({ label, className }: GoldLineProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="w-8 h-px bg-[#c9a84c] shrink-0" />
      {label && (
        <span
          className="text-[10px] uppercase text-[#c9a84c] font-sans leading-none"
          style={{ letterSpacing: "0.22em" }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
