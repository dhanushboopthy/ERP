import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          "flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors",
          // Border and focus
          "border-gray-200 ring-offset-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500",
          // Placeholder
          "placeholder:text-gray-400",
          // File input
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          // Disabled
          "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60",
          // Error state
          error && "border-red-500 focus-visible:ring-red-500/20 focus-visible:border-red-500",
          // Number input
          type === "number" && "font-mono tabular-nums",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

