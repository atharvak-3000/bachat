"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { toast } from "sonner"
import DarkModeToggle from "@/components/ui/DarkModeToggle"
import { formatRupees } from "@/lib/calculations"
import { Check, ShieldAlert, BadgeCheck, ArrowRight, RefreshCw, Trophy } from "lucide-react"

const SUBSCRIBE_T = {
  mr: {
    title: "बचत गट ऑनलाईन",
    expiredTitle: "चाचणी / वर्गणी संपली आहे ⚠️",
    expiredSubtitle: "तुमच्या बचत गटाचे व्यवस्थापन सुरू ठेवण्यासाठी कृपया खालीलपैकी एक योजना निवडून पेमेंट पूर्ण करा.",
    currentMembers: "चालू सक्रिय सदस्य",
    basicPlan: "Basic योजना",
    standardPlan: "Standard योजना",
    premiumPlan: "Premium योजना",
    payBtn: "पेमेंट करा (Pay Now) 💳",
    membersLimit: "सदस्य मर्यादा",
    membersText: "सदस्य",
    priceText: "प्रति महिना",
    unlimited: "अमर्यादित",
    features: "समाविष्ट वैशिष्ट्ये",
    feat1: "✓ डिजिटल पासबुक आणि लेजर",
    feat2: "✓ कर्ज आणि ईएमआय व्यवस्थापन",
    feat3: "✓ उपस्थिती आणि सभेची नोंदणी",
    feat4: "✓ मोबाईल एसएमएस सूचना आणि केवायसी",
    submitting: "पेमेंट गेटवेवर नेत आहे...",
    paymentFailedTitle: "पेमेंट अयशस्वी झाले",
    paymentFailedDesc: "व्यवहार पूर्ण होऊ शकला नाही. कृपया पुन्हा प्रयत्न करा. पैसे कापले असल्यास ७ दिवसांत परत मिळतील.",
    paymentSuccessTitle: "पेमेंट यशस्वी झाले!",
    paymentSuccessDesc: "तुमच्या बचत गटाची वर्गणी यशस्वीरित्या सक्रिय झाली आहे. पूर्ण ऍक्सेस पुन्हा सुरू झाला आहे.",
    goToDashboard: "डॅशबोर्डवर जा →",
    restrictedBasic: "Basic योजना निवडता येणार नाही कारण तुमच्या गटात १० पेक्षा जास्त सक्रिय सदस्य आहेत.",
    restrictedStandard: "Standard योजना निवडता येणार नाही कारण तुमच्या गटात १५ पेक्षा जास्त सक्रिय सदस्य आहेत.",
    priceBasic: "₹१५०",
    priceStandard: "₹२५०",
    pricePremium: "₹५००",
    currentPlanTitle: "चालू योजना सारांश",
    statusLabel: "स्थिती",
    expiryLabel: "कालबाह्यता तारीख",
    trialLabel: "चाचणी समाप्त तारीख",
    membersLabel: "सदस्य संख्या",
    currentPlanBadge: "चालू योजना",
    upgradeBtn: "योजना बदला (Change Plan)",
    noActivePlan: "सक्रिय योजना नाही",
    activeStatus: "सक्रिय (Active)",
    expiredStatus: "कालबाह्य (Expired)",
  },
  en: {
    title: "BachatGatOnline",
    expiredTitle: "Trial / Subscription Expired ⚠️",
    expiredSubtitle: "Please select one of the plans below and complete the payment to continue managing your Bachat Gat.",
    currentMembers: "Current Active Members",
    basicPlan: "Basic Plan",
    standardPlan: "Standard Plan",
    premiumPlan: "Premium Plan",
    payBtn: "Pay Now 💳",
    membersLimit: "Member Limit",
    membersText: "members",
    priceText: "per month",
    unlimited: "Unlimited",
    features: "Features Included",
    feat1: "✓ Digital Passbook & Ledger",
    feat2: "✓ Loan & EMI Management",
    feat3: "✓ Attendance & Meeting Logs",
    feat4: "✓ Mobile SMS Alerts & Member KYC",
    submitting: "Redirecting to payment gateway...",
    paymentFailedTitle: "Payment Failed",
    paymentFailedDesc: "The transaction could not be completed. Please try again. If money was deducted, it will be refunded within 7 days.",
    paymentSuccessTitle: "Payment Successful!",
    paymentSuccessDesc: "Your Bachat Gat subscription has been activated. Full access has been restored.",
    goToDashboard: "Go to Dashboard →",
    restrictedBasic: "Cannot select Basic plan because you have more than 10 active members.",
    restrictedStandard: "Cannot select Standard plan because you have more than 15 active members.",
    priceBasic: "₹150",
    priceStandard: "₹250",
    pricePremium: "₹500",
    currentPlanTitle: "Current Plan Summary",
    statusLabel: "Status",
    expiryLabel: "Expiry Date",
    trialLabel: "Trial Ends Date",
    membersLabel: "Members Count",
    currentPlanBadge: "Current Plan",
    upgradeBtn: "Change Plan / Upgrade",
    noActivePlan: "No Active Plan",
    activeStatus: "Active",
    expiredStatus: "Expired",
  }
}

