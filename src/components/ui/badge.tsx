import { cn } from "@/lib/utils"

type BadgeVariant = "core" | "endorsed" | "new"

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  core: "bg-[#101010] text-[#00d992] border border-[#3d3a39]",
  endorsed: "bg-[#171717] text-[#b8b3b0] border border-[#3d3a39]",
  new: "bg-[#00d992] text-[#050507]",
}

export function Badge({ variant = "core", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-block px-2.5 py-1 text-[12px] uppercase tracking-[0.08em] font-sans font-semibold leading-none",
        variantStyles[variant],
        className
      )}
      style={{ borderRadius: 0 }}
    >
      {children}
    </span>
  )
}
