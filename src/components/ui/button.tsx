"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent text-sm font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-[#2fd6a1]/55 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[#101010] text-[#2fd6a1] border-[#3d3a39] hover:border-[#00d992] hover:bg-[#171717]",
        primary:
          "bg-[#101010] text-[#2fd6a1] border-[#3d3a39] hover:border-[#00d992] hover:bg-[#171717]",
        gold:
          "bg-[#00d992] text-[#050507] hover:bg-[#2fd6a1]",
        outline:
          "border-[#3d3a39] bg-transparent text-[#f2f2f2] hover:border-[#00d992] hover:text-[#2fd6a1]",
        ghost:
          "bg-transparent text-[#f2f2f2] hover:bg-[#101010] hover:text-[#2fd6a1]",
        secondary:
          "bg-[#171717] text-[#b8b3b0] border-[#3d3a39] hover:text-[#f2f2f2]",
        destructive:
          "bg-[#2a1012] text-[#fd9c9f] border-[#fb565b]/40 hover:border-[#fb565b]",
        link: "text-[#2fd6a1] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-[48px] px-6 text-[15px] gap-2",
        sm: "h-10 px-4 text-[14px] gap-1.5",
        lg: "h-[54px] px-8 text-[16px] gap-2",
        xs: "h-8 px-3 text-[13px] gap-1",
        icon: "size-11",
        "icon-xs": "size-7",
        "icon-sm": "size-10",
        "icon-lg": "size-12",
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