export default function SubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-orange-50 dark:bg-[#0D1021] transition-colors duration-200">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <SubscribeContent />
    </Suspense>
  )
}

const getRecommendedPlanId = (count: number): "BASIC" | "STANDARD" | "PREMIUM" => {
  if (count <= 10) return "BASIC"
  if (count <= 15) return "STANDARD"
  return "PREMIUM"
}

function SubscribeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentStatus = searchParams.get("payment")
  
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [lang, setLang] = useState<"mr" | "en">("mr")
  const [memberCount, setMemberCount] = useState<number>(0)
  const [orgName, setOrgName] = useState<string>("")
  const [selectedPlan, setSelectedPlan] = useState<"BASIC" | "STANDARD" | "PREMIUM">("STANDARD")
  const [org, setOrg] = useState<{
    subscription_plan?: string
    subscription_status?: string
    subscription_expires_at?: string
    trial_ends_at?: string
    max_members?: number
  } | null>(null)

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

  const t = SUBSCRIBE_T[lang]

  useEffect(() => {
    const checkSessionAndFetchDetails = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/sign-in")
        return
      }

      // Get current member and organization details
      const { data: member } = await supabase
        .from("members")
        .select(`
          role,
          organization_id,
          organization:organizations(
            id,
            name,
            subscription_status,
            subscription_expires_at,
            trial_ends_at,
            subscription_plan,
            max_members
          )
        `)
        .eq("user_id", user.id)
        .maybeSingle()

      if (!member) {
        router.push("/onboarding")
        return
      }

      if (member.role === "MEMBER") {
        router.push("/member")
        return
      }

      const organization: any = member.organization
      if (!organization) {
        router.push("/onboarding")
        return
      }

      setOrgName(organization.name)
      setOrg(organization)

      // Get count of active members
      const { count, error: countError } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", member.organization_id)
        .eq("status", "ACTIVE")

      if (!countError && count !== null) {
        setMemberCount(count)
        
        // Automatically default selected plan based on member count
        if (count <= 10) {
          setSelectedPlan("BASIC")
        } else if (count <= 15) {
          setSelectedPlan("STANDARD")
        } else {
          setSelectedPlan("PREMIUM")
        }
      }

      setChecking(false)
    }

    checkSessionAndFetchDetails()
  }, [router, paymentStatus])

  const handleInitiatePayment = async (planId: "BASIC" | "STANDARD" | "PREMIUM") => {
    setLoading(true)
    try {
      const res = await fetch("/api/subscriptions/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate payment")
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("No payment redirection URL returned")
      }
    } catch (err: any) {
      toast.error(err.message || "Payment initiation failed")
      setLoading(false)
    }
  }

  const getPlanName = (planKey?: string, status?: string) => {
    if (!planKey || planKey.toUpperCase() === "FREE") return t.noActivePlan
    const key = planKey.toUpperCase()
    if (status === "TRIAL") {
      if (key === "BASIC") return `${t.basicPlan} (${lang === "mr" ? "चाचणी" : "Trial"})`
      if (key === "STANDARD") return `${t.standardPlan} (${lang === "mr" ? "चाचणी" : "Trial"})`
      if (key === "PREMIUM") return `${t.premiumPlan} (${lang === "mr" ? "चाचणी" : "Trial"})`
      return `${lang === "mr" ? "मोफत चाचणी" : "Free Trial"}`
    }
    if (key === "BASIC") return t.basicPlan
    if (key === "STANDARD") return t.standardPlan
    if (key === "PREMIUM") return t.premiumPlan
    return key
  }

  // Calculate active subscription status
  const now = new Date()
  const hasTrial = org?.subscription_status === "TRIAL" && org.trial_ends_at && new Date(org.trial_ends_at) > now
  const hasActive = org?.subscription_status === "ACTIVE" && org.subscription_expires_at && new Date(org.subscription_expires_at) > now
  const isActive = !!(hasTrial || hasActive)

  const isCurrentActivePlan = (planKey: string) => {
    if (!org || !isActive) return false
    return org.subscription_plan?.toUpperCase() === planKey.toUpperCase()
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50 dark:bg-[#0D1021] transition-colors duration-200">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-orange-50 dark:bg-[#0D1021] transition-colors duration-200 animate-fade-in">
      {/* Top Header Control Bar */}
      <header className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🪷</span>
          <span className="font-black text-lg text-[#1B2B6B] dark:text-white uppercase tracking-wider">{t.title}</span>
        </div>
        <div className="flex items-center gap-3">
          {isActive && (
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 border border-orange-200 dark:border-gray-800 text-xs font-bold text-[#1B2B6B] dark:text-white bg-white dark:bg-[#1A1D27] rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/20 active:scale-95 transition-all shadow-sm"
            >
              {lang === "mr" ? "डॅशबोर्ड →" : "Dashboard →"}
            </button>
          )}
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
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-6xl mx-auto w-full">
        {/* Payment Success/Failed Status Banners */}
        {paymentStatus === "failed" && (
          <div className="w-full max-w-4xl mb-6 bg-red-50 dark:bg-red-950/10 border-2 border-red-500/30 rounded-2xl p-4 flex items-start gap-3 shadow-md">
            <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-black text-red-800 dark:text-red-400 text-sm leading-tight">{t.paymentFailedTitle}</h3>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1 font-medium">{t.paymentFailedDesc}</p>
            </div>
          </div>
        )}

        {paymentStatus === "success" && (
          <div className="w-full max-w-4xl mb-6 bg-green-50 dark:bg-green-950/10 border-2 border-green-500/30 rounded-2xl p-4 flex items-start justify-between gap-3 shadow-md">
            <div className="flex items-start gap-3">
              <BadgeCheck className="w-6 h-6 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-black text-green-800 dark:text-green-400 text-sm leading-tight">{t.paymentSuccessTitle}</h3>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1 font-medium">{t.paymentSuccessDesc}</p>
              </div>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow transition active:scale-95 shrink-0"
            >
              {t.goToDashboard}
            </button>
          </div>
        )}

        {/* Current Plan Status Card */}
        {org && (
          <div className="w-full max-w-4xl bg-white dark:bg-[#1A1D27] rounded-3xl shadow-lg border border-orange-100 dark:border-gray-800 p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-black text-[#1B2B6B] dark:text-white uppercase tracking-wider">{t.currentPlanTitle}</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600 dark:text-gray-300">
                <div>
                  <span className="font-bold">{lang === "mr" ? "योजना:" : "Plan:"}</span>{" "}
                  <span className="font-extrabold text-[#1B2B6B] dark:text-white bg-orange-100/50 dark:bg-orange-950/20 px-2.5 py-0.5 rounded-lg border border-orange-200/50 dark:border-orange-950/40 text-xs">
                    {getPlanName(org.subscription_plan, org.subscription_status)}
                  </span>
                </div>
                <div>
                  <span className="font-bold">{t.statusLabel}:</span>{" "}
                  <span className={`font-extrabold px-2.5 py-0.5 rounded-lg text-xs border ${
                    isActive 
                      ? "bg-green-50 dark:bg-green-950/10 border-green-500/30 text-green-700 dark:text-green-400" 
                      : "bg-red-50 dark:bg-red-950/10 border-red-500/30 text-red-700 dark:text-red-400"
                  }`}>
                    {isActive ? t.activeStatus : t.expiredStatus}
                  </span>
                </div>
                {org.subscription_expires_at && (
                  <div className="sm:col-span-2">
                    <span className="font-bold">{t.expiryLabel}:</span>{" "}
                    <span className="font-extrabold text-[#1B2B6B] dark:text-white">
                      {new Date(org.subscription_expires_at).toLocaleDateString(lang === "mr" ? "mr-IN" : "en-IN", {
                        day: "numeric", month: "long", year: "numeric"
                      })}
                    </span>
                  </div>
                )}
                {org.subscription_status === "TRIAL" && org.trial_ends_at && !org.subscription_expires_at && (
                  <div className="sm:col-span-2">
                    <span className="font-bold">{t.trialLabel}:</span>{" "}
                    <span className="font-extrabold text-[#1B2B6B] dark:text-white">
                      {new Date(org.trial_ends_at).toLocaleDateString(lang === "mr" ? "mr-IN" : "en-IN", {
                        day: "numeric", month: "long", year: "numeric"
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full md:w-80 space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400">
                <span>{t.membersLabel}</span>
                <span>{memberCount} / {org.max_members || 10} {t.membersText}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-950 h-3 rounded-full overflow-hidden border border-gray-200/50 dark:border-gray-800/40">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    (memberCount / (org.max_members || 10)) > 0.9 
                      ? "bg-red-500" 
                      : "bg-orange-500"
                  }`}
                  style={{ width: `${Math.min(100, (memberCount / (org.max_members || 10)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="text-center max-w-2xl mx-auto space-y-3 mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-[#1B2B6B] dark:text-white leading-tight">
            {isActive ? (lang === "mr" ? "योजना व्यवस्थापित करा ⚙️" : "Manage Subscription ⚙️") : t.expiredTitle}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {isActive ? (lang === "mr" ? "नवीन सुविधेसाठी तुमची योजना अपग्रेड करा किंवा मुदत वाढवा." : "Upgrade to a higher tier or renew your current subscription period.") : t.expiredSubtitle}
          </p>

          <div className="inline-flex items-center gap-2 bg-orange-100/50 dark:bg-orange-950/20 px-4 py-2 rounded-2xl border border-orange-200/50 dark:border-orange-950/40 text-xs font-bold text-orange-700 dark:text-orange-400">
            <span>🏢 {orgName}</span>
            <span className="opacity-40">|</span>
            <span>👥 {t.currentMembers}: {memberCount}</span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          
          {/* Basic Plan */}
          <div className={`border rounded-3xl p-6 bg-white dark:bg-[#1A1D27] hover:scale-102 transition duration-300 flex flex-col justify-between shadow-sm relative ${
            isCurrentActivePlan("BASIC") 
              ? "border-green-500 dark:border-green-600 border-2 shadow-md ring-2 ring-green-500/20" 
              : getRecommendedPlanId(memberCount) === "BASIC" 
              ? "border-orange-500 dark:border-orange-700 border-2 shadow-md" 
              : "border-orange-100 dark:border-gray-800"
          } ${memberCount > 10 ? "opacity-60" : ""}`}>
            
            {isCurrentActivePlan("BASIC") ? (
              <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-[8px] font-black uppercase px-3.5 py-1 rounded-full tracking-wider shadow">
                {lang === "mr" ? "चालू योजना ✓" : "Current Plan ✓"}
              </span>
            ) : getRecommendedPlanId(memberCount) === "BASIC" ? (
              <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-600 text-white text-[8px] font-black uppercase px-3.5 py-1 rounded-full tracking-wider shadow animate-pulse">
                {lang === "mr" ? "शिफारस केलेले" : "Recommended"}
              </span>
            ) : null}

            <div>
              <h3 className="font-extrabold text-[#1B2B6B] dark:text-white text-lg mt-1">{t.basicPlan}</h3>
              <p className="text-[11px] text-gray-400 mt-1">{lang === "mr" ? "लहान गटांसाठी" : "For smaller groups"}</p>
              <div className="my-6">
                <span className="text-3xl font-black text-[#1B2B6B] dark:text-white">{t.priceBasic}</span>
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

            <div>
              {memberCount > 10 ? (
                <div className="text-[10px] text-red-600 dark:text-red-400 font-bold mb-3 leading-relaxed flex items-start gap-1">
                  <span>⚠️</span>
                  <span>{lang === "mr" ? "तुमच्याकडे या योजनेच्या मर्यादेपेक्षा जास्त सदस्य आहेत" : "You have more members than this plan allows"}</span>
                </div>
              ) : null}
              <button 
                onClick={() => handleInitiatePayment("BASIC")}
                disabled={loading || memberCount > 10 || isCurrentActivePlan("BASIC")}
                className={`w-full py-3.5 font-bold rounded-xl transition active:scale-95 shadow-sm flex items-center justify-center gap-2 ${
                  isCurrentActivePlan("BASIC")
                    ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 cursor-default"
                    : "bg-[#1B2B6B] hover:bg-[#15204C] dark:bg-blue-900/30 dark:hover:bg-blue-900/50 disabled:opacity-30 text-white dark:text-blue-300"
                }`}
              >
                {loading && selectedPlan === "BASIC" ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : isCurrentActivePlan("BASIC") ? (
                  lang === "mr" ? "चालू योजना ✓" : "Current Plan ✓"
                ) : (
                  lang === "mr" ? "निवडा (Select)" : "Select"
                )}
              </button>
            </div>
          </div>

          {/* Standard Plan */}
          <div className={`border rounded-3xl p-6 bg-white dark:bg-[#1A1D27] hover:scale-102 transition duration-300 flex flex-col justify-between shadow-lg relative ${
            isCurrentActivePlan("STANDARD") 
              ? "border-green-500 dark:border-green-600 border-2 shadow-md ring-2 ring-green-500/20" 
              : getRecommendedPlanId(memberCount) === "STANDARD" 
              ? "border-orange-500 dark:border-orange-700 border-2 shadow-md" 
              : "border-orange-100 dark:border-gray-800"
          } ${memberCount > 15 ? "opacity-60" : ""}`}>

            {isCurrentActivePlan("STANDARD") ? (
              <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-[8px] font-black uppercase px-3.5 py-1 rounded-full tracking-wider shadow">
                {lang === "mr" ? "चालू योजना ✓" : "Current Plan ✓"}
              </span>
            ) : getRecommendedPlanId(memberCount) === "STANDARD" ? (
              <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-600 text-white text-[8px] font-black uppercase px-3.5 py-1 rounded-full tracking-wider shadow animate-pulse">
                {lang === "mr" ? "शिफारस केलेले" : "Recommended"}
              </span>
            ) : null}

            <div>
              <h3 className="font-extrabold text-orange-600 dark:text-orange-500 text-lg mt-1">{t.standardPlan}</h3>
              <p className="text-[11px] text-gray-400 mt-1">{lang === "mr" ? "मध्यम गटांसाठी" : "For medium groups"}</p>
              <div className="my-6">
                <span className="text-3xl font-black text-[#1B2B6B] dark:text-white">{t.priceStandard}</span>
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

            <div>
              {memberCount > 15 ? (
                <div className="text-[10px] text-red-600 dark:text-red-400 font-bold mb-3 leading-relaxed flex items-start gap-1">
                  <span>⚠️</span>
                  <span>{lang === "mr" ? "तुमच्याकडे या योजनेच्या मर्यादेपेक्षा जास्त सदस्य आहेत" : "You have more members than this plan allows"}</span>
                </div>
              ) : null}
              <button 
                onClick={() => handleInitiatePayment("STANDARD")}
                disabled={loading || memberCount > 15 || isCurrentActivePlan("STANDARD")}
                className={`w-full py-3.5 font-bold rounded-xl transition active:scale-95 shadow-md flex items-center justify-center gap-2 ${
                  isCurrentActivePlan("STANDARD")
                    ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 cursor-default"
                    : "bg-orange-600 hover:bg-orange-700 disabled:opacity-30 text-white"
                }`}
              >
                {loading && selectedPlan === "STANDARD" ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : isCurrentActivePlan("STANDARD") ? (
                  lang === "mr" ? "चालू योजना ✓" : "Current Plan ✓"
                ) : (
                  lang === "mr" ? "निवडा (Select)" : "Select"
                )}
              </button>
            </div>
          </div>

          {/* Premium Plan */}
          <div className={`border rounded-3xl p-6 bg-white dark:bg-[#1A1D27] hover:scale-102 transition duration-300 flex flex-col justify-between shadow-sm relative ${
            isCurrentActivePlan("PREMIUM") 
              ? "border-green-500 dark:border-green-600 border-2 shadow-md ring-2 ring-green-500/20" 
              : getRecommendedPlanId(memberCount) === "PREMIUM" 
              ? "border-orange-500 dark:border-orange-700 border-2 shadow-md" 
              : "border-orange-100 dark:border-gray-800"
          }`}>

            {isCurrentActivePlan("PREMIUM") ? (
              <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-[8px] font-black uppercase px-3.5 py-1 rounded-full tracking-wider shadow">
                {lang === "mr" ? "चालू योजना ✓" : "Current Plan ✓"}
              </span>
            ) : getRecommendedPlanId(memberCount) === "PREMIUM" ? (
              <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-600 text-white text-[8px] font-black uppercase px-3.5 py-1 rounded-full tracking-wider shadow animate-pulse">
                {lang === "mr" ? "शिफारस केलेले" : "Recommended"}
              </span>
            ) : null}

            <div>
              <h3 className="font-extrabold text-[#1B2B6B] dark:text-white text-lg mt-1">{t.premiumPlan}</h3>
              <p className="text-[11px] text-gray-400 mt-1">{lang === "mr" ? "मोठ्या गटांसाठी" : "For larger groups"}</p>
              <div className="my-6">
                <span className="text-3xl font-black text-[#1B2B6B] dark:text-white">{t.pricePremium}</span>
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

            <div>
              <button 
                onClick={() => handleInitiatePayment("PREMIUM")}
                disabled={loading || isCurrentActivePlan("PREMIUM")}
                className={`w-full py-3.5 font-bold rounded-xl transition active:scale-95 shadow-sm flex items-center justify-center gap-2 ${
                  isCurrentActivePlan("PREMIUM")
                    ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 cursor-default"
                    : "bg-[#1B2B6B] hover:bg-[#15204C] dark:bg-blue-900/30 dark:hover:bg-blue-900/50 disabled:opacity-30 text-white dark:text-blue-300"
                }`}
              >
                {loading && selectedPlan === "PREMIUM" ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : isCurrentActivePlan("PREMIUM") ? (
                  lang === "mr" ? "चालू योजना ✓" : "Current Plan ✓"
                ) : (
                  lang === "mr" ? "निवडा (Select)" : "Select"
                )}
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="py-4 text-center text-xs text-gray-400 dark:text-gray-600">
        © 2026 BachatGatOnline. All rights reserved.
      </footer>
    </div>
  )
}
