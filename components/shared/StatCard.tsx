import * as React from "react"

import { cn } from "@/lib/utils"

export type StatCardProps = {
  label: string
  value: React.ReactNode
  sublabel?: React.ReactNode
  color?: "orange" | "green" | "red" | "blue" | "amber"
}

const colorToText = {
  orange: "text-orange-600 dark:text-orange-400",
  green: "text-green-600 dark:text-green-400",
  red: "text-red-600 dark:text-red-400",
  blue: "text-blue-600 dark:text-blue-400",
  amber: "text-amber-600 dark:text-amber-400",
} as const

export default function StatCard({
  label,
  value,
  sublabel,
  color = "orange",
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-[#1A1D27]">
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      <div className={cn("mt-2 text-3xl font-bold", colorToText[color])}>
        {value}
      </div>
      {sublabel ? (
        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{sublabel}</div>
      ) : null}
    </div>
  )
}
