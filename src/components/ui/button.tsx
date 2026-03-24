"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[#1a1a1a] text-[#f0ebe2] hover:bg-[#333333]",
        primary:
          "bg-[#1a1a1a] text-[#f0ebe2] hover:bg-[#333333]",
        gold:
          "bg-[#c9a84c] text-white hover:bg-[#b8973b]",
        outline:
          "border-[#1a1a1a] bg-transparent text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-[#f0ebe2]",
        ghost:
          "bg-transparent text-[#1a1a1a] hover:bg-[#ebe5da]",
        secondary:
          "bg-[#e8e2d9] text-[#666666] hover:bg-[#ddd7ce]",
        destructive:
          "bg-red-100 text-red-700 hover:bg-red-200",
        link: "text-[#1a1a1a] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-[46px] px-7 text-[14px] gap-2",
        sm: "h-9 px-4 text-[13px] gap-1.5",
        lg: "h-[52px] px-8 text-[15px] gap-2",
        xs: "h-7 px-3 text-[12px] gap-1",
        icon: "size-10",
        "icon-xs": "size-7",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      style={{ borderRadius: 0 }}
      {...props}
    />
  )
}

export { Button, buttonVariants }
