"use client"

import { toast } from "sonner"

export function CopyButton({ text, label }: { text: string; label?: string }) {
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); toast.success(label ?? "Copied!") }}
      className="text-xs text-orange-500 hover:text-orange-700 transition"
      title="Copy"
    >
      📋
    </button>
  )
}

export function GroupCodeBadge({ code }: { code: string }) {
  return (
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
      <span className="text-xs text-gray-500 font-medium">Code:</span>
      <span className="text-xs font-mono font-bold text-gray-800">{code}</span>
      <CopyButton text={code} label="Group code copied!" />
    </div>
  )
}
