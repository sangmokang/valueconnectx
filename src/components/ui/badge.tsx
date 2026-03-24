import { cn } from "@/lib/utils"

type BadgeVariant = "core" | "endorsed" | "new"

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  core: "bg-[#1a1a1a] text-[#c9a84c]",
  endorsed: "bg-[#e8e2d9] text-[#666666]",
  new: "bg-[#c9a84c] text-white",
}

export function Badge({ variant = "core", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 text-[9px] uppercase tracking-[0.22em] font-sans leading-none",
        variantStyles[variant],
        className
      )}
      style={{ borderRadius: 0 }}
    >
      {children}
    </span>
  )
}
