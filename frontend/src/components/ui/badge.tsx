import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Default - Blue filled
        default: "border-transparent bg-blue-600 text-white",
        // Outline - Blue border only
        outline: "text-blue-600 border-blue-300 bg-white",
        // Grey - Neutral status
        grey: "border-transparent bg-gray-100 text-gray-500",
        // Secondary - muted
        secondary: "border-transparent bg-gray-200 text-gray-500",

        // Workflow status badges
        active: "border border-blue-300 bg-blue-50 text-blue-700",
        draft: "border-transparent bg-gray-100 text-gray-500",
        approved: "border border-transparent bg-blue-50 text-blue-700",
        locked: "border-transparent bg-gray-200 text-gray-500",
        cancelled: "border-transparent bg-gray-100 text-gray-400 line-through",
        
        // Additional status badges
        prepared: "border-transparent bg-yellow-100 text-yellow-800",
        checked: "border-transparent bg-blue-100 text-blue-800",
        authorized: "border-transparent bg-green-100 text-green-800",
        running: "border-transparent bg-indigo-100 text-indigo-800",
        completed: "border-transparent bg-emerald-100 text-emerald-800",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

