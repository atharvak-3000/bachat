import * as React from "react"
import { cn } from "@/lib/utils"
import type { Role } from "@/types"

export type RoleBadgeProps = {
  role: Role
  className?: string
}

export default function RoleBadge({ role, className }: RoleBadgeProps) {
  if (role === "SUPERADMIN") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 border border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800/50",
          className
        )}
      >
        Admin
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700 border border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700/50",
        className
      )}
    >
      Member
    </span>
  )
}
