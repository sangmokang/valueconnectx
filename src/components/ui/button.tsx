"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-vcx-gold/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-vcx-dark text-vcx-beige hover:bg-vcx-surface-soft",
        primary:
          "bg-vcx-dark text-vcx-beige hover:bg-vcx-surface-soft",
        gold:
          "bg-vcx-gold text-vcx-dark hover:bg-vcx-gold/90",
        outline:
          "border-vcx-dark bg-transparent text-vcx-dark hover:bg-vcx-dark hover:text-vcx-beige",
        ghost:
          "bg-transparent text-vcx-dark hover:bg-vcx-beige-dark",
        secondary:
          "bg-vcx-beige-dark text-vcx-sub-3 hover:bg-vcx-beige-light",
        destructive:
          "bg-red-100 text-red-700 hover:bg-red-200",
        link: "text-vcx-dark underline-offset-4 hover:underline",
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
      {...props}
    />
  )
}

export { Button, buttonVariants }
