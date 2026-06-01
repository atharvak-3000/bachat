import * as React from "react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

export type FormFieldProps = {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
  className?: string
}

export default function FormField({
  label,
  required,
  error,
  hint,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <Label className="text-sm font-medium text-gray-700">
          {label}
          {required ? <span className="text-red-600"> *</span> : null}
        </Label>
      </div>

      {children}

      {error ? (
        <div className="mt-1 text-sm text-red-600">{error}</div>
      ) : hint ? (
        <div className="mt-1 text-xs text-gray-500">{hint}</div>
      ) : null}
    </div>
  )
}
