"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import NotificationBell from "./NotificationBell"
import { getTranslation } from "@/lib/translations"
import DarkModeToggle from "../ui/DarkModeToggle"

export default function MemberLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [lang, setLang] = useState<"en" | "mr">("en")

  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(";").shift() as "en" | "mr"
      return "en"
    }
    setLang(getCookie("language") || "en")
  }, [])

  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key)

  const toggleLanguage = () => {
    const newLang = lang === "en" ? "mr" : "en"
    document.cookie = `language=${newLang}; path=/; max-age=31536000` // 1 year
    setLang(newLang)
    window.location.reload()
  }

  const navItems = [
    {
      href: "/member",
      label: t("home"),
      exact: true,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      href: "/member/loans",
      label: t("loans"),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      href: "/member/passbook",
      label: t("passbook"),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      href: "/member/kyc",
      label: t("kyc"),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      href: "/member/payments",
      label: t("payments"),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
  ]

  const isLinkActive = (item: typeof navItems[0]) => {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname.startsWith(item.href)
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-[#0F1117] pb-16 md:pb-0 transition-colors duration-150">
      {/* Desktop Header */}
      <header className="bg-[#1B2B6B] dark:bg-[#0D1021] h-14 flex items-center px-6 justify-between sticky top-0 z-50 transition-colors duration-150">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
          <div className="flex items-center gap-6 text-sm font-medium flex-1">
            <span className="font-bold text-white text-lg pr-4 border-r border-white/20 mr-2">BachatGatOnline</span>
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => {
                const active = isLinkActive(item)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`transition-colors text-sm px-3 py-1.5 rounded-lg transition ${
                      active ? 'text-white font-semibold bg-white/15 border-b-2 border-[#E85D26]' : 'text-blue-200 hover:text-white hover:bg-white/10 dark:text-blue-300'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <DarkModeToggle />
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 text-white bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs"
              title="Switch Language / भाषा बदलें"
            >
              <span>🌐</span>
              <span className="font-extrabold">{lang === "en" ? "मराठी" : "English"}</span>
            </button>
            <div className="text-white hover:text-blue-200">
              <NotificationBell />
            </div>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="border border-white/30 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-white/10 transition font-semibold"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1B2B6B] dark:bg-[#0D1021] border-t border-white/10 dark:border-white/5 z-30 flex justify-around py-2 transition-colors duration-150">
        {navItems.map((item) => {
          const active = isLinkActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 flex-1 py-1 px-2 ${
                active ? 'text-white font-semibold' : 'text-blue-200 hover:text-white dark:text-blue-300'
              }`}
            >
              <div className={`${active ? 'text-white' : 'text-blue-300'}`}>
                {item.icon}
              </div>
              <span className="text-[10px] font-medium tracking-tight truncate max-w-[64px]">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
