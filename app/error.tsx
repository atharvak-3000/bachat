"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [lang, setLang] = useState<'mr' | 'en'>('mr')
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // Log the error to an external service or console in development
    console.error("Unhandled Runtime Exception Catch:", error)

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("bb_lang") as 'mr' | 'en'
      if (stored === 'mr' || stored === 'en') {
        setLang(stored)
      }
    }
  }, [error])

  const T = {
    mr: {
      title: "काहीतरी चूक झाली",
      desc: "ऍप्लिकेशन चालवताना तांत्रिक अडचण आली आहे. कृपया पुन्हा प्रयत्न करा.",
      tryAgain: "पुन्हा प्रयत्न करा",
      backBtn: "मुख्यपृष्ठावर जा",
      techTitle: "तांत्रिक तपशील (Technical Details)",
      digestLabel: "एरर कोड (Digest):",
      platform: "बचत गट ऑनलाइन",
    },
    en: {
      title: "Something Went Wrong",
      desc: "An unexpected system error occurred while running the application. Please try again.",
      tryAgain: "Try Again",
      backBtn: "Go back to Home",
      techTitle: "Technical Details",
      digestLabel: "Error Digest Code:",
      platform: "Bachatgat Online",
    }
  }
  const t = T[lang]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border border-red-100 rounded-3xl p-8 shadow-xl space-y-6 animate-fadeIn">
        
        {/* Error icon */}
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500 shadow-inner">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* Brand Header */}
        <div className="text-center">
          <span className="inline-block px-3 py-1 bg-red-50 text-red-700 text-xs font-black uppercase tracking-widest rounded-full mb-3">
            {t.platform}
          </span>
          <h1 className="text-2xl font-black text-gray-900 leading-tight">
            {t.title}
          </h1>
          <p className="text-gray-500 text-sm font-medium leading-relaxed mt-2 max-w-xs mx-auto">
            {t.desc}
          </p>
        </div>

        {/* Action Panel */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold px-5 py-3.5 rounded-2xl shadow-md hover:shadow-lg active:scale-95 transition text-center text-sm"
          >
            🔄 {t.tryAgain}
          </button>
          <Link
            href="/"
            className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold px-5 py-3.5 rounded-2xl border border-gray-200 transition text-center text-sm active:scale-95"
          >
            {t.backBtn}
          </Link>
        </div>

        {/* Technical Expandable Details */}
        <div className="border-t border-gray-100 pt-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs font-bold text-gray-400 hover:text-gray-600 flex items-center justify-between w-full"
          >
            <span>🛠️ {t.techTitle}</span>
            <span>{showDetails ? "▲" : "▼"}</span>
          </button>
          
          {showDetails && (
            <div className="mt-3 bg-gray-50 rounded-2xl p-4 border border-gray-100 font-mono text-[11px] text-gray-600 space-y-2 select-text leading-relaxed overflow-x-auto">
              <p className="font-semibold text-red-600">Error: {error.message || "Unknown Runtime Exception"}</p>
              {error.digest && (
                <p>
                  <span className="font-semibold text-gray-800">{t.digestLabel}</span> {error.digest}
                </p>
              )}
              {error.stack && (
                <pre className="text-[10px] mt-2 border-t border-gray-150 pt-2 whitespace-pre text-gray-400 overflow-x-auto max-h-40">
                  {error.stack}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Mini Language Switcher */}
        <div className="flex justify-center gap-4 border-t border-gray-50 pt-4">
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
