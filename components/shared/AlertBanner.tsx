import * as React from "react"

import { cn } from "@/lib/utils"

export type AlertBannerProps = {
  type: "warning" | "info" | "error" | "success"
  message: React.ReactNode
  action?: { label: string; href: string }
  className?: string
}

function getAlertStyle(type: AlertBannerProps["type"]) {
  switch (type) {
    case "success":
      return {
        wrapper: "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/20 dark:border-green-900/50 dark:text-green-300",
        icon: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      }
    case "warning":
      return {
        wrapper: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-300",
        icon: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
      }
    case "error":
      return {
        wrapper: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-300",
        icon: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      }
    default:
      return {
        wrapper: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-blue-300",
        icon: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      }
  }
}

export default function AlertBanner({
  type,
  message,
  action,
  className,
}: AlertBannerProps) {
  const styles = getAlertStyle(type)

  const iconText =
    type === "success"
      ? "✓"
      : type === "warning"
        ? "!"
        : type === "error"
          ? "✕"
          : "i"

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3",
        styles.wrapper,
        className
      )}
    >
      <div
        className={cn(
          "mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold",
          styles.icon
        )}
        aria-hidden="true"
      >
        {iconText}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{message}</div>
      </div>

      {action ? (
        <a
          href={action.href}
          className="shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium bg-white/30 hover:bg-white/50 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white dark:border-white/10"
        >
          {action.label}
        </a>
      ) : null}
    </div>
  )
}
