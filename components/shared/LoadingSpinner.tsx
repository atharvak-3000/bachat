import * as React from "react"

export type LoadingSpinnerProps = {
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-2",
} as const

export default function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      className={[
        "animate-spin rounded-full border-orange-600 border-t-transparent",
        "border-solid",
        sizeMap[size],
        className ?? "",
      ].join(" ")}
      aria-label="Loading"
      role="status"
    />
  )
}
