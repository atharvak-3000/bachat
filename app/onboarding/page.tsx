"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import DarkModeToggle from "@/components/ui/DarkModeToggle"
import { formatRupees } from "@/lib/calculations"

type Step1Data = {
  name: string
  village: string
  taluka: string
  district: string
  meeting_frequency: "WEEKLY" | "MONTHLY"
}

type Step2Data = {
  monthly_saving_amount: string
  default_interest_rate: string
  default_penalty_amount: string
  max_loan_limit: string
}

const ONBOARD_T = {
  mr: {
    title: "बचत गट ऑनलाईन",
    step1Title: "तुमच्या बचत गटाची माहिती",
    step2Title: "आर्थिक सेटिंग्ज",
    step3Title: "योजना निवडा आणि सुरुवात करा",
    step3Sub: "तुमच्या गटासाठी योग्य योजना निवडा (कोणतेही क्रेडिट कार्ड आवश्यक नाही)",
    gatName: "गटाचे नाव *",
    gatNamePlaceholder: "उदा. जय भवानी महिला बचत गट",
    village: "गाव / शहर *",
    villagePlaceholder: "उदा. पुणे",
    taluka: "तालुका",
    talukaPlaceholder: "पर्यायी",
    district: "जिल्हा *",
    districtPlaceholder: "उदा. पुणे",
    frequency: "बैठकीची वारंवारता",
    monthly: "मासिक (Monthly)",
    weekly: "साप्ताहिक (Weekly)",
    next: "पुढे जा →",
    back: "← मागे जा",
    createGatBtn: "गट तयार करा 🎉",
    monthlySaving: "मासिक बचत ₹ *",
    interestRate: "व्याज दर % / महिना",
    penaltyAmount: "दंड रक्कम ₹",
    maxLoan: "कर्ज मर्यादा ₹",
    summaryTitle: "सारांश / Summary",
    summaryName: "नाव",
    summaryFreq: "बैठक",
    summarySaving: "मासिक बचत",
    summaryInterest: "व्याज",
    basicPlan: "Basic योजना",
    standardPlan: "Standard योजना",
    premiumPlan: "Premium योजना",
    trialBtn: "७-दिवसांची मोफत चाचणी सुरू करा",
    membersLimit: "सदस्य मर्यादा",
    membersText: "सदस्य संख्या",
    priceText: "प्रति महिना",
    features: "समाविष्ट वैशिष्ट्ये",
    feat1: "✓ डिजिटल पासबुक आणि लेजर",
    feat2: "✓ कर्ज आणि ईएमआय व्यवस्थापन",
    feat3: "✓ उपस्थिती आणि सभेची नोंदणी",
    feat4: "✓ मोबाईल एसएमएस सूचना आणि केवायसी",
    submitting: "लोड होत आहे...",
    fillFields: "कृपया सर्व आवश्यक फील्ड भरा",
    trialSuccess: "मोफत चाचणी यशस्वीरित्या सुरू झाली!",
    trialError: "मोफत चाचणी सुरू करण्यात अपयश आले",
    creationSuccess: "बचत गट यशस्वीरित्या तयार झाला!",
    unlimited: "अमर्यादित"
  },
  en: {
    title: "BachatGatOnline",
    step1Title: "Your Bachat Gat Details",
    step2Title: "Financial Settings",
    step3Title: "Choose a Plan to Begin",
    step3Sub: "Select the plan that fits your Bachat Gat (No credit card required)",
    gatName: "Gat Name *",
    gatNamePlaceholder: "e.g. Jai Bhavani Mahila Bachat Gat",
    village: "Village / City *",
    villagePlaceholder: "e.g. Pune",
    taluka: "Taluka",
    talukaPlaceholder: "Optional",
    district: "District *",
    districtPlaceholder: "e.g. Pune",
    frequency: "Meeting Frequency",
    monthly: "Monthly",
    weekly: "Weekly",
    next: "Next →",
    back: "← Back",
    createGatBtn: "Create Gat 🎉",
    monthlySaving: "Monthly Saving Amount ₹ *",
    interestRate: "Interest Rate % / Month",
    penaltyAmount: "Fine Amount ₹",
    maxLoan: "Max Loan Limit ₹",
    summaryTitle: "Summary",
    summaryName: "Name",
    summaryFreq: "Meeting",
    summarySaving: "Saving",
    summaryInterest: "Interest",
    basicPlan: "Basic Plan",
    standardPlan: "Standard Plan",
    premiumPlan: "Premium Plan",
    trialBtn: "Start 7-Day Free Trial",
    membersLimit: "Member Limit",
    membersText: "members",
    priceText: "per month",
    features: "Features Included",
    feat1: "✓ Digital Passbook & Ledger",
    feat2: "✓ Loan & EMI Management",
    feat3: "✓ Attendance & Meeting Logs",
    feat4: "✓ Mobile SMS Alerts & Member KYC",
    submitting: "Loading...",
    fillFields: "Please fill all required fields",
    trialSuccess: "7-Day Free Trial started successfully!",
    trialError: "Failed to start free trial",
    creationSuccess: "Bachat Gat created successfully!",
    unlimited: "Unlimited"
  }
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [lang, setLang] = useState<"mr" | "en">("mr")

  // Load language preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      setLang((localStorage.getItem("bb_lang") as "mr" | "en") || "mr")
    }
  }, [])

  const toggleLanguage = () => {
    const newLang = lang === "en" ? "mr" : "en"
    setLang(newLang)
    localStorage.setItem("bb_lang", newLang)
    window.dispatchEvent(new CustomEvent("bb-lang-change", { detail: newLang }))
  }

  const t = ONBOARD_T[lang]

  const [step1, setStep1] = useState<Step1Data>({
    name: "",
    village: "",
    taluka: "",
    district: "",
    meeting_frequency: "MONTHLY",
  })

  const [step2, setStep2] = useState<Step2Data>({
    monthly_saving_amount: "",
    default_interest_rate: "2",
    default_penalty_amount: "0",
    max_loan_limit: "",
  })

  useEffect(() => {
    const checkExisting = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/sign-in")
        return
      }

      // Query roles and subscription info
      const { data: member } = await supabase
        .from("members")
        .select(`
          role,
          organization:organizations(
            subscription_status,
            subscription_expires_at,
            trial_ends_at
          )
        `)
        .eq("user_id", user.id)
        .maybeSingle()

      if (member) {
        if (member.role === "MEMBER") {
          router.push("/member")
          return
        }

        const org: any = member.organization
        if (org) {
          const now = new Date()
          const hasTrial = org.subscription_status === "TRIAL" && org.trial_ends_at && new Date(org.trial_ends_at) > now
          const hasActive = org.subscription_status === "ACTIVE" && org.subscription_expires_at && new Date(org.subscription_expires_at) > now

          if (hasTrial || hasActive) {
            router.push("/dashboard")
            return
          }

          if (org.trial_ends_at && new Date(org.trial_ends_at) <= now) {
            router.push("/subscribe")
            return
          }

          // Otherwise, has Gat but hasn't chosen a plan yet (trial_ends_at is NULL)
          setStep(3)
          setChecking(false)
        } else {
          setChecking(false)
        }
      } else {
        setChecking(false)
      }
    }
    checkExisting()
  }, [router])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: step1.name,
          village: step1.village,
          taluka: step1.taluka,
          district: step1.district,
          meeting_frequency: step1.meeting_frequency,
          monthly_saving_amount: parseFloat(step2.monthly_saving_amount) || 0,
          default_interest_rate: parseFloat(step2.default_interest_rate) || 2,
          default_penalty_amount: parseFloat(step2.default_penalty_amount) || 0,
          max_loan_limit: parseFloat(step2.max_loan_limit) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create organization")
      toast.success(t.creationSuccess)
      
      // Move directly to plan selection step instead of dashboard
      setStep(3)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleStartTrial = async (plan: "BASIC" | "STANDARD" | "PREMIUM", maxMembers: number) => {
    setLoading(true)
    try {
      const res = await fetch("/api/subscriptions/start-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, maxMembers })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to start trial")
      toast.success(t.trialSuccess)
      router.push("/dashboard")
    } catch (err: any) {
      toast.error(err.message || t.trialError)
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50 dark:bg-[#0D1021] transition-colors duration-200">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-orange-50 dark:bg-[#0D1021] transition-colors duration-200">
      {/* Top Header Control Bar */}
      <header className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🪷</span>
          <span className="font-black text-lg text-[#1B2B6B] dark:text-white uppercase tracking-wider">{t.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-orange-200 dark:border-gray-800 text-xs font-bold text-orange-600 dark:text-orange-400 bg-white dark:bg-[#1A1D27] hover:bg-orange-50 dark:hover:bg-orange-950/20 active:scale-95 transition-all shadow-sm"
          >
            <span>🌐</span>
            <span className="font-extrabold">{lang === "en" ? "मराठी" : "English"}</span>
          </button>
          <DarkModeToggle className="bg-white hover:bg-orange-50 text-gray-700 border border-orange-200 dark:bg-[#1A1D27] dark:hover:bg-gray-800 dark:text-white dark:border-gray-800" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className={`w-full ${step === 3 ? "max-w-5xl" : "max-w-lg"} bg-white dark:bg-[#1A1D27] rounded-3xl shadow-xl p-8 border border-orange-100 dark:border-gray-800 transition-all duration-300`}>
          
          {/* Step Indicator (Only for steps 1 and 2) */}
          {step < 3 && (
            <div className="flex items-center justify-center gap-4 mb-8">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step === s
                      ? "bg-orange-600 text-white"
                      : step > s
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  }`}>
                    {step > s ? "✓" : s}
                  </div>
                  <span className={`text-xs font-bold hidden sm:block ${step === s ? "text-orange-600 dark:text-orange-400" : "text-gray-400"}`}>
                    {s === 1 ? t.step1Title : t.step2Title}
                  </span>
                  {s < 2 && <div className={`w-12 h-0.5 ${step > s ? "bg-green-500" : "bg-gray-200 dark:bg-gray-800"}`} />}
                </div>
              ))}
            </div>
          )}

          {/* STEP 1: Basic Details */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-black text-[#1B2B6B] dark:text-white pb-1 border-b border-gray-100 dark:border-gray-800">{t.step1Title}</h2>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t.gatName}</label>
                <input type="text" required value={step1.name}
                  onChange={(e) => setStep1({ ...step1, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
                  placeholder={t.gatNamePlaceholder} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t.village}</label>
                  <input type="text" required value={step1.village}
                    onChange={(e) => setStep1({ ...step1, village: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
                    placeholder={t.villagePlaceholder} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t.taluka}</label>
                  <input type="text" value={step1.taluka}
                    onChange={(e) => setStep1({ ...step1, taluka: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
                    placeholder={t.talukaPlaceholder} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t.district}</label>
                <input type="text" required value={step1.district}
                  onChange={(e) => setStep1({ ...step1, district: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
                  placeholder={t.districtPlaceholder} />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t.frequency}</label>
                <select value={step1.meeting_frequency}
                  onChange={(e) => setStep1({ ...step1, meeting_frequency: e.target.value as "WEEKLY" | "MONTHLY" })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition bg-white text-sm">
                  <option value="MONTHLY">{t.monthly}</option>
                  <option value="WEEKLY">{t.weekly}</option>
                </select>
              </div>

              <button
                onClick={() => {
                  if (!step1.name || !step1.village || !step1.district) {
                    toast.error(t.fillFields)
                    return
                  }
                  setStep(2)
                }}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md transition active:scale-95">
                {t.next}
              </button>
            </div>
          )}

          {/* STEP 2: Financial Details */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-black text-[#1B2B6B] dark:text-white pb-1 border-b border-gray-100 dark:border-gray-800">{t.step2Title}</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t.monthlySaving}</label>
                  <input type="number" min="0" required value={step2.monthly_saving_amount}
                    onChange={(e) => setStep2({ ...step2, monthly_saving_amount: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
                    placeholder="100" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t.interestRate}</label>
                  <input type="number" min="0" step="0.1" value={step2.default_interest_rate}
                    onChange={(e) => setStep2({ ...step2, default_interest_rate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
                    placeholder="2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t.penaltyAmount}</label>
                  <input type="number" min="0" value={step2.default_penalty_amount}
                    onChange={(e) => setStep2({ ...step2, default_penalty_amount: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
                    placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t.maxLoan}</label>
                  <input type="number" min="0" value={step2.max_loan_limit}
                    onChange={(e) => setStep2({ ...step2, max_loan_limit: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
                    placeholder="0" />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-orange-50/50 dark:bg-orange-950/10 rounded-xl p-4 border border-orange-100 dark:border-orange-950/20 space-y-2">
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">{t.summaryTitle}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">📍 <strong>{step1.name}</strong> — {step1.village}, {step1.district}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">📅 {step1.meeting_frequency === "MONTHLY" ? t.monthly : t.weekly}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">💰 {t.monthlySaving.replace(" *", "")}: ₹{step2.monthly_saving_amount || 0} | {t.interestRate}: {step2.default_interest_rate || 2}%</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-gray-300 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition active:scale-95">
                  {t.back}
                </button>
                <button onClick={handleSubmit} disabled={loading || !step2.monthly_saving_amount}
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95">
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    t.createGatBtn
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Plan Selection (New Step) */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-2 mb-8">
                <h2 className="text-2xl font-black text-[#1B2B6B] dark:text-white">{t.step3Title}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t.step3Sub}</p>
              </div>

              {/* pricing cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Basic Card */}
                <div className="border border-orange-100 dark:border-gray-800 rounded-3xl p-6 bg-gray-50/50 dark:bg-gray-950/20 hover:border-orange-300 dark:hover:border-orange-950/30 transition duration-300 flex flex-col justify-between shadow-sm">
                  <div>
                    <h3 className="font-extrabold text-[#1B2B6B] dark:text-white text-lg">{t.basicPlan}</h3>
                    <p className="text-[11px] text-gray-400 mt-1">{lang === "mr" ? "लहान गटांसाठी" : "For smaller groups"}</p>
                    <div className="my-6">
                      <span className="text-3xl font-black text-[#1B2B6B] dark:text-white">{formatRupees(15000)}</span>
                      <span className="text-xs text-gray-400 font-bold ml-1">{t.priceText}</span>
                    </div>
                    
                    <div className="border-t border-dashed border-gray-200 dark:border-gray-800 pt-4 space-y-3 mb-6">
                      <p className="text-xs text-gray-600 dark:text-gray-300 font-semibold flex justify-between">
                        <span>{t.membersLimit}:</span>
                        <span className="font-extrabold text-[#1B2B6B] dark:text-white">10 {t.membersText}</span>
                      </p>
                      <div className="space-y-2 text-gray-500 dark:text-gray-400 text-xs font-medium">
                        <p>{t.feat1}</p>
                        <p>{t.feat2}</p>
                        <p>{t.feat3}</p>
                        <p>{t.feat4}</p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleStartTrial("BASIC", 10)}
                    disabled={loading}
                    className="w-full py-3 bg-[#1B2B6B] hover:bg-[#15204C] dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-white dark:text-blue-300 font-bold rounded-xl transition active:scale-95 shadow-sm"
                  >
                    {t.trialBtn}
                  </button>
                </div>

                {/* Standard Card */}
                <div className="border-2 border-orange-500 dark:border-orange-700 rounded-3xl p-6 bg-white dark:bg-[#1A1D27] relative hover:scale-102 transition duration-300 flex flex-col justify-between shadow-lg">
                  {/* Recommended Badge */}
                  <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-600 text-white text-[9px] font-black uppercase px-3.5 py-1 rounded-full tracking-wider shadow">
                    {lang === "mr" ? "शिफारस केलेले" : "Recommended"}
                  </span>
                  <div>
                    <h3 className="font-extrabold text-orange-600 dark:text-orange-500 text-lg mt-1">{t.standardPlan}</h3>
                    <p className="text-[11px] text-gray-400 mt-1">{lang === "mr" ? "मध्यम गटांसाठी" : "For medium groups"}</p>
                    <div className="my-6">
                      <span className="text-3xl font-black text-[#1B2B6B] dark:text-white">{formatRupees(25000)}</span>
                      <span className="text-xs text-gray-400 font-bold ml-1">{t.priceText}</span>
                    </div>

                    <div className="border-t border-dashed border-gray-200 dark:border-gray-800 pt-4 space-y-3 mb-6">
                      <p className="text-xs text-gray-600 dark:text-gray-300 font-semibold flex justify-between">
                        <span>{t.membersLimit}:</span>
                        <span className="font-extrabold text-[#1B2B6B] dark:text-white">15 {t.membersText}</span>
                      </p>
                      <div className="space-y-2 text-gray-500 dark:text-gray-400 text-xs font-medium">
                        <p>{t.feat1}</p>
                        <p>{t.feat2}</p>
                        <p>{t.feat3}</p>
                        <p>{t.feat4}</p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleStartTrial("STANDARD", 15)}
                    disabled={loading}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition active:scale-95 shadow-md"
                  >
                    {t.trialBtn}
                  </button>
                </div>

                {/* Premium Card */}
                <div className="border border-orange-100 dark:border-gray-800 rounded-3xl p-6 bg-gray-50/50 dark:bg-gray-950/20 hover:border-orange-300 dark:hover:border-orange-950/30 transition duration-300 flex flex-col justify-between shadow-sm">
                  <div>
                    <h3 className="font-extrabold text-[#1B2B6B] dark:text-white text-lg">{t.premiumPlan}</h3>
                    <p className="text-[11px] text-gray-400 mt-1">{lang === "mr" ? "मोठ्या गटांसाठी" : "For larger groups"}</p>
                    <div className="my-6">
                      <span className="text-3xl font-black text-[#1B2B6B] dark:text-white">{formatRupees(50000)}</span>
                      <span className="text-xs text-gray-400 font-bold ml-1">{t.priceText}</span>
                    </div>

                    <div className="border-t border-dashed border-gray-200 dark:border-gray-800 pt-4 space-y-3 mb-6">
                      <p className="text-xs text-gray-600 dark:text-gray-300 font-semibold flex justify-between">
                        <span>{t.membersLimit}:</span>
                        <span className="font-extrabold text-[#1B2B6B] dark:text-white">{t.unlimited}</span>
                      </p>
                      <div className="space-y-2 text-gray-500 dark:text-gray-400 text-xs font-medium">
                        <p>{t.feat1}</p>
                        <p>{t.feat2}</p>
                        <p>{t.feat3}</p>
                        <p>{t.feat4}</p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleStartTrial("PREMIUM", 999999)}
                    disabled={loading}
                    className="w-full py-3 bg-[#1B2B6B] hover:bg-[#15204C] dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-white dark:text-blue-300 font-bold rounded-xl transition active:scale-95 shadow-sm"
                  >
                    {t.trialBtn}
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="py-4 text-center text-xs text-gray-400 dark:text-gray-600">
        © 2026 BachatGatOnline. All rights reserved.
      </footer>
    </div>
  )
}
