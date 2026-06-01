"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export default function NotFound() {
  const [lang, setLang] = useState<'mr' | 'en'>('mr')

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("bb_lang") as 'mr' | 'en'
      if (stored === 'mr' || stored === 'en') {
        setLang(stored)
      }
    }
  }, [])

  const T = {
    mr: {
      title: "४०४ - पान सापडले नाही",
      desc: "क्षमस्व, तुम्ही शोधत असलेले पृष्ठ अस्तित्वात नाही किंवा ते इतरत्र हलवले गेले आहे.",
      backBtn: "मुख्यपृष्ठावर जा",
      platform: "बचत गट ऑनलाइन",
    },
    en: {
      title: "404 - Page Not Found",
      desc: "Sorry, the page you are looking for does not exist or has been moved to a new address.",
      backBtn: "Go back to Home",
      platform: "Bachatgat Online",
    }
  }
  const t = T[lang]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-orange-100 rounded-3xl p-8 shadow-xl text-center space-y-6 animate-fadeIn">
        
        {/* Decorative Icon */}
        <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto text-orange-500 shadow-inner">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* Brand */}
        <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 text-xs font-black uppercase tracking-widest rounded-full">
          {t.platform}
        </span>

        {/* Content */}
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-gray-900 leading-tight">
            {t.title}
          </h1>
          <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-xs mx-auto">
            {t.desc}
          </p>
        </div>

        {/* Redirect Action Button */}
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition duration-150 text-sm"
          >
            {t.backBtn}
          </Link>
        </div>

        {/* Language Quick Toggle */}
        <div className="flex justify-center gap-4 pt-4 border-t border-gray-50">
          <button
            onClick={() => {
              setLang('mr')
              localStorage.setItem('bb_lang', 'mr')
            }}
            className={`text-xs font-bold transition ${lang === 'mr' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-500'}`}
          >
            मराठी
          </button>
          <span className="text-gray-200">|</span>
          <button
            onClick={() => {
              setLang('en')
              localStorage.setItem('bb_lang', 'en')
            }}
            className={`text-xs font-bold transition ${lang === 'en' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-500'}`}
          >
            English
          </button>
        </div>
      </div>
    </div>
  )
}
