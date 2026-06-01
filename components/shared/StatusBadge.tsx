import * as React from "react"

import { cn } from "@/lib/utils"

type MemberStatus = "ACTIVE" | "PENDING" | "REJECTED"
type LoanStatus = "PENDING" | "ACTIVE" | "CLOSED" | "REJECTED"
type MeetingStatus = "DRAFT" | "FINALIZED"
type ProofStatus = "PENDING" | "VERIFIED" | "REJECTED"

export type StatusBadgeProps = {
  status: MemberStatus | LoanStatus | MeetingStatus | ProofStatus
  type: "member" | "loan" | "meeting" | "proof"
  className?: string
}

function getBadge(
  type: StatusBadgeProps["type"],
  status: StatusBadgeProps["status"]
) {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border"

  if (type === "member") {
    if (status === "ACTIVE")
      return { className: cn(base, "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/50"), label: "Active" }
    if (status === "PENDING")
      return { className: cn(base, "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50"), label: "Pending" }
    return { className: cn(base, "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50"), label: "Rejected" }
  }

  if (type === "loan") {
    if (status === "PENDING")
      return { className: cn(base, "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50"), label: "Pending Approval" }
    if (status === "ACTIVE")
      return { className: cn(base, "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/50"), label: "Active" }
    if (status === "CLOSED")
      return { className: cn(base, "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/50"), label: "Closed" }
    return { className: cn(base, "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50"), label: "Rejected" }
  }

  if (type === "meeting") {
    if (status === "DRAFT")
      return { className: cn(base, "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50"), label: "Draft" }
    return { className: cn(base, "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/50"), label: "Finalized" }
  }

  // proof
  if (status === "PENDING")
    return { className: cn(base, "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50"), label: "Pending" }
  if (status === "VERIFIED")
    return { className: cn(base, "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/50"), label: "Verified" }
  return { className: cn(base, "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50"), label: "Rejected" }
}

export default function StatusBadge({
  status,
  type,
  className,
}: StatusBadgeProps) {
  const badge = getBadge(type, status)
  return <span className={cn(badge.className, className)}>{badge.label}</span>
}
