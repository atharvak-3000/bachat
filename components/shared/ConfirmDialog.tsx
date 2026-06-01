"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"

export type ConfirmDialogProps = {
  open: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  title: string
  description?: React.ReactNode
  confirmLabel: string
  confirmVariant?: "default" | "destructive"
  cancelLabel?: string
}

export default function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel,
  confirmVariant = "destructive",
  cancelLabel = "Cancel",
}: ConfirmDialogProps) {
  const dialogRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!open) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-label="Close dialog"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className="relative mx-auto mt-20 w-[90%] max-w-lg rounded-xl border bg-white p-5 shadow-lg"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {description ? (
              <div className="mt-2 text-sm text-gray-600">{description}</div>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={() => onConfirm()}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
