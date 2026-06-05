'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

type Screen = 'landing' | 'select' | 'superadmin' | 'member'

export default function SignInPage() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [lang, setLang] = useState<'mr'|'en'>('mr')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('bb_lang') as 'mr'|'en'
      if (savedLang && (savedLang === 'mr' || savedLang === 'en')) {
        setLang(savedLang)
      }
    }
  }, [])

  const setLanguage = (l: 'mr'|'en') => {
    setLang(l)
    if (typeof window !== 'undefined') {
      localStorage.setItem('bb_lang', l)
    }
  }

  const T = {
    mr: {
      createGat: 'नवीन बचत गट तयार करा',
      createSub: 'तुमचा गट नोंदवा आणि सुरुवात करा',
      loginGat: 'विद्यमान गटात लॉगिन करा',
      loginSub: 'तुमच्या गटाचे डॅशबोर्ड उघडा',
      trustedBy: 'महाराष्ट्रातील बचत गटांचा विश्वास',
      loginAs: 'म्हणून लॉगिन करा',
      chooseRole: 'सुरू ठेवण्यासाठी तुमची भूमिका निवडा',
      superadmin: 'महाध्यक्ष',
      superadminDesc: 'गट, सदस्य, सभा आणि कर्ज व्यवस्थापित करा',
      superadminEmail: 'ईमेलसह लॉगिन करा',
      member: 'सदस्य',
      memberDesc: 'बचत, कर्ज आणि व्यवहारांचा इतिहास पहा',
      memberPhone: 'मोबाईल नंबरसह लॉगिन करा',
      phone: 'मोबाईल नंबर',
      password: 'पासवर्ड',
      signIn: 'साइन इन करा',
      signingIn: 'साइन इन करत आहे...',
      back: '← मागे',
      invalidMember: 'अवैध फोन नंबर किंवा पासवर्ड. तुमच्या गट अॅडमिनशी संपर्क साधा.',
      invalidAdmin: 'अवैध ईमेल किंवा पासवर्ड.',
      noCredentials: 'लॉगिन माहिती नाही? तुमच्या गट महाध्यक्षांना विचारा.',
      logoSub: 'बचत गट व्यवस्थापन',
      logoDesc: 'Digital platform for Bachat Gat management',
      adminLoginTitle: 'महाध्यक्ष लॉगिन',
      adminLoginSub: 'तुमच्या ईमेलने साइन इन करा',
      memberLoginTitle: 'सदस्य लॉगिन',
      memberLoginSub: 'अॅडमिनकडून मिळालेली माहिती वापरा',
    },
    en: {
      createGat: 'Create New Bachat Gat',
      createSub: 'Register your group and get started',
      loginGat: 'Login to Existing Gat',
      loginSub: "Access your group's dashboard",
      trustedBy: 'Trusted by Bachat Gats across Maharashtra',
      loginAs: 'Login As',
      chooseRole: 'Choose your role to continue',
      superadmin: 'Superadmin',
      superadminDesc: 'Manage gat, members, meetings & loans',
      superadminEmail: 'Login with Email',
      member: 'Member',
      memberDesc: 'View savings, loans & transaction history',
      memberPhone: 'Login with Phone Number',
      phone: 'Phone Number',
      password: 'Password',
      signIn: 'Sign In',
      signingIn: 'Signing in...',
      back: '← Back',
      invalidMember: 'Invalid phone number or password. Contact your group admin.',
      invalidAdmin: 'Invalid email or password.',
      noCredentials: "Don't have credentials? Ask your group superadmin.",
      logoSub: 'Bachat Gat Management',
      logoDesc: 'Digital platform for Bachat Gat management',
      adminLoginTitle: 'Superadmin Login',
      adminLoginSub: 'Sign in with your email',
      memberLoginTitle: 'Member Login',
      memberLoginSub: 'Use credentials from your admin',
    }
  }
  const t = T[lang]

  const LangToggle = () => (
    <div className="absolute top-4 right-4 flex items-center 
                    gap-1 bg-white dark:bg-[#1A1D27] rounded-full border 
                    border-gray-200 dark:border-gray-800 p-1 shadow-sm z-50">
      <button
        type="button"
        onClick={() => setLanguage('mr')}
        className={`px-2.5 py-1 rounded-full text-xs font-bold 
                    transition ${lang === 'mr' 
                      ? 'bg-[#E85D26] text-white' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'}`}
      >
        मराठी
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 rounded-full text-xs font-bold 
                    transition ${lang === 'en' 
                      ? 'bg-[#E85D26] text-white' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'}`}
      >
        English
      </button>
    </div>
  )

  function reset() {
    setError(''); setEmail(''); setPhone(''); setPassword('')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const loginEmail = screen === 'member' ? `91${phone}@bachatbook.app` : email

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    })

    if (signInError || !data.session) {
      setError(
        screen === 'member'
          ? t.invalidMember
          : t.invalidAdmin
      )
      setLoading(false)
      return
    }

    // Fetch member to route correctly — don't rely on middleware
    const { data: member } = await supabase
      .from('members')
      .select('role, status, organization_id')
      .eq('user_id', data.user.id)
      .maybeSingle()

    if (!member) { window.location.href = '/onboarding'; return }
    if (member.status === 'PENDING') { window.location.href = '/pending'; return }
    if (member.status === 'REJECTED') { window.location.href = '/rejected'; return }
    window.location.href = member.role === 'MEMBER' ? '/member' : '/dashboard'
  }

  // ── SCREEN: LANDING ──────────────────────────────────────────────────────
  if (screen === 'landing') return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#1B2B6B] to-[#2E4099] dark:from-[#0D1021] dark:to-[#0F1117] flex items-center justify-center p-4 transition-colors duration-200">
      <a
        href="/"
        className="absolute top-4 left-4 flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition"
      >
        {lang === 'mr' ? '← मुख्यपृष्ठ' : '← Home'}
      </a>
      <LangToggle />
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="relative h-12 w-48 mb-2">
            <Image
              src="/logo-horizontal.png"
              alt="BachatGatOnline"
              fill
              sizes="192px"
              className="object-contain brightness-0 invert"
              priority
            />
          </div>
          <p className="text-orange-300 dark:text-orange-400 font-medium mt-1">{t.logoSub}</p>
          <p className="text-blue-100 dark:text-blue-200 text-sm mt-2">{t.logoDesc}</p>
        </div>

        {/* Action cards */}
        <div className="space-y-3">
          <a
            href="/sign-up"
            className="flex items-center gap-4 p-5 bg-[#E85D26] text-white rounded-2xl shadow-md hover:bg-[#D04E1A] transition-all active:scale-[0.98]"
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-2xl">✨</span>
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">{t.createGat}</p>
              <p className="text-orange-100 text-sm mt-0.5">{t.createSub}</p>
            </div>
          </a>

          <button
            onClick={() => { reset(); setScreen('select') }}
            className="w-full flex items-center gap-4 p-5 bg-white dark:bg-[#1A1D27] border border-transparent dark:border-gray-800 rounded-2xl hover:border-[#E85D26] hover:bg-slate-50 dark:hover:bg-gray-800 transition-all active:scale-[0.98] text-left shadow-sm text-[#1B2B6B] dark:text-white"
          >
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950/20 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-2xl">🔑</span>
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">{t.loginGat}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{t.loginSub}</p>
            </div>
          </button>
        </div>

        <p className="text-center text-xs text-blue-200 dark:text-gray-400 mt-8">
          {t.trustedBy}
        </p>
      </div>
    </div>
  )

  // ── SCREEN: SELECT LOGIN TYPE ─────────────────────────────────────────────
  if (screen === 'select') return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#1B2B6B] to-[#2E4099] dark:from-[#0D1021] dark:to-[#0F1117] flex items-center justify-center p-4 transition-colors duration-200">
      <LangToggle />
      <div className="w-full max-w-sm">
        <button
          onClick={() => setScreen('landing')}
          className="flex items-center gap-1.5 text-sm text-blue-200 hover:text-white mb-6"
        >
          {t.back}
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">{t.loginAs}</h2>
          <p className="text-blue-200 dark:text-gray-400 text-sm mt-1">{t.chooseRole}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => { reset(); setScreen('superadmin') }}
            className="w-full flex items-center gap-4 p-5 bg-white dark:bg-[#1A1D27] border border-transparent dark:border-gray-800 rounded-2xl hover:border-[#E85D26] hover:bg-orange-50/50 dark:hover:bg-orange-950/10 transition-all active:scale-[0.98] text-left shadow-sm"
          >
            <div className="w-14 h-14 bg-orange-100 dark:bg-orange-950/20 text-[#E85D26] rounded-2xl flex items-center justify-center shrink-0">
              <Image src="/Bachat Gat icons/Superadmin.svg" alt="Superadmin" width={32} height={32} />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-lg">{t.superadmin}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{t.superadminDesc}</p>
              <p className="text-[#E85D26] dark:text-orange-400 text-xs mt-1 font-semibold">{t.superadminEmail}</p>
            </div>
          </button>

          <button
            onClick={() => { reset(); setScreen('member') }}
            className="w-full flex items-center gap-4 p-5 bg-white dark:bg-[#1A1D27] border border-transparent dark:border-gray-800 rounded-2xl hover:border-[#E85D26] hover:bg-orange-50/50 dark:hover:bg-orange-950/10 transition-all active:scale-[0.98] text-left shadow-sm"
          >
            <div className="w-14 h-14 bg-orange-100 dark:bg-orange-950/20 text-[#E85D26] rounded-2xl flex items-center justify-center shrink-0">
              <Image src="/Bachat Gat icons/Member.svg" alt="Member" width={32} height={32} />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-lg">{t.member}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{t.memberDesc}</p>
              <p className="text-[#E85D26] dark:text-orange-400 text-xs mt-1 font-semibold">{t.memberPhone}</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )

  // ── SCREEN: LOGIN FORM (superadmin or member) ─────────────────────────────
  const isMember = screen === 'member'

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#1B2B6B] to-[#2E4099] dark:from-[#0D1021] dark:to-[#0F1117] flex items-center justify-center p-4 transition-colors duration-200">
      <LangToggle />
      <div className="w-full max-w-sm">
        <button
          onClick={() => { setScreen('select'); reset() }}
          className="flex items-center gap-1.5 text-sm text-blue-200 hover:text-white mb-6"
        >
          {t.back}
        </button>

        {/* Header */}
        <div className="bg-white dark:bg-[#1A1D27] rounded-3xl border border-white/10 dark:border-gray-800 shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isMember ? 'bg-orange-100 dark:bg-orange-950/20 text-[#E85D26]' : 'bg-blue-50 dark:bg-blue-950/20 text-[#1B2B6B] dark:text-blue-400'}`}>
              <Image 
                src={isMember ? "/Bachat Gat icons/Member.svg" : "/Bachat Gat icons/Superadmin.svg"} 
                alt={isMember ? "Member" : "Superadmin"} 
                width={28} 
                height={28} 
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1B2B6B] dark:text-white">
                {isMember ? t.memberLoginTitle : t.adminLoginTitle}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                {isMember ? t.memberLoginSub : t.adminLoginSub}
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {isMember ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.phone}
                </label>
                <div className="flex items-stretch bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#E85D26] focus-within:border-transparent transition-all">
                  <span className="flex items-center px-3 bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-300 font-semibold select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="flex-1 bg-transparent text-gray-900 dark:text-white px-4 py-3 text-sm focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {t.password}
                </label>
                <a
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#E85D26] hover:text-[#D04E1A] transition-colors"
                >
                  {lang === 'mr' ? 'पासवर्ड विसरलात?' : 'Forgot password?'}
                </a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (isMember && phone.length !== 10)}
              className="w-full text-white rounded-xl py-3.5 text-sm font-bold disabled:opacity-50 transition-colors mt-2 bg-[#E85D26] hover:bg-[#D04E1A] active:scale-95"
            >
              {loading ? t.signingIn : t.signIn}
            </button>
          </form>

          {isMember && (
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
              {t.noCredentials}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
