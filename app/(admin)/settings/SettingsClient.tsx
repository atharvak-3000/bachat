"use client"

import { useState, useEffect } from "react"
import type { Organization, Member } from "@/types"
import { useRouter } from "next/navigation"

export default function SettingsClient({ 
  organization, 
  orgId, 
  admins,
  activeMemberCount = 0
}: { 
  organization: Organization, 
  orgId: string, 
  admins: Member[],
  activeMemberCount: number
}) {
  const router = useRouter()
  
  // Gat Profile State
  const [name, setName] = useState(organization.name || "")
  const [village, setVillage] = useState(organization.village || "")
  const [taluka, setTaluka] = useState(organization.taluka || "")
  const [district, setDistrict] = useState(organization.district || "")

  // Financial Settings State
  const [monthlySaving, setMonthlySaving] = useState(organization.monthly_saving_amount / 100 || 0)
  const [interestRate, setInterestRate] = useState(organization.default_interest_rate || 0)
  const [penalty, setPenalty] = useState(organization.default_penalty_amount / 100 || 0)
  const [maxLoan, setMaxLoan] = useState(organization.max_loan_limit / 100 || 0)
  const [frequency, setFrequency] = useState(organization.meeting_frequency || "MONTHLY")

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null)
  const [logoUrl, setLogoUrl] = useState(
    organization.logo_url || ''
  )
  const [logoUploading, setLogoUploading] = useState(false)

  const [lang, setLang] = useState<'mr'|'en'>('mr')

  // Sync prop changes to state when router.refresh() updates organization
  useEffect(() => {
    setName(organization.name || "")
    setVillage(organization.village || "")
    setTaluka(organization.taluka || "")
    setDistrict(organization.district || "")
    setLogoUrl(organization.logo_url || "")
    setMonthlySaving(organization.monthly_saving_amount / 100 || 0)
    setInterestRate(organization.default_interest_rate || 0)
    setPenalty(organization.default_penalty_amount / 100 || 0)
    setMaxLoan(organization.max_loan_limit / 100 || 0)
    setFrequency(organization.meeting_frequency || "MONTHLY")
  }, [organization])

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
      title: "सेटिंग्ज",
      sub: "तुमच्या बचत गटाचे कॉन्फिगरेशन व्यवस्थापित करा",
      profileHeader: "गट प्रोफाइल",
      groupCode: "गट कोड",
      copy: "कॉपी करा",
      copied: "कॉपी केली!",
      gatName: "गटाचे नाव",
      village: "गाव",
      taluka: "तालुका",
      district: "जिल्हा",
      saveProfile: "प्रोफाइल सेव्ह करा",
      financialHeader: "आर्थिक सेटिंग्ज",
      financialSub: "नवीन सभेसाठी लागू होते",
      monthlySaving: "मासिक बचत रक्कम (₹)",
      interestRate: "व्याज दर (% प्रति महिना)",
      penaltyAmount: "दंड रक्कम (₹ प्रति अनुपस्थिती)",
      maxLoanLimit: "कमाल कर्ज मर्यादा (₹, अमर्यादितसाठी 0)",
      meetingFrequency: "सभा वारंवारता",
      saveFinancials: "आर्थिक सेव्ह करा",
      subHeader: "वर्गणी",
      plan: "योजना",
      status: "स्थिती",
      expires: "मुदत संपण्याची तारीख",
      upgradeTitle: "तुमची योजना अपग्रेड करा",
      upgradeSub: "अधिक सदस्य आणि प्रीमियम वैशिष्ट्यांमध्ये प्रवेश मिळवा.",
      comingSoon: "लवकरच येत आहे",
      upgradeBtn: "PhonePe द्वारे अपग्रेड करा",
      adminHeader: "अध्यक्ष व्यवस्थापन",
      currentAdmins: "सध्याचे अध्यक्ष",
      removeAdmin: "अध्यक्ष काढा",
      transferSuperadmin: "सुपरअध्यक्ष हस्तांतरित करा",
      transferSub: "या गटाची मालकी दुसऱ्या सदस्याकडे सोपवा.",
      selectMember: "हस्तांतरित करण्यासाठी सदस्य निवडा...",
      transfer: "हस्तांतरित करा",
      transferWarning: "सध्या सुपरअध्यक्ष भूमिका आपोआप हस्तांतरित केली जाऊ शकत नाही. आवश्यक असल्यास कृपया सपोर्टशी संपर्क साधा.",
      weekly: "साप्ताहिक",
      monthly: "मासिक",
      noAdmins: "कोणतेही अध्यक्ष नियुक्त केलेले नाहीत. आपण सदस्य पृष्ठावरून सदस्यांना अध्यक्ष बनवू शकता.",
      logoLabel: "गटाचा लोगो",
      logoSub: "JPG, PNG किंवा WebP. कमाल २MB.",
      uploadLogo: "लोगो अपलोड करा",
      uploading: "अपलोड होत आहे...",
      logoRemove: "काढा",
      successProfile: "प्रोफाइल यशस्वीरित्या सेव्ह केली",
      successFinancials: "आर्थिक सेटिंग्ज यशस्वीरित्या सेव्ह केल्या",
      logoSuccess: "लोगो यशस्वीरित्या बदलला",
      logoFail: "लोगो बदलण्यात अपयश",
      logoRemoved: "लोगो काढला!",
      removeConfirm: "आपण या वापरकर्त्याकडून अध्यक्ष हक्क काढू इच्छिता?",
    },
    en: {
      title: "Settings",
      sub: "Manage your Bachat Gat configuration",
      profileHeader: "Gat Profile",
      groupCode: "Group Code",
      copy: "Copy",
      copied: "Copied!",
      gatName: "Gat Name",
      village: "Village",
      taluka: "Taluka",
      district: "District",
      saveProfile: "Save Profile",
      financialHeader: "Financial Settings",
      financialSub: "Applies to new meetings",
      monthlySaving: "Monthly Saving Amount (₹)",
      interestRate: "Interest Rate (% per month)",
      penaltyAmount: "Fine Amount (₹ per absence)",
      maxLoanLimit: "Max Loan Limit (₹, 0 for unlimited)",
      meetingFrequency: "Meeting Frequency",
      saveFinancials: "Save Financials",
      subHeader: "Subscription",
      plan: "Plan",
      status: "Status",
      expires: "Expires On",
      upgradeTitle: "Upgrade your plan",
      upgradeSub: "Get access to more members and premium features.",
      comingSoon: "Coming Soon",
      upgradeBtn: "Upgrade via PhonePe",
      adminHeader: "Admin Management",
      currentAdmins: "Current Admins",
      removeAdmin: "Remove Admin",
      transferSuperadmin: "Transfer SuperAdmin",
      transferSub: "Transfer ownership of this Gat to another member.",
      selectMember: "Select member to transfer...",
      transfer: "Transfer",
      transferWarning: "SuperAdmin role cannot be transferred automatically right now. Please contact support if needed.",
      weekly: "Weekly",
      monthly: "Monthly",
      noAdmins: "No admins assigned. You can make members admins from the Members page.",
      logoLabel: "Gat Logo",
      logoSub: "JPG, PNG or WebP. Max 2MB.",
      uploadLogo: "Upload Logo",
      uploading: "Uploading...",
      logoRemove: "Remove",
      successProfile: "Profile updated successfully",
      successFinancials: "Financial settings updated",
      logoSuccess: "Logo updated!",
      logoFail: "Failed to upload logo",
      logoRemoved: "Logo removed!",
      removeConfirm: "Are you sure you want to remove admin rights from this user?",
    }
  }
  const t = T[lang]

  const handleLogoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2MB')
      return
    }
    if (!['image/jpeg','image/png','image/webp']
        .includes(file.type)) {
      alert('Only JPG, PNG, or WebP allowed')
      return
    }

    setLogoUploading(true)
    try {
      // Convert to base64 for simple storage
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        
        // Save to org via API
        const res = await fetch(`/api/organizations/${orgId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logo_url: base64 })
        })
        
        if (res.ok) {
          setLogoUrl(base64)
          alert(t.logoSuccess)
          router.refresh()
        } else {
          alert(t.logoFail)
        }
      }
      reader.readAsDataURL(file)
    } catch (err) {
      alert(t.logoFail)
    } finally {
      setLogoUploading(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(organization.group_code)
    alert(t.copied)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/organizations/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, village, taluka, district })
      })
      if (!res.ok) throw new Error("Failed to save profile")
      setMessage({ type: 'success', text: t.successProfile })
      router.refresh()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveFinancials = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/organizations/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthly_saving_amount: monthlySaving,
          default_interest_rate: interestRate,
          default_penalty_amount: penalty,
          max_loan_limit: maxLoan,
          meeting_frequency: frequency
        })
      })
      if (!res.ok) throw new Error("Failed to save financial settings")
      setMessage({ type: 'success', text: t.successFinancials })
      router.refresh()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAdmin = async (adminId: string) => {
    if (!confirm(t.removeConfirm)) return
    try {
      const res = await fetch(`/api/members/${adminId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "MEMBER" })
      })
      if (!res.ok) throw new Error("Failed to remove admin")
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const getMaxMembers = (plan: string) => {
    if (plan === "BASIC") return 10
    if (plan === "STANDARD") return 15
    return 999999
  }
  const maxLimit = getMaxMembers(organization.subscription_plan)
  const maxLimitStr = maxLimit === 999999 ? (lang === 'mr' ? "अमर्यादित" : "Unlimited") : maxLimit

  const getDaysRemainingText = (expiresAt?: string | null) => {
    if (!expiresAt) return lang === 'mr' ? "अपग्रेड आवश्यक" : "Upgrade Required"
    const diffTime = new Date(expiresAt).getTime() - Date.now()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays <= 0) {
      return lang === 'mr' ? "मुदत संपली" : "Expired"
    }
    if (diffDays === 1) {
      return lang === 'mr' ? "उद्या देय" : "Due tomorrow"
    }
    return lang === 'mr' 
      ? `${diffDays} दिवसांत देय` 
      : `Due in ${diffDays} days`
  }

  const [submittingSub, setSubmittingSub] = useState(false)

  const handleUpgrade = async () => {
    setSubmittingSub(true)
    try {
      const res = await fetch("/api/subscriptions/initiate", {
        method: "POST"
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate payment")
      }
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("Payment URL not returned from server")
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmittingSub(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-[#1B2B6B] dark:text-white">{t.title}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t.sub}</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border border-green-200 dark:border-green-900/30' : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/30'}`}>
          {message.text}
        </div>
      )}

      {/* CARD 1: Gat Profile */}
      <div className="bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
          <h2 className="font-semibold text-[#1B2B6B] dark:text-white">{t.profileHeader}</h2>
        </div>
        <div className="p-6">
          {/* Logo Upload */}
          <div className="flex items-center gap-5 mb-6 pb-6 
                          border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl border-2 
                              border-dashed border-gray-300 dark:border-gray-700 
                              bg-gray-50 dark:bg-gray-950 overflow-hidden
                              flex items-center justify-center">
                {logoUrl ? (
                  <img src={logoUrl} alt="Gat Logo"
                       className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <span className="text-2xl">🪷</span>
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1">
                      No logo
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <p className="font-semibold text-[#1B2B6B] dark:text-white text-sm">
                {t.logoLabel}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-3">
                {t.logoSub}
              </p>
              <label className="cursor-pointer">
                <span className="px-3 py-1.5 bg-white dark:bg-gray-950
                                 border border-[#2E4099] dark:border-blue-900/50 
                                 text-[#2E4099] dark:text-blue-400 text-xs font-semibold 
                                 rounded-lg hover:bg-[#2E4099]/10 dark:hover:bg-blue-950/20 
                                 transition">
                   {logoUploading ? t.uploading : t.uploadLogo}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={logoUploading}
                />
              </label>
              {logoUrl && (
                <button
                  onClick={async () => {
                    setLogoUrl('')
                    const res = await fetch(`/api/organizations/${orgId}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ logo_url: '' })
                    })
                    if (res.ok) {
                      alert(t.logoRemoved)
                      router.refresh()
                    }
                  }}
                  className="ml-2 text-xs text-red-500 dark:text-red-400 hover:underline"
                >
                  {t.logoRemove}
                </button>
              )}
            </div>
          </div>

          <div className="mb-6 flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#1B2B6B] dark:text-white mb-1">{t.groupCode}</label>
              <div className="flex">
                <input type="text" readOnly value={organization.group_code} className="border border-r-0 dark:border-gray-800 rounded-l-lg p-2 bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-400 outline-none w-48 font-mono text-sm" />
                <button onClick={copyCode} className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 px-4 py-2 rounded-r-lg font-semibold text-sm transition text-[#1B2B6B] dark:text-white">{t.copy}</button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.gatName}</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full border dark:border-gray-800 dark:bg-gray-950 dark:text-white rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#E85D26] focus:border-[#E85D26] text-sm transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.village}</label>
              <input type="text" value={village} onChange={e => setVillage(e.target.value)} required className="w-full border dark:border-gray-800 dark:bg-gray-950 dark:text-white rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#E85D26] focus:border-[#E85D26] text-sm transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.taluka}</label>
              <input type="text" value={taluka} onChange={e => setTaluka(e.target.value)} required className="w-full border dark:border-gray-800 dark:bg-gray-950 dark:text-white rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#E85D26] focus:border-[#E85D26] text-sm transition" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.district}</label>
              <input type="text" value={district} onChange={e => setDistrict(e.target.value)} required className="w-full border dark:border-gray-800 dark:bg-gray-950 dark:text-white rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#E85D26] focus:border-[#E85D26] text-sm transition" />
            </div>
            <div className="col-span-2 flex justify-end mt-2">
              <button type="submit" disabled={loading} className="bg-[#E85D26] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#D04E1A] transition disabled:opacity-50 shadow-sm">
                {t.saveProfile}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* CARD 2: Financial Settings */}
      <div className="bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex justify-between items-center">
          <h2 className="font-semibold text-[#1B2B6B] dark:text-white">{t.financialHeader}</h2>
          <span className="text-xs text-[#E85D26] dark:text-orange-400 bg-[#E85D26]/10 dark:bg-[#E85D26]/5 px-2 py-1 rounded-full font-bold">{t.financialSub}</span>
        </div>
        <div className="p-6">
          <form onSubmit={handleSaveFinancials} className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.monthlySaving}</label>
              <input type="number" min="0" value={monthlySaving} onChange={e => setMonthlySaving(Number(e.target.value))} required className="w-full border dark:border-gray-800 dark:bg-gray-950 dark:text-white rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#E85D26] focus:border-[#E85D26] text-sm transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.interestRate}</label>
              <input type="number" step="0.1" min="0" value={interestRate} onChange={e => setInterestRate(Number(e.target.value))} required className="w-full border dark:border-gray-800 dark:bg-gray-950 dark:text-white rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#E85D26] focus:border-[#E85D26] text-sm transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.penaltyAmount}</label>
              <input type="number" min="0" value={penalty} onChange={e => setPenalty(Number(e.target.value))} required className="w-full border dark:border-gray-800 dark:bg-gray-950 dark:text-white rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#E85D26] focus:border-[#E85D26] text-sm transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.maxLoanLimit}</label>
              <input type="number" min="0" value={maxLoan} onChange={e => setMaxLoan(Number(e.target.value))} required className="w-full border dark:border-gray-800 dark:bg-gray-950 dark:text-white rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#E85D26] focus:border-[#E85D26] text-sm transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.meetingFrequency}</label>
              <select value={frequency} onChange={e => setFrequency(e.target.value as "WEEKLY" | "MONTHLY")} className="w-full border dark:border-gray-800 dark:bg-gray-950 dark:text-white rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#E85D26] focus:border-[#E85D26] text-sm bg-white transition">
                <option value="MONTHLY" className="dark:bg-gray-950 dark:text-white">{t.monthly}</option>
                <option value="WEEKLY" className="dark:bg-gray-950 dark:text-white">{t.weekly}</option>
              </select>
            </div>
            <div className="col-span-2 flex justify-end mt-2">
              <button type="submit" disabled={loading} className="bg-[#E85D26] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#D04E1A] transition disabled:opacity-50 shadow-sm">
                {t.saveFinancials}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* CARD 3: Subscription */}
      <div className="bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
          <h2 className="font-semibold text-[#1B2B6B] dark:text-white">{t.subHeader}</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* 1. Plan Card */}
            <div className="bg-gray-50 dark:bg-gray-950/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800/50 flex flex-col justify-between">
              <div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-1">
                  {lang === 'mr' ? "सध्याची योजना" : "Current Plan"}
                </p>
                <span className="font-black text-xl text-[#1B2B6B] dark:text-white">
                  {organization.subscription_plan}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 font-medium">
                {lang === 'mr' ? "वर्गणी स्तर" : "Subscription Tier"}
              </p>
            </div>

            {/* 2. Active Members count */}
            <div className="bg-gray-50 dark:bg-gray-950/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800/50 flex flex-col justify-between">
              <div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-1">
                  {lang === 'mr' ? "एकूण सदस्य" : "Total Members"}
                </p>
                <span className="font-black text-xl text-[#1B2B6B] dark:text-white">
                  {activeMemberCount} <span className="text-sm font-semibold text-gray-400 dark:text-gray-500">/ {maxLimitStr}</span>
                </span>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 font-medium">
                {lang === 'mr' ? "सक्रिय / कमाल मर्यादा" : "Active / Max limit"}
              </p>
            </div>

            {/* 3. Next payment / Expires */}
            <div className="bg-gray-50 dark:bg-gray-950/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800/50 flex flex-col justify-between">
              <div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-1">
                  {lang === 'mr' ? "पुढील देय तारीख" : "Next Payment Due"}
                </p>
                <span className="font-black text-xl text-[#1B2B6B] dark:text-white">
                  {organization.subscription_expires_at 
                    ? new Date(organization.subscription_expires_at).toLocaleDateString('en-IN') 
                    : 'N/A'}
                </span>
              </div>
              <p className={`text-[11px] font-bold mt-2 ${organization.subscription_expires_at ? "text-orange-500 dark:text-orange-400" : "text-gray-400 dark:text-gray-500"}`}>
                {getDaysRemainingText(organization.subscription_expires_at)}
              </p>
            </div>
          </div>
          
          <div className="bg-[#E85D26]/5 dark:bg-[#E85D26]/5 border border-[#E85D26]/10 dark:border-orange-950/20 rounded-lg p-4 flex justify-between items-center">
            <div>
              <p className="font-bold text-[#1B2B6B] dark:text-white">{t.upgradeTitle}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.upgradeSub}</p>
            </div>
            <button 
              onClick={handleUpgrade}
              disabled={submittingSub}
              className="bg-[#E85D26] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#D04E1A] transition active:scale-95 disabled:opacity-50 shadow-sm"
            >
              {submittingSub ? (lang === 'mr' ? "लोड होत आहे..." : "Loading...") : t.upgradeBtn}
            </button>
          </div>
        </div>
      </div>

      {/* CARD 4: Admin Management */}
      <div className="bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
          <h2 className="font-semibold text-[#1B2B6B] dark:text-white">{t.adminHeader}</h2>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t.currentAdmins}</h3>
            {admins.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-950 p-3 rounded">{t.noAdmins}</p>
            ) : (
              <ul className="border border-gray-100 dark:border-gray-800 rounded-lg divide-y divide-gray-50 dark:divide-gray-800">
                {admins.map(a => (
                  <li key={a.id} className="flex justify-between items-center p-3 hover:bg-[#2E4099]/5 dark:hover:bg-blue-950/10 transition">
                    <div>
                      <p className="font-bold text-gray-800 dark:text-white">{a.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{a.phone}</p>
                    </div>
                    <button 
                      onClick={() => handleRemoveAdmin(a.id)}
                      className="text-xs border border-red-500 text-red-500 dark:border-red-900/50 dark:text-red-400 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded transition font-semibold"
                    >
                      {t.removeAdmin}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-[#1B2B6B] dark:text-white mb-1">{t.transferSuperadmin}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t.transferSub}</p>
            <div className="flex">
              <input type="text" disabled placeholder={t.selectMember} className="border border-gray-200 dark:border-gray-800 rounded-l-lg p-2 flex-1 bg-gray-50 dark:bg-gray-950 text-gray-400 dark:text-gray-600 cursor-not-allowed text-sm" />
              <button disabled className="bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 px-4 py-2 rounded-r-lg font-semibold cursor-not-allowed text-sm">
                {t.transfer}
              </button>
            </div>
            <p className="text-xs text-[#E85D26] dark:text-orange-400 mt-2 font-medium">
              {t.transferWarning}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
