"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import Link from "next/link"

export default function SignUpPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName || !phone || !email || !password || !confirmPassword) {
      toast.error("कृपया सर्व फील्ड भरा")
      return
    }

    if (phone.length !== 10 || !/^\d+$/.test(phone)) {
      toast.error("कृपया वैध १० अंकी मोबाईल नंबर टाका")
      return
    }

    if (password.length < 8) {
      toast.error("पासवर्ड किमान ८ अक्षरांचा असावा")
      return
    }

    if (password !== confirmPassword) {
      toast.error("पासवर्ड जुळत नाहीत")
      return
    }

    setLoading(true)
    const supabase = createClient()
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            name: fullName, 
            phone 
          }
        }
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success("नोंदणी यशस्वी झाली!")
        router.push("/onboarding")
      }
    } catch (err: any) {
      toast.error(err.message || "काहीतरी चूक झाली")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1B2B6B] to-[#2E4099] dark:from-[#0D1021] dark:to-[#0F1117] px-4 py-12 transition-colors duration-250">
      <div className="w-full max-w-md bg-white dark:bg-[#1A1D27] rounded-3xl shadow-xl p-8 border border-white/10 dark:border-gray-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1B2B6B] dark:text-white flex items-center justify-center gap-2">
            🪷 BachatGatOnline
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">
            नवीन बचत गट नोंदणी
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              पूर्ण नाव / Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent transition"
              placeholder="उदा. राहुल संभाजी पाटील"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              मोबाईल नंबर / Phone *
            </label>
            <input
              type="tel"
              required
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent transition"
              placeholder="10-digit number"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              ईमेल / Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent transition"
              placeholder="name@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              पासवर्ड / Password (Min 8 chars) *
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent transition"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              पासवर्डची खात्री करा / Confirm Password *
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-[#E85D26] hover:bg-[#D04E1A] text-white font-bold rounded-xl shadow transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              "नोंदणी करा / Sign Up"
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link href="/sign-in" className="text-sm font-bold text-[#E85D26] hover:underline">
            Already have account? Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
