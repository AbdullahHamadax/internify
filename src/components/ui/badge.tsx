import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-none border-2 px-3 py-1 text-[10px] font-black uppercase tracking-widest w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-0 transition-all overflow-hidden",
  {
    variants: {
      variant: {
        default: "border-black dark:border-white bg-[#3B82F6] text-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]",
        secondary:
          "border-black dark:border-white bg-[#AB47BC] text-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]",
        destructive:
          "border-black dark:border-white bg-[#FF0055] text-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]",
        outline:
          "border-black dark:border-white text-foreground shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] bg-white dark:bg-black",
        ghost: "border-transparent [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "border-transparent text-primary underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
