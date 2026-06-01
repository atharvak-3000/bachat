"use client"

import { useState, useEffect } from "react"
import { formatRupees } from "@/lib/calculations"
import type { Member } from "@/types"

interface MemberDetailClientProps {
  member: Member
  stats: {
    total_savings: number
    outstanding_loan: number
    total_interest_paid: number
    attendance_percent: number
    net_position: number
  }
}

export default function MemberDetailClient({ member, stats }: MemberDetailClientProps) {
  const [lang, setLang] = useState<'mr'|'en'>('mr')
  const [currentUserRole, setCurrentUserRole] = useState('')

  // Password reset state hooks
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [modalSuccess, setModalSuccess] = useState(false)

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

  useEffect(() => {
    fetch('/api/members/me')
      .then(r => r.json())
      .then(d => setCurrentUserRole(d.role || ''))
  }, [])

  const T = {
    mr: {
      profileLabel: "सदस्य प्रोफाइल",
      memberNum: "सदस्य क्रमांक",
      phone: "फोन",
      joined: "रुजू तारीख",
      totalSavings: "एकूण बचत",
      outstandingLoan: "कर्ज बाकी",
      interestPaid: "एकूण व्याज",
      attendance: "उपस्थिती",
      netPosition: "निव्वळ स्थिती",
      kycLabel: "केवायसी स्थिती",
      kycVerified: "✓ केवायसी पूर्ण",
      kycRejected: "✗ केवायसी नाकारले",
      kycPending: "⏳ केवायसी प्रलंबित",
      verifyKycBtn: "पडताळणी करा",
      
      // Reset password keys
      resetPwdBtn: "पासवर्ड रिसेट करा",
      resetPwdTitle: "पासवर्ड रिसेट करा",
      resetPwdSub: "चा नवीन पासवर्ड सेट करा",
      newPasswordLabel: "नवीन पासवर्ड",
      confirmPasswordLabel: "पासवर्डची खात्री करा",
      saveBtn: "पासवर्ड जतन करा",
      savingBtn: "जतन करत आहे...",
      mismatchError: "पासवर्ड जुळत नाहीत!",
      lengthError: "पासवर्ड किमान ८ अक्षरांचा असावा!",
      requiredError: "सर्व फील्ड भरणे आवश्यक आहे!",
      successResetMsg: "🎉 पासवर्ड यशस्वीरित्या बदलला आहे!",
      cancel: "रद्द करा",
    },
    en: {
      profileLabel: "Member Profile",
      memberNum: "Member #",
      phone: "Phone",
      joined: "Joined",
      totalSavings: "Total Savings",
      outstandingLoan: "Outstanding Loan",
      interestPaid: "Interest Paid",
      attendance: "Attendance",
      netPosition: "Net Position",
      kycLabel: "KYC Status",
      kycVerified: "✓ KYC Verified",
      kycRejected: "✗ KYC Rejected",
      kycPending: "⏳ KYC Pending",
      verifyKycBtn: "Verify KYC",

      // Reset password keys
      resetPwdBtn: "Reset Password",
      resetPwdTitle: "Reset Password",
      resetPwdSub: "Set a new password for",
      newPasswordLabel: "New Password",
      confirmPasswordLabel: "Confirm Password",
      saveBtn: "Save Password",
      savingBtn: "Saving password...",
      mismatchError: "Passwords do not match!",
      lengthError: "Password must be at least 8 characters long!",
      requiredError: "All fields are required!",
      successResetMsg: "🎉 Password successfully updated!",
      cancel: "Cancel",
    }
  }
  const t = T[lang]

  // Enforce access control in UI:
  // SUPERADMIN can reset any password. ADMIN can only reset standard MEMBERs.
  const canResetPassword = 
    currentUserRole === 'SUPERADMIN' || 
    (currentUserRole === 'ADMIN' && member.role === 'MEMBER');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError(null)
    setModalSuccess(false)

    if (!newPassword || !confirmPassword) {
      setModalError(t.requiredError)
      return
    }

    if (newPassword.length < 8) {
      setModalError(t.lengthError)
      return
    }

    if (newPassword !== confirmPassword) {
      setModalError(t.mismatchError)
      return
    }

    setModalLoading(true)

    try {
      const res = await fetch("/api/admin/reset-member-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: member.id,
          newPassword
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password")
      }

      setModalSuccess(true)
      setNewPassword("")
      setConfirmPassword("")
      
      setTimeout(() => {
        setIsModalOpen(false)
        setModalSuccess(false)
      }, 2000)

    } catch (err: any) {
      console.error("[Reset Password Modal Error]:", err)
      setModalError(err.message || "An unexpected error occurred.")
    } finally {
      setModalLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header / Profile Card */}
      <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] md:text-xs font-bold text-orange-600 uppercase tracking-wider block mb-1">
            {t.profileLabel}
          </span>
          <h1 className="text-3xl font-black text-gray-900">{member.name}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {t.memberNum} {member.member_number} • {t.phone}: {member.phone}
          </p>

          {/* KYC Status Block */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {t.kycLabel}:
            </span>
            {member.kyc_status === 'VERIFIED' ? (
              <span className="px-2.5 py-1 rounded-xl bg-green-50 text-green-700 text-xs font-bold border border-green-150">
                {t.kycVerified}
              </span>
            ) : member.kyc_status === 'REJECTED' ? (
              <span className="px-2.5 py-1 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-150">
                {t.kycRejected}
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold border border-amber-150">
                {t.kycPending}
              </span>
            )}

            {/* Verify button for Admin/SuperAdmin */}
            {['SUPERADMIN', 'ADMIN'].includes(currentUserRole) && (
              <a
                href={`/members/${member.id}/kyc`}
                className="px-2.5 py-1 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold shadow-sm active:scale-95 transition"
              >
                {t.verifyKycBtn}
              </a>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-3 text-xs font-semibold">
          <div className="flex flex-wrap gap-2 justify-end">
            {canResetPassword && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <span>{t.resetPwdBtn}</span>
              </button>
            )}
            <span className="px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 border border-orange-100">{member.role}</span>
            <span className={`px-3 py-1.5 rounded-full border ${member.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{member.status}</span>
          </div>
          <span className="px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 border border-gray-100">
            {t.joined}: {new Date(member.joining_date).toLocaleDateString('en-IN')}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1 — Total Savings */}
        <div className="bg-white border border-gray-100 p-4 md:p-6 rounded-3xl shadow-sm">
          <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider leading-tight block">
            {t.totalSavings}
          </span>
          <h4 className="text-lg md:text-2xl font-black text-green-600 mt-1.5 md:mt-2 break-all">
            {formatRupees(stats.total_savings)}
          </h4>
        </div>

        {/* Card 2 — Outstanding Loan */}
        <div className="bg-white border border-gray-100 p-4 md:p-6 rounded-3xl shadow-sm">
          <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider leading-tight block">
            {t.outstandingLoan}
          </span>
          <h4 className="text-lg md:text-2xl font-black text-gray-900 mt-1.5 md:mt-2 break-all">
            {formatRupees(stats.outstanding_loan)}
          </h4>
        </div>

        {/* Card 3 — Interest Paid */}
        <div className="bg-white border border-gray-100 p-4 md:p-6 rounded-3xl shadow-sm">
          <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider leading-tight block">
            {t.interestPaid}
          </span>
          <h4 className="text-lg md:text-2xl font-black text-orange-600 mt-1.5 md:mt-2 break-all">
            {formatRupees(stats.total_interest_paid)}
          </h4>
        </div>

        {/* Card 4 — Attendance */}
        <div className="bg-white border border-gray-100 p-4 md:p-6 rounded-3xl shadow-sm">
          <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider leading-tight block">
            {t.attendance}
          </span>
          <h4 className="text-lg md:text-2xl font-black text-blue-600 mt-1.5 md:mt-2">
            {stats.attendance_percent}%
          </h4>
        </div>

        {/* Card 5 — Net Position */}
        <div className="bg-white border-2 border-orange-50 p-4 md:p-6 rounded-3xl shadow-md col-span-2 lg:col-span-1">
          <span className="text-[10px] md:text-xs font-bold text-orange-600 uppercase tracking-wider leading-tight block">
            {t.netPosition}
          </span>
          <h4 className={`text-lg md:text-2xl font-black mt-1.5 md:mt-2 break-all ${stats.net_position >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatRupees(stats.net_position)}
          </h4>
        </div>
      </div>

      {/* Reset Password Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-150 p-6 md:p-8 max-w-md w-full space-y-6 shadow-2xl animate-scaleIn select-none">
            
            <div className="space-y-1">
              <h3 className="text-xl font-black text-gray-900 leading-tight">
                🔑 {t.resetPwdTitle}
              </h3>
              <p className="text-gray-500 text-xs font-semibold">
                {t.resetPwdSub} <strong className="text-orange-600 font-extrabold">{member.name}</strong>
              </p>
            </div>

            {modalSuccess ? (
              <div className="bg-green-50 border border-green-200 text-green-800 p-5 rounded-2xl text-sm font-bold leading-relaxed animate-fadeIn">
                {t.successResetMsg}
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* Field 1: New Password */}
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">
                    {t.newPasswordLabel}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full border border-gray-200 rounded-xl pl-4 pr-10 py-3 text-xs outline-none focus:border-orange-500 transition font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    >
                      {showNewPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                {/* Field 2: Confirm Password */}
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">
                    {t.confirmPasswordLabel}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full border border-gray-200 rounded-xl pl-4 pr-10 py-3 text-xs outline-none focus:border-orange-500 transition font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    >
                      {showConfirmPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {modalError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-[11px] font-semibold animate-pulse">
                    ⚠️ {modalError}
                  </div>
                )}

                {/* Form Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold p-3 rounded-xl text-center text-xs shadow-md transition active:scale-95 disabled:opacity-50"
                  >
                    {modalLoading ? t.savingBtn : t.saveBtn}
                  </button>
                  <button
                    type="button"
                    disabled={modalLoading}
                    onClick={() => {
                      setIsModalOpen(false)
                      setNewPassword("")
                      setConfirmPassword("")
                      setModalError(null)
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold p-3 rounded-xl text-center text-xs transition"
                  >
                    {t.cancel}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  )
}

