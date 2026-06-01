"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import NotificationBell from "./NotificationBell"
import DarkModeToggle from "../ui/DarkModeToggle"
import type { MemberWithOrg } from "@/types"

export default function AdminLayoutClient({
  member,
  pendingCount,
  children,
}: {
  member: MemberWithOrg
  pendingCount: number
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [showSidebar, setShowSidebar] = useState(false)

  const [lang, setLang] = useState<'mr'|'en'>('mr')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLang((localStorage.getItem('bb_lang') as 'mr'|'en') || 'mr')
    }
    const handler = (e: Event) => {
      setLang((e as CustomEvent).detail)
    }
    window.addEventListener('bb-lang-change', handler)
    return () => window.removeEventListener('bb-lang-change', handler)
  }, [])

  const setLanguage = (l: 'mr'|'en') => {
    setLang(l)
    localStorage.setItem('bb_lang', l)
    window.dispatchEvent(new CustomEvent('bb-lang-change', { detail: l }))
  }

  const T = {
    mr: {
      dashboard: "डॅशबोर्ड",
      members: "सदस्य",
      meetings: "सभा",
      loans: "कर्ज",
      reports: "अहवाल",
      settings: "सेटिंग्ज",
      signOut: "साइन आउट",
    },
    en: {
      dashboard: "Dashboard",
      members: "Members",
      meetings: "Meetings",
      loans: "Loans",
      reports: "Reports",
      settings: "Settings",
      signOut: "Sign Out",
    }
  }
  const t = T[lang]

  const navItems = [
    {
      href: "/dashboard",
      label: t.dashboard,
      icon: <Image src="/Bachat Gat icons/Dashboard/Dashboard.svg" alt="Dashboard" width={24} height={24} />
    },
    {
      href: "/members",
      label: t.members,
      badge: pendingCount > 0 ? pendingCount : undefined,
      icon: <Image src="/Bachat Gat icons/Members.svg" alt="Members" width={24} height={24} />
    },
    {
      href: "/meetings",
      label: t.meetings,
      icon: <Image src="/Bachat Gat icons/Meeting.svg" alt="Meetings" width={24} height={24} />
    },
    {
      href: "/loans",
      label: t.loans,
      icon: <Image src="/Bachat Gat icons/Loans.svg" alt="Loans" width={24} height={24} />
    },
    {
      href: "/reports",
      label: t.reports,
      icon: <Image src="/Bachat Gat icons/Reports.svg" alt="Reports" width={24} height={24} />
    },
  ]

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/sign-in')
  }

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full text-white">
      <div className="mb-6 flex justify-between items-center">
        {/* Logo + Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden 
                          bg-white/10 flex items-center 
                          justify-center flex-shrink-0">
            {member.organization.logo_url ? (
              <img 
                src={member.organization.logo_url}
                alt={member.organization.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg">🪷</span>
            )}
          </div>
          <div>
            <p className="font-bold text-white truncate max-w-[120px] text-sm">
              {member.organization.name}
            </p>
            <p className="text-xs text-blue-200">{member.role}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Only show bell on desktop sidebar because mobile topbar already has a bell */}
            <div className="hidden md:block">
              <NotificationBell />
            </div>
            <div className="md:hidden">
              <button
                onClick={() => setShowSidebar(false)}
                className="p-1 rounded-lg text-blue-200 hover:bg-white/10 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Language Selector */}
        <div className="mb-5 flex gap-1.5 bg-white/10 border border-white/5 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setLanguage('mr')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold text-center transition ${lang === 'mr' ? 'bg-[#E85D26] text-white shadow-sm' : 'text-blue-100 hover:text-white hover:bg-white/5'}`}
          >
            मराठी
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold text-center transition ${lang === 'en' ? 'bg-[#E85D26] text-white shadow-sm' : 'text-blue-100 hover:text-white hover:bg-white/5'}`}
          >
            English
          </button>
        </div>
      <nav className="space-y-1.5 flex-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setShowSidebar(false)}
              className={`flex items-center gap-4 rounded-xl px-4 py-3.5 text-base font-bold transition-all duration-150 ${
                isActive
                  ? 'bg-[#E85D26] text-white shadow-sm'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-blue-200 group-hover:text-white transition-colors'}>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && (
                <span className="ml-auto inline-flex items-center justify-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
        {member.role === 'SUPERADMIN' && (
          <Link
            href="/settings"
            onClick={() => setShowSidebar(false)}
            className={`flex items-center gap-4 rounded-xl px-4 py-3.5 text-base font-bold transition-all duration-150 ${
              pathname.startsWith('/settings')
                ? 'bg-[#E85D26] text-white shadow-sm'
                : 'text-blue-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Image src="/Bachat Gat icons/Settings.svg" alt="Settings" width={24} height={24} />
            <span>{t.settings}</span>
          </Link>
        )}
      </nav>
      <div className="mt-auto border-t border-white/10 pt-4 flex items-center gap-2">
        <DarkModeToggle />
        <button
          onClick={signOut}
          className="flex-1 rounded-xl border border-white/20 px-4 py-3 text-base font-bold text-white hover:bg-white/10 transition-colors shadow-sm"
        >
          {t.signOut}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F5F6FA] dark:bg-[#0F1117] pb-16 md:pb-0 transition-colors duration-150">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:w-64 border-r border-white/10 dark:border-white/5 bg-[#1B2B6B] dark:bg-[#0D1021] p-4 shrink-0 flex-col h-screen sticky top-0">
        {renderSidebarContent()}
      </aside>

      {/* Top bar for Mobile */}
      <header className="md:hidden sticky top-0 z-30 bg-white dark:bg-[#1A1D27] border-b border-[#E5E7EB] dark:border-gray-700 px-4 py-3 flex items-center justify-between transition-colors duration-150">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSidebar(true)}
            className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-[#1B2B6B] dark:text-white truncate max-w-[150px]">{member.organization.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <DarkModeToggle className="bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-white" />
          {/* Compact lang selector in topbar */}
          <button
            onClick={() => setLanguage(lang === 'mr' ? 'en' : 'mr')}
            className="text-[10px] bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 font-extrabold px-1.5 py-0.5 rounded"
          >
            {lang === 'mr' ? 'EN' : 'मराठी'}
          </button>
          <NotificationBell />
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {showSidebar && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Overlay backdrop */}
          <div
            className="fixed inset-0 bg-gray-600/50 backdrop-blur-sm transition-opacity"
            onClick={() => setShowSidebar(false)}
          />
          {/* Drawer content */}
          <aside className="relative flex w-full max-w-xs flex-1 flex-col bg-[#1B2B6B] dark:bg-[#0D1021] p-4 shadow-2xl transition-transform duration-300 text-white">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 md:p-8">
          {children}
        </div>
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] z-30 flex justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 flex-1 py-1 px-2 ${
                isActive ? 'text-[#E85D26]' : 'text-gray-500'
              }`}
            >
              <div className={`${isActive ? 'text-[#E85D26]' : 'text-gray-400'}`}>
                {item.icon}
              </div>
              <span className="text-[10px] font-medium tracking-tight truncate max-w-[64px]">
                {item.label.split(' ')[0]}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
