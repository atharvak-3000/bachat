"use client"

import { useState, useEffect } from "react"
import { getTranslation } from "@/lib/translations"

export default function MemberKycPage() {
  const [member, setMember] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<"en" | "mr">("en")

  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(";").shift() as "en" | "mr"
      return "en"
    }
    setLang(getCookie("language") || "en")
    fetchMember()
  }, [])

  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key)

  const fetchMember = async () => {
    try {
      const res = await fetch("/api/members/self")
      if (res.ok) {
        const data = await res.json()
        setMember(data.member)
      }
    } catch (err) {
      console.error("Error fetching member profile:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-gray-100 dark:bg-gray-850 rounded-xl animate-pulse" />
        <div className="h-48 w-full bg-gray-100 dark:bg-gray-850 rounded-3xl animate-pulse" />
      </div>
    )
  }

  if (!member) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center text-gray-500 dark:text-gray-400">
        Error loading profile. Please sign out and sign in again.
      </div>
    )
  }

  // Determine which documents are verified based on kyc_notes or verified status
  // In a manual offline setup, if the status is VERIFIED, we can assume all core documents are checked.
  const isVerified = member.kyc_status === 'VERIFIED'
  const isRejected = member.kyc_status === 'REJECTED'

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-850">
        <div>
          <h1 className="text-[#1B2B6B] dark:text-white font-bold text-2xl">
            {t("kycStatusTitle")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            We follow a strictly manual offline KYC verification process to ensure absolute security and compliance.
          </p>
        </div>

        <div>
          {isVerified ? (
            <span className="bg-green-100 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/30 font-semibold text-sm px-4 py-1.5 rounded-full shadow-sm">
              ✓ {t("verified")}
            </span>
          ) : isRejected ? (
            <span className="bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 font-semibold text-sm px-4 py-1.5 rounded-full shadow-sm">
              ✗ {t("rejected")}
            </span>
          ) : (
            <span className="bg-yellow-100 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/30 font-semibold text-sm px-4 py-1.5 rounded-full shadow-sm animate-pulse">
              {t("pending")}
            </span>
          )}
        </div>
      </div>

      {/* Main Status Panel */}
      {isVerified ? (
        <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 flex items-center justify-center text-2xl flex-shrink-0">
              🎉
            </div>
            <div className="space-y-1">
              <h3 className="text-[#1B2B6B] dark:text-white font-bold text-lg flex items-center gap-2">Your KYC is fully verified!</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                Your physical documents have been audited and approved by the group Admin. All features in your portal are active.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-xl p-5 text-xs text-gray-600 dark:text-gray-300 space-y-3 font-medium">
            {member.kyc_verified_at && (
              <p>
                Verification Timestamp:{" "}
                <strong className="text-[#1B2B6B] dark:text-white font-bold">
                  {new Date(member.kyc_verified_at).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </strong>
              </p>
            )}
            {member.kyc_notes && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                <span className="text-gray-400 dark:text-gray-500 block mb-1">Verifier Audit Notes:</span>
                <code className="block bg-white dark:bg-gray-950 rounded-xl p-3 border border-gray-150 dark:border-gray-800 text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed font-mono">
                  {member.kyc_notes}
                </code>
              </div>
            )}
          </div>
        </div>
      ) : isRejected ? (
        <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 flex items-center justify-center text-2xl flex-shrink-0">
              ⚠️
            </div>
            <div className="space-y-1">
              <h3 className="text-[#1B2B6B] dark:text-white font-bold text-lg flex items-center gap-2">{t("kycNotApproved")}</h3>
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                Your KYC could not be approved due to discrepancies in physical document verification.
              </p>
            </div>
          </div>

          {member.kyc_notes && (
            <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl p-5 text-xs text-gray-600 dark:text-gray-400 space-y-2 font-medium">
              <span className="text-red-500 dark:text-red-400 font-bold block">Reason / Details from Admin:</span>
              <p className="bg-white dark:bg-gray-950 rounded-xl p-3 border border-red-150/50 dark:border-red-900/30 text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-medium">
                {member.kyc_notes}
              </p>
            </div>
          )}

          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 p-5 rounded-xl">
            <p className="font-extrabold text-gray-800 dark:text-white mb-1">{t("whatNext")}</p>
            <p>1. Contact your Bachat Gat Admin or SuperAdmin directly.</p>
            <p>2. Bring correct, matching physical original copies of your Aadhaar Card and PAN Card.</p>
            <p>3. Request a manual re-verification in the next meeting.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-[#E85D26] dark:text-orange-400 flex items-center justify-center text-2xl flex-shrink-0">
              📋
            </div>
            <div className="space-y-1">
              <h3 className="text-[#1B2B6B] dark:text-white font-bold text-lg flex items-center gap-2">
                Manual Verification Required
              </h3>
              <p className="text-[#E85D26] dark:text-orange-400 text-sm font-medium">
                Your manual KYC verification is currently pending. Please complete this offline with your group Admin.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 pb-2 mb-4">{t("howToVerify")}</h4>
            
            <div className="space-y-4">
              <div className="flex items-start gap-1">
                <span className="inline-flex w-6 h-6 bg-[#1B2B6B] dark:bg-blue-600 text-white rounded-full text-xs font-bold items-center justify-center mr-2 shrink-0">1</span>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  <span className="text-[#1B2B6B] dark:text-white font-semibold">Bring physical original documents:</span>{" "}
                  Carry your physical original Aadhaar Card, PAN Card, and one passport-size photograph to the next meeting.
                </p>
              </div>
              <div className="flex items-start gap-1">
                <span className="inline-flex w-6 h-6 bg-[#1B2B6B] dark:bg-blue-600 text-white rounded-full text-xs font-bold items-center justify-center mr-2 shrink-0">2</span>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  <span className="text-[#1B2B6B] dark:text-white font-semibold">Physical verification:</span>{" "}
                  Your bachat gat Admin will inspect your documents and verify that they match your registered details.
                </p>
              </div>
              <div className="flex items-start gap-1">
                <span className="inline-flex w-6 h-6 bg-[#1B2B6B] dark:bg-blue-600 text-white rounded-full text-xs font-bold items-center justify-center mr-2 shrink-0">3</span>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  <span className="text-[#1B2B6B] dark:text-white font-semibold">Admin status update:</span>{" "}
                  The admin will log in to their panel, check off the verified documents, add audit notes, and mark your KYC status as <span className="text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-950/40 px-1 rounded">VERIFIED</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checklist section */}
      <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6 space-y-6">
        <div>
          <h3 className="text-[#1B2B6B] dark:text-white font-bold text-lg mb-1">{t("kyc")} Checklist</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Read-only checklist of your group's mandatory verification documents.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: "aadhaar", label: lang === 'en' ? "Aadhaar Card" : "आधार कार्ड", desc: "For address & identity proof" },
            { id: "pan", label: lang === 'en' ? "PAN Card" : "पैन कार्ड", desc: "For tax & financial auditing compliance" },
            { id: "photo", label: lang === 'en' ? "Passport Photograph" : "पासपोर्ट फोटो", desc: "Recent physical color photo" },
            { id: "signature", label: lang === 'en' ? "Signature" : "हस्ताक्षर", desc: "To match against physical cash register slips" }
          ].map(item => (
            <div 
              key={item.id} 
              className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 rounded-xl p-4 flex items-center gap-3"
            >
              <div className="shrink-0">
                {isVerified ? (
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-700 text-gray-300 dark:text-gray-600 flex items-center justify-center text-[10px] font-bold">
                    ○
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-gray-700 dark:text-gray-300 text-sm font-medium block truncate">{item.label}</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold block mt-0.5">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
