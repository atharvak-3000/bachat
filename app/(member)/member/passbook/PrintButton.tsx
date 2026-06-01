"use client"

import { useState, useEffect } from "react"
import { getTranslation } from "@/lib/translations"

export default function PrintButton() {
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

  return (
    <button 
      onClick={() => window.print()}
      className="bg-[#E85D26] hover:bg-[#D04E1A] text-white rounded-xl px-5 py-2.5 font-semibold text-sm flex items-center gap-2 transition no-print active:scale-95"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.82l-.24-.24M19.5 8.25v10.5A2.25 2.25 0 0117.25 21H6.75A2.25 2.25 0 014.5 18.75V8.25m15 0V5.25A2.25 2.25 0 0017.25 3H6.75A2.25 2.25 0 004.5 5.25v3m15 0h-15M9 11.25h6m-6 3h6" />
      </svg>
      {t("printPassbook")}
    </button>
  )
}
