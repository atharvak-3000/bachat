import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type PageHeaderProps = {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export default function PageHeader({
  title,
  subtitle,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-4 flex flex-col gap-1", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[#1B2B6B] dark:text-white">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  )
}

export function HeaderActionButton({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn(
        "bg-[#E85D26] text-white hover:bg-[#D04E1A] font-semibold shadow-sm transition",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}
