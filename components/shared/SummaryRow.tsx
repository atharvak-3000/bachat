import * as React from "react"
import { cn } from "@/lib/utils"

export type SummaryRowProps = {
  label: string
  labelMarathi: string
  value: React.ReactNode
  bold?: boolean
  color?: "orange" | "green" | "red" | "blue" | "gray"
}

const colorToValue = {
  orange: "text-orange-600",
  green: "text-green-600",
  red: "text-red-600",
  blue: "text-blue-600",
  gray: "text-gray-600",
} as const

export default function SummaryRow({
  label,
  labelMarathi,
  value,
  bold,
  color = "gray",
}: SummaryRowProps) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0">
        <div className="text-sm font-medium">
          <span className="text-orange-600">{labelMarathi}</span>
        </div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
      <div
        className={cn(
          "text-sm text-right",
          bold ? "font-bold" : "font-medium",
          colorToValue[color]
        )}
      >
        {value}
      </div>
    </div>
  )
}
