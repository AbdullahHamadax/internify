import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // 👇 Removed the invisible selection colors so the browser handles it normally!
        "file:text-foreground placeholder:text-muted-foreground dark:bg-black border-black dark:border-white h-12 w-full min-w-0 rounded-none border-2 bg-transparent px-4 py-2 text-base font-bold shadow-none transition-[color,box-shadow,transform] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:ring-0 focus-visible:shadow-[4px_4px_0_0_#000] dark:focus-visible:shadow-[4px_4px_0_0_#3B82F6]",
        "aria-invalid:ring-0 aria-invalid:border-destructive aria-invalid:shadow-[4px_4px_0_0_#FF0055]",
        className
      )}
      {...props}
    />
  )
}

export { Input }