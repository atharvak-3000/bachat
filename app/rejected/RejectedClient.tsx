"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function RejectedClient({
  orgName,
  memberName,
}: {
  orgName: string
  memberName: string
}) {
  const router = useRouter()
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

  const T = {
    mr: {
      title: "विनंती नाकारली",
      nameLabel: "नाव:",
      groupLabel: "गट:",
      notApprovedMsg: `तुमची ${orgName} मध्ये सामील होण्याची विनंती मंजूर केली गेली नाही.`,
      whatToDo: "काय करावे",
      contactSuperAdmin: "गटाच्या SuperAdmin शी थेट संपर्क साधा.",
      verifyInfo: "तुमची माहिती योग्य असल्याची खात्री करा.",
      signOut: "साइन आउट",
      footer: "BachatGatOnline · बचत गट व्यवस्थापन",
    },
    en: {
      title: "Request Not Approved",
      nameLabel: "Name:",
      groupLabel: "Group:",
      notApprovedMsg: `Your request to join ${orgName} was not approved by the admin.`,
      whatToDo: "What to do",
      contactSuperAdmin: "Contact the group SuperAdmin directly.",
      verifyInfo: "Verify your information is correct.",
      signOut: "Sign Out",
      footer: "BachatGatOnline · Bachat Gat Management",
    }
  }
  const t = T[lang]

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/sign-in')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F1117] flex items-center justify-center p-4 transition-colors duration-250">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-[#1A1D27] rounded-3xl shadow-lg dark:shadow-none border border-red-100 dark:border-gray-800 overflow-hidden">
          {/* Red top bar */}
          <div className="bg-red-500 h-2 w-full" />
          
          <div className="p-8 text-center space-y-6">
            {/* Icon */}
            <div className="w-20 h-20 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center mx-auto border-4 border-red-100 dark:border-red-900/30">
              <span className="text-4xl">❌</span>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                {t.title}
              </h1>
            </div>

            {/* Message */}
            <div className="bg-red-50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/20 rounded-2xl p-5 text-left space-y-3">
              {memberName && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">{t.nameLabel}</span> {memberName}
                </p>
              )}
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">{t.groupLabel}</span> {orgName}
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 font-medium border-t border-red-200 dark:border-red-900/40 pt-3 mt-3">
                {t.notApprovedMsg}
              </p>
            </div>

            {/* What to do */}
            <div className="bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/20 rounded-2xl p-4 text-left">
              <p className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-2">
                {t.whatToDo}
              </p>
              <ul className="space-y-2 text-sm text-amber-900 dark:text-amber-300">
                <li className="flex items-start gap-2">
                  <span>1.</span>
                  <span>{t.contactSuperAdmin}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>2.</span>
                  <span>{t.verifyInfo}</span>
                </li>
              </ul>
            </div>

            {/* Sign out */}
            <button 
              onClick={handleSignOut}
              className="w-full py-3 bg-gray-100 dark:bg-gray-850 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl transition text-sm active:scale-95"
            >
              {t.signOut}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
          {t.footer}
        </p>
      </div>
    </div>
  )
}
