'use client'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function DarkModeToggle({ className = "bg-white/10 hover:bg-white/20 text-white" }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all active:scale-95 text-lg ${className}`}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle dark mode"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
