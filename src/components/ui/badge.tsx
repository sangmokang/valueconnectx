import { cn } from "@/lib/utils"

type BadgeVariant = "core" | "endorsed" | "new"

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  core: "bg-vcx-dark text-vcx-gold",
  endorsed: "bg-vcx-beige-dark text-vcx-sub-3",
  new: "bg-vcx-gold text-vcx-dark",
}

export function Badge({ variant = "core", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-block px-2 py-1 text-[12px] uppercase tracking-[0.08em] font-sans leading-tight",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
