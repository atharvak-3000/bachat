"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [lang, setLang] = useState<'mr' | 'en'>('mr')
  const [verifyingSession, setVerifyingSession] = useState(true)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("bb_lang") as 'mr' | 'en'
      if (stored === 'mr' || stored === 'en') {
        setLang(stored)
      }
    }

    const checkSession = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push("/forgot-password?error=session_expired")
        } else {
          setVerifyingSession(false)
        }
      } catch (err) {
        console.error("[Reset Password Session Check Error]:", err)
        router.push("/forgot-password?error=session_expired")
      }
    }

    checkSession()
  }, [router])

  const T = {
    mr: {
      title: "नवीन पासवर्ड सेट करा",
      sub: "कृपया तुमच्या खात्यासाठी किमान ८ अक्षरांचा सुरक्षित पासवर्ड तयार करा.",
      passwordLabel: "नवीन पासवर्ड",
      confirmLabel: "पासवर्डची खात्री करा",
      submitBtn: "पासवर्ड जतन करा",
      submitting: "जतन करत आहे...",
      successMsg: "🎉 पासवर्ड यशस्वीरित्या बदलला आहे! तुम्हाला २ सेकंदात लॉगिन स्क्रीनवर पाठवले जात आहे...",
      matchError: "दोन्ही पासवर्ड सारखे असणे आवश्यक आहे",
      lengthError: "पासवर्ड किमान ८ अक्षरांचा असावा",
      verifying: "तुमच्या सुरक्षित सत्राची पडताळणी करत आहे...",
      platform: "बचत गट ऑनलाइन",
    },
    en: {
      title: "Reset New Password",
      sub: "Please create a secure password of at least 8 characters for your account.",
      passwordLabel: "New Password",
      confirmLabel: "Confirm New Password",
      submitBtn: "Save New Password",
      submitting: "Saving password...",
      successMsg: "🎉 Password updated successfully! Redirecting you to login in 2 seconds...",
      matchError: "Passwords must match",
      lengthError: "Password must be at least 8 characters long",
      verifying: "Verifying your secure session...",
      platform: "Bachatgat Online",
    }
  }
  const t = T[lang]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // 1. Minimum 8 characters validation
    if (password.length < 8) {
      setError(t.lengthError)
      return
    }

    // 2. Passwords must match validation
    if (password !== confirmPassword) {
      setError(t.matchError)
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push("/sign-in")
        }, 2000)
      }
    } catch (err: any) {
      console.error("[Reset Password Submit Exception]:", err)
      setError(
        lang === 'mr'
          ? "तांत्रिक त्रुटी. पासवर्ड जतन करणे अपयशी ठरले."
          : "Technical error. Failed to save new password."
      )
    } finally {
      setLoading(false)
    }
  }

  if (verifyingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-[#0D1021] dark:to-[#0F1117] flex flex-col items-center justify-center p-4 transition-colors duration-250">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-orange-700 dark:text-orange-400 text-sm font-bold tracking-wide animate-pulse">
          {t.verifying}
        </p>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-[#0D1021] dark:to-[#0F1117] flex items-center justify-center p-4 transition-colors duration-250">
      {/* Mini Brand Header */}
      <div className="absolute top-4 left-4 font-black text-lg text-orange-600 dark:text-orange-400">
        🪷 {t.platform}
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-[#1A1D27] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl p-8 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
              {t.title}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed">
              {t.sub}
            </p>
          </div>

          {success ? (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 text-green-800 dark:text-green-400 p-5 rounded-2xl text-sm font-bold leading-relaxed animate-fadeIn">
              {t.successMsg}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  {t.passwordLabel}
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  {t.confirmLabel}
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400 font-semibold animate-pulse">
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold py-3.5 rounded-xl text-center text-sm shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-50 transition duration-150"
              >
                {loading ? t.submitting : t.submitBtn}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
