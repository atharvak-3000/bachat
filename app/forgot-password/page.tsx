"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
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
      title: "पासवर्ड विसरलात?",
      sub: "तुमच्या खात्याचा ईमेल प्रविष्ट करा आणि आम्ही तुम्हाला पासवर्ड रीसेट करण्याची लिंक पाठवू.",
      emailLabel: "ईमेल पत्ता",
      submitBtn: "रीसेट लिंक पाठवा",
      submitting: "लिंक पाठवत आहे...",
      successMsg: "जर हा ईमेल नोंदणीकृत असेल, तर तुम्हाला लवकरच पासवर्ड रिसेट करण्याची लिंक प्राप्त होईल. कृपया तुमचा इनबॉक्स आणि स्पॅम फोल्डर तपासा.",
      backToSignIn: "← लॉगिनवर परत जा",
      platform: "बचत गट ऑनलाइन",
    },
    en: {
      title: "Forgot Password?",
      sub: "Enter your account email address and we will send you a secure password reset link.",
      emailLabel: "Email Address",
      submitBtn: "Send Reset Link",
      submitting: "Sending link...",
      successMsg: "If this email is registered, you will receive a password reset link shortly. Please check your inbox and spam folder.",
      backToSignIn: "← Back to Login",
      platform: "Bachatgat Online",
    }
  }
  const t = T[lang]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClient()
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const redirectTo = `${siteUrl}/auth/confirm`

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })

      if (resetError) {
        // Show error only if it's a structural API error / server error
        setError(resetError.message)
      } else {
        setSuccess(true)
      }
    } catch (err: any) {
      console.error("[Forgot Password Page Exception]:", err)
      setError(
        lang === 'mr' 
          ? 'नेटवर्क एरर. कृपया तुमचे इंटरनेट तपासा आणि पुन्हा प्रयत्न करा.' 
          : 'Network error. Please check your connection and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-[#0D1021] dark:to-[#0F1117] flex items-center justify-center p-4 transition-colors duration-250">
      {/* Mini Brand Header */}
      <div className="absolute top-4 left-4 font-black text-lg text-orange-600 dark:text-orange-400">
        🪷 {t.platform}
      </div>

      <div className="w-full max-w-md">
        {/* Back Link */}
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 mb-6 font-semibold transition"
        >
          {t.backToSignIn}
        </Link>

        {/* Forgot Password Card */}
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
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-2xl p-5 text-sm text-green-800 dark:text-green-400 font-medium leading-relaxed animate-fadeIn">
              🎉 {t.successMsg}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  {t.emailLabel}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
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
