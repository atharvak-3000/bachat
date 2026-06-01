import * as React from "react"
import { Button } from "@/components/ui/button"

export type EmptyStateProps = {
  icon: React.ReactNode
  title: string
  description?: React.ReactNode
  action?: { label: string; onClick: () => void } | { label: string; href: string }
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-12 text-center dark:border-gray-800 dark:bg-[#1A1D27]">
      <div className="text-4xl" aria-hidden="true">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      ) : null}

      {action ? (
        <div className="mt-6">
          {"href" in action ? (
            <a
              href={action.href}
              className={[
                "inline-flex items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground",
                "px-2.5 text-sm font-medium whitespace-nowrap transition-all",
                "bg-[#E85D26] text-white hover:bg-[#D04E1A] font-semibold shadow-sm transition",
                "h-8",
              ].join(" ")}
            >
              {action.label}
            </a>
          ) : (
            <Button
              variant="default"
              className="bg-[#E85D26] text-white hover:bg-[#D04E1A] font-semibold shadow-sm transition"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  )
}
