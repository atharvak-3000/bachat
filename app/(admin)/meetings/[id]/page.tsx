"use client"

import { useEffect, useState, useRef, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  formatRupees,
  formatMonthYear,
  toP,
  toR
} from "@/lib/calculations"
import type {
  Meeting,
  MeetingContribution,
  MeetingExpense,
  MeetingIncome,
  Loan,
  LoanWithMember,
  Organization,
  Member
} from "@/types"

export default function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)

  // Data states
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [contribs, setContribs] = useState<Record<string, MeetingContribution & { member: Member }>>({})
  const [expenses, setExpenses] = useState<MeetingExpense[]>([])
  const [incomes, setIncomes] = useState<MeetingIncome[]>([])
  const [issuedLoans, setIssuedLoans] = useState<LoanWithMember[]>([])
  const [activeLoans, setActiveLoans] = useState<Loan[]>([])
  const [orgSettings, setOrgSettings] = useState<Organization | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [meetingNotes, setMeetingNotes] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)
  const [orgMembers, setOrgMembers] = useState<Member[]>([])
  const [currentMemberRole, setCurrentMemberRole] = useState('')
  
  // UI states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [finalizeLoading, setFinalizeLoading] = useState(false)
  const [closingDate, setClosingDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  // Cell-level saving indicators: Record<`${memberId}-${field}`, 'saving' | 'saved' | 'idle'>
  const [cellStatus, setCellStatus] = useState<Record<string, 'saving' | 'saved' | 'idle'>>({})
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({})

  // Form states for adding expenses/income/loans
  const [expenseForm, setExpenseForm] = useState({ category: "MISCELLANEOUS", amount: "", description: "" })
  const [incomeForm, setIncomeForm] = useState({ category: "OTHER", amount: "", description: "" })
  const [loanForm, setLoanForm] = useState({ member_id: "", amount: "", interest_rate: "2.0", term_months: "12", purpose: "" })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [lang, setLang] = useState<'mr'|'en'>('mr')

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
      backToList: "← सभेच्या सूचीवर परत जा",
      meetingTitle: "सभा",
      dateLabel: "तारीख:",
      openingBalLabel: "मागील शिल्लक:",
      closedLabel: "बंद झाली:",
      finalizedBadge: "✓ सभा अंतिम झाली",
      draftBadge: "नोंदणी सुरू",
      contributionsHeader: "मासिक वर्गणी व हप्ते",
      contributionsSub: "प्रत्येक सदस्यासाठी मासिक बचत, दंड आणि कर्ज फेडीची नोंद करा.",
      presentLabel: "उपस्थित",
      savingsLabel: "बचत ₹",
      penaltyLabel: "दंड ₹",
      loanRepaidLabel: "कर्ज वसुली ₹",
      interestLabel: "व्याज ₹",
      outstandingLabel: "थकीत रक्कम:",
      loansHeader: "दिलेले कर्ज",
      loansSub: "या सभेदरम्यान सदस्यांना नवीन कर्ज मंजूर करा.",
      selectMemberLabel: "सदस्य निवडा",
      selectMemberOption: "-- सदस्य निवडा --",
      amountLabel: "रक्कम (₹)",
      amountPlaceholder: "रुपये",
      rateLabel: "व्याज दर (% वार्षिक)",
      termLabel: "मुदत (महिने)",
      purposeLabel: "हेतू",
      purposePlaceholder: "उदा. वैद्यकीय",
      adminHint: "* अॅडमिनने मंजूर केलेले &rarr; सुपरअॅडमिन मंजुरीची प्रतीक्षा | सुपरअॅडमिनने मंजूर केलेले &rarr; स्वयंचलित मंजूर",
      issueLoanBtn: "कर्ज मंजूर करा",
      loansListHeader: "सदस्य",
      loansListAmount: "रक्कम",
      loansListInterest: "व्याज",
      loansListTerm: "मुदत",
      loansListStatus: "स्थिती",
      awaitingApproval: "मंजुरीची प्रतीक्षा",
      activeApproved: "सक्रिय",
      noLoans: "अद्याप या सभेमध्ये कर्ज मंजूर केलेले नाही.",
      otherExpensesHeader: "इतर खर्च",
      otherExpensesSub: "स्टेशनरी, चहा/नाश्ता, छपाई इत्यादींची नोंद करा.",
      descriptionPlaceholder: "तपशील",
      amountExpensesPlaceholder: "₹ रक्कम",
      addExpenseBtn: "खर्च जोडा",
      noExpenses: "इतर कोणताही खर्च नोंदवलेला नाही.",
      otherIncomeHeader: "इतर जमा",
      otherIncomeSub: "देणगी, बँक कर्ज किंवा व्याज इत्यादींची नोंद करा.",
      addIncomeBtn: "जमा जोडा",
      noIncome: "इतर कोणतीही जमा नोंदवलेली नाही.",
      summaryHeader: "सभा गोषवारा",
      summarySub: "या सभेतील सर्व व्यवहारांची थेट गणना.",
      summaryOpening: "मागील शिल्लक",
      summarySavings: "एकूण बचत",
      summaryPenalties: "दंड",
      summaryLoanRepaid: "कर्ज वसुली",
      summaryInterest: "व्याज",
      summaryOtherIncome: "इतर जमा",
      summaryTotalReceipts: "एकूण जमा",
      summaryLoansGiven: "दिलेले कर्ज",
      summaryOtherExpenses: "इतर खर्च",
      summaryTotalExpenses: "एकूण खर्च",
      summaryClosingBalance: "आजची शिल्लक",
      attendanceLabel: "उपस्थिती",
      attendanceSub: "सदस्य",
      negativeBalanceWarning: "⚠️ ऋण शिल्लक — सभा अंतिम केली जाऊ शकत नाही. कृपया दिलेले कर्ज किंवा खर्च कमी करा.",
      closingDateLabel: "बंद तारीख *",
      closingDateSub: "सभेची तारीख अधिकृतपणे बंद झाली",
      finalizeBtn: "सभा अंतिम करा",
      finalizingText: "अंतिम करत आहे...",
      onlySuperadminNotice: "⏳ केवळ SuperAdmin बैठक अंतिम करू शकतो.",
      savingIndicator: "जतन करत आहे...",
      errorText: "त्रुटी",
      meetingNotFound: "सभा आढळली नाही",
      backBtn: "सभा सूचीवर परत जा",
      deleteConfirmExpense: "आपण हा खर्च हटवू इच्छिता?",
      deleteConfirmIncome: "आपण ही जमा हटवू इच्छिता?",
      finalizeConfirm: "आपण नक्की या सभेला अंतिम करू इच्छिता? यामुळे सर्व नोंदी कायमच्या लॉक होतील आणि सक्रिय सदस्यांच्या कर्जाची माहिती अपडेट होईल.",
      notesCardTitle: "सभेतील महत्त्वाचे मुद्दे (टिपण)",
      notesPlaceholder: "सभेत झालेल्या चर्चेचे मुख्य मुद्दे येथे लिहा...",
      saveNotesBtn: "टिपण जतन करा",
      savingNotesText: "जतन करत आहे...",
      noNotesText: "या सभेसाठी कोणतेही टिपण नोंदवलेले नाही.",
    },
    en: {
      backToList: "← Back to Meetings List",
      meetingTitle: "Meeting",
      dateLabel: "Date:",
      openingBalLabel: "Opening Balance:",
      closedLabel: "Closed:",
      finalizedBadge: "✓ Meeting Finalized",
      draftBadge: "Draft / Entry In Progress",
      contributionsHeader: "Member Contributions",
      contributionsSub: "Record monthly savings, penalties, and loan repayments per member.",
      presentLabel: "Present",
      savingsLabel: "Savings ₹",
      penaltyLabel: "Penalty ₹",
      loanRepaidLabel: "Loan Repaid ₹",
      interestLabel: "Interest ₹",
      outstandingLabel: "Outstanding:",
      loansHeader: "Loans Issued in Meeting",
      loansSub: "Issue new loans to members during this meeting.",
      selectMemberLabel: "Select Member",
      selectMemberOption: "-- Select Member --",
      amountLabel: "Amount (₹)",
      amountPlaceholder: "Rupees",
      rateLabel: "Rate (% p.a.)",
      termLabel: "Term (Months)",
      purposeLabel: "Purpose",
      purposePlaceholder: "e.g. Medical",
      adminHint: "* Admin issued &rarr; Awaiting SuperAdmin approval | SuperAdmin issued &rarr; Auto-approved",
      issueLoanBtn: "Issue Loan",
      loansListHeader: "Member",
      loansListAmount: "Amount",
      loansListInterest: "Interest",
      loansListTerm: "Term",
      loansListStatus: "Status",
      awaitingApproval: "Awaiting Approval",
      activeApproved: "Active",
      noLoans: "No loans issued in this meeting yet.",
      otherExpensesHeader: "Other Expenses",
      otherExpensesSub: "Record stationery, snacks, printing, etc.",
      descriptionPlaceholder: "Description",
      amountExpensesPlaceholder: "₹ Amount",
      addExpenseBtn: "Add Expense",
      noExpenses: "No other expenses recorded.",
      otherIncomeHeader: "Other Income",
      otherIncomeSub: "Record donations, bank loan receipt, bank interest, etc.",
      addIncomeBtn: "Add Income",
      noIncome: "No other income recorded.",
      summaryHeader: "Meeting Summary",
      summarySub: "Live calculation of all transactions in this meeting.",
      summaryOpening: "Opening Balance",
      summarySavings: "Savings",
      summaryPenalties: "Penalties",
      summaryLoanRepaid: "Loan Repaid",
      summaryInterest: "Interest",
      summaryOtherIncome: "Other Income",
      summaryTotalReceipts: "Total Receipts",
      summaryLoansGiven: "Loans Given",
      summaryOtherExpenses: "Other Expenses",
      summaryTotalExpenses: "Total Expenses",
      summaryClosingBalance: "Closing Balance",
      attendanceLabel: "Attendance",
      attendanceSub: "Members",
      negativeBalanceWarning: "Negative balance — cannot finalize meeting. Please adjust loans issued or expenses.",
      closingDateLabel: "Closing Date *",
      closingDateSub: "Date meeting was officially closed",
      finalizeBtn: "Finalize Meeting",
      finalizingText: "Finalizing...",
      onlySuperadminNotice: "⏳ Only SuperAdmin can finalize this meeting.",
      savingIndicator: "Saving...",
      errorText: "Error",
      meetingNotFound: "Meeting not found",
      backBtn: "Back to Meetings List",
      deleteConfirmExpense: "Are you sure you want to delete this expense?",
      deleteConfirmIncome: "Are you sure you want to delete this income?",
      finalizeConfirm: "Are you absolutely sure you want to finalize this meeting? This locks all entries permanently and updates active member loans.",
      notesCardTitle: "Meeting Notes",
      notesPlaceholder: "Write down the key points discussed in the meeting...",
      saveNotesBtn: "Save Notes",
      savingNotesText: "Saving...",
      noNotesText: "No notes recorded for this meeting.",
    }
  }
  const t = T[lang]

  // Fetch all meeting details
  const fetchDetails = async () => {
    try {
      const res = await fetch(`/api/meetings/${id}`)
      if (!res.ok) throw new Error("Failed to fetch meeting details")
      const data = await res.json()
      
      setMeeting(data.meeting)
      setMeetingNotes(data.meeting.notes || "")
      setExpenses(data.expenses)
      setIncomes(data.income)
      setIssuedLoans(data.loans_issued)
      setActiveLoans(data.active_loans)
      setOrgSettings(data.org_settings)

      // Map contributions to Record<member_id, contribution>
      const contribMap: Record<string, MeetingContribution & { member: Member }> = {}
      const memberList: Member[] = []
      
      data.contributions.forEach((c: MeetingContribution & { member: Member }) => {
        contribMap[c.member_id] = c
        if (c.member) memberList.push(c.member)
      })
      
      setContribs(contribMap)
      setMembers(memberList)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetails()
  }, [id])

  useEffect(() => {
    fetch('/api/members')
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : data.members || []
        const active = list
          .filter((m: any) => m.status === 'ACTIVE' || !m.status)
          .filter((m: any) => m.is_active !== false)
        setOrgMembers(active)
      })
  }, [])

  useEffect(() => {
    fetch('/api/members/me')
      .then(r => r.json())
      .then(d => setCurrentMemberRole(d.role || ''))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">{lang === 'mr' ? 'सभेचा तपशील लोड होत आहे...' : 'Loading meeting details...'}</p>
        </div>
      </div>
    )
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="bg-white border border-gray-100 rounded-3xl p-8 max-w-md text-center shadow-lg">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900">{t.errorText}</h3>
          <p className="text-gray-500 mt-2 text-sm">{error || t.meetingNotFound}</p>
          <Link href="/meetings" className="mt-6 inline-flex bg-orange-500 text-white font-semibold px-4 py-2 rounded-xl text-sm">
            {t.backBtn}
          </Link>
        </div>
      </div>
    )
  }

  const isFinalized = meeting.status === 'FINALIZED'

  // Computed values
  const contributionsList = Object.values(contribs)
  const sumSavings = contributionsList.reduce((sum, c) => sum + (c.savings_amount || 0), 0)
  const sumPenalties = contributionsList.reduce((sum, c) => sum + (c.penalty_paid || 0), 0)
  const sumRepayments = contributionsList.reduce((sum, c) => sum + (c.loan_repayment || 0), 0)
  const sumInterest = contributionsList.reduce((sum, c) => sum + (c.interest_paid || 0), 0)
  const sumOtherContributions = contributionsList.reduce((sum, c) => sum + (c.other_amount || 0), 0)

  const sumExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const sumIncomes = incomes.reduce((sum, i) => sum + i.amount, 0)

  // Active issued loans sum (deducts cash)
  const activeIssuedLoans = issuedLoans.filter(l => l.status === 'ACTIVE')
  const sumLoansIssued = activeIssuedLoans.reduce((sum, l) => sum + l.loan_amount, 0)

  const totalReceipts = sumSavings + sumPenalties + sumRepayments + sumInterest + sumOtherContributions + sumIncomes
  const totalExpenses = sumLoansIssued + sumExpenses
  const closingBalance = meeting.opening_balance + totalReceipts - totalExpenses

  const totalMembers = contributionsList.length
  const presentMembers = contributionsList.filter(c => c.is_present).length

  // Helper to trigger saving API call
  const triggerSaveContribution = (memberId: string, updatedFields: Partial<MeetingContribution>) => {
    const key = `${memberId}-${Object.keys(updatedFields)[0]}`
    
    // Clear existing timer for this key
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key])
    }

    setCellStatus(prev => ({ ...prev, [key]: 'saving' }))

    debounceTimers.current[key] = setTimeout(async () => {
      try {
        const res = await fetch(`/api/meetings/${id}/contributions/${memberId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedFields)
        })

        if (!res.ok) throw new Error("Failed to save")

        setCellStatus(prev => ({ ...prev, [key]: 'saved' }))
        setTimeout(() => {
          setCellStatus(prev => ({ ...prev, [key]: 'idle' }))
        }, 2000)
      } catch (err) {
        console.error(err)
        setCellStatus(prev => ({ ...prev, [key]: 'idle' }))
      }
    }, 400) // 400ms debounce
  }

  // Handle cell value change
  const handleCellChange = (memberId: string, field: keyof MeetingContribution, paiseValue: number) => {
    if (isFinalized) return

    setContribs(prev => {
      const target = prev[memberId]
      if (!target) return prev
      return {
        ...prev,
        [memberId]: {
          ...target,
          [field]: paiseValue
        }
      }
    })

    triggerSaveContribution(memberId, { [field]: paiseValue })
  }

  // Handle presence checkbox toggle
  const handlePresenceToggle = (memberId: string, isPresent: boolean) => {
    if (isFinalized) return

    const updates: Partial<MeetingContribution> = { is_present: isPresent }
    
    if (!isPresent) {
      // Auto penalty & clear other fields
      const penalty = orgSettings?.default_penalty_amount || 0
      updates.penalty_paid = penalty
      updates.savings_amount = 0
      updates.loan_repayment = 0
      updates.interest_paid = 0
      updates.other_amount = 0
    } else {
      // Re-enable and reset penalty
      updates.penalty_paid = 0
      updates.savings_amount = orgSettings?.monthly_saving_amount || 0
    }

    setContribs(prev => {
      const target = prev[memberId]
      if (!target) return prev
      return {
        ...prev,
        [memberId]: {
          ...target,
          ...updates
        }
      }
    })

    // Debounce save for all updated fields
    Object.entries(updates).forEach(([field, val]) => {
      triggerSaveContribution(memberId, { [field]: val })
    })
  }

  // Add Other Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expenseForm.amount) return

    const amtPaise = toP(expenseForm.amount)
    try {
      const res = await fetch(`/api/meetings/${id}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: expenseForm.category,
          amount: amtPaise,
          description: expenseForm.description
        })
      })

      if (!res.ok) throw new Error("Failed to add expense")
      const newExp = await res.json()
      setExpenses(prev => [...prev, newExp])
      setExpenseForm({ category: "MISCELLANEOUS", amount: "", description: "" })
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Delete Other Expense
  const handleDeleteExpense = async (expId: string) => {
    if (!confirm(t.deleteConfirmExpense)) return

    try {
      const res = await fetch(`/api/meetings/${id}/expenses/${expId}`, {
        method: "DELETE"
      })

      if (!res.ok) throw new Error("Failed to delete expense")
      setExpenses(prev => prev.filter(e => e.id !== expId))
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Add Other Income
  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!incomeForm.amount) return

    const amtPaise = toP(incomeForm.amount)
    try {
      const res = await fetch(`/api/meetings/${id}/income`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: incomeForm.category,
          amount: amtPaise,
          description: incomeForm.description
        })
      })

      if (!res.ok) throw new Error("Failed to add income")
      const newInc = await res.json()
      setIncomes(prev => [...prev, newInc])
      setIncomeForm({ category: "OTHER", amount: "", description: "" })
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Delete Other Income
  const handleDeleteIncome = async (incId: string) => {
    if (!confirm(t.deleteConfirmIncome)) return

    try {
      const res = await fetch(`/api/meetings/${id}/income/${incId}`, {
        method: "DELETE"
      })

      if (!res.ok) throw new Error("Failed to delete income")
      setIncomes(prev => prev.filter(i => i.id !== incId))
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Issue Loan
  const handleIssueLoan = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({})

    const { member_id, amount, interest_rate, term_months, purpose } = loanForm
    if (!member_id) {
      setFormErrors(prev => ({ ...prev, member_id: "Please select a member" }))
      return
    }
    if (!amount || parseFloat(amount) <= 0) {
      setFormErrors(prev => ({ ...prev, amount: "Please enter a valid amount" }))
      return
    }

    const amtPaise = toP(amount)
    const rateFloat = parseFloat(interest_rate) || 2.0
    const monthsInt = parseInt(term_months) || 12

    try {
      const res = await fetch(`/api/meetings/${id}/loans-issued`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id,
          amount: amtPaise,
          interest_rate: rateFloat,
          term_months: monthsInt,
          purpose
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to issue loan")
      }

      const newLoan = await res.json()
      setIssuedLoans(prev => [...prev, newLoan])
      setLoanForm({ member_id: "", amount: "", interest_rate: "2.0", term_months: "12", purpose: "" })
      
      // Refresh active loans to update outstanding hints
      fetchDetails()
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Finalize Meeting
  const handleFinalize = async () => {
    if (closingBalance < 0) return

    if (!confirm(t.finalizeConfirm)) {
      return
    }

    setFinalizeLoading(true)
    try {
      const res = await fetch(`/api/meetings/${id}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closing_date: closingDate })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to finalize meeting")
      }

      const finalized = await res.json()
      setMeeting(finalized)
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setFinalizeLoading(false)
    }
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      const res = await fetch(`/api/meetings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: meetingNotes })
      })
      if (!res.ok) {
        throw new Error("Failed to save meeting notes")
      }
      const updated = await res.json()
      setMeeting(updated)
      setMeetingNotes(updated.notes || "")
      alert(lang === 'mr' ? "सभेचे टिपण जतन केले!" : "Meeting notes saved!")
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSavingNotes(false)
    }
  }

  // Helpers for outstanding loans hint
  const getMemberOutstanding = (memberId: string) => {
    const active = activeLoans.find(l => l.member_id === memberId)
    return active ? active.outstanding_amount : 0
  }

  // Render cell save indicator
  const renderCellStatus = (memberId: string, field: string) => {
    const status = cellStatus[`${memberId}-${field}`]
    if (status === 'saving') {
      return <span className="absolute right-1 bottom-1 text-[10px] text-orange-500 animate-pulse">{t.savingIndicator}</span>
    }
    if (status === 'saved') {
      return <span className="absolute right-1 bottom-1 text-[10px] text-green-600 font-bold">✓</span>
    }
    return null
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Back button */}
      <Link href="/meetings" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 transition font-medium">
        {t.backToList}
      </Link>

      {/* Title block */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            {formatMonthYear(meeting.month_year)} {t.meetingTitle}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span>{t.dateLabel} <strong>{new Date(meeting.meeting_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></span>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            <span>{t.openingBalLabel} <strong className="text-gray-900">{formatRupees(meeting.opening_balance)}</strong></span>
            {meeting.closing_date && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                <span>
                  {t.closedLabel} <strong>
                    {new Date(meeting.closing_date)
                      .toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'long', year: 'numeric'
                      })}
                  </strong>
                </span>
              </>
            )}
          </div>
        </div>
        <div>
          {isFinalized ? (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-green-50 text-green-700 font-semibold text-sm border border-green-200">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {t.finalizedBadge}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-50 text-amber-700 font-semibold text-sm border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              {t.draftBadge}
            </span>
          )}
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Main forms and tables) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Contributions Section */}
          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">{t.contributionsHeader}</h2>
              <p className="text-gray-500 text-xs mt-1">{t.contributionsSub}</p>
            </div>
            
            {/* MOBILE CONTRIBUTION CARDS */}
            <div className="md:hidden divide-y divide-gray-100 bg-white">
              {contributionsList.map((c, i) => {
                const outstanding = getMemberOutstanding(c.member_id)
                const isAbsent = !c.is_present

                return (
                  <div key={c.id}
                       className={`p-4 ${isAbsent ? 'bg-gray-50 opacity-70' : ''}`}>
                    
                    {/* Member + Present toggle */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">
                          {c.member?.name}
                        </p>
                        {outstanding > 0 && (
                          <p className="text-xs text-orange-500 mt-0.5 font-medium">
                            {t.outstandingLabel} {formatRupees(outstanding)}
                          </p>
                        )}
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xs text-gray-500 font-semibold">{t.presentLabel}</span>
                        <input
                          type="checkbox"
                          checked={c.is_present}
                          disabled={isFinalized}
                          onChange={e => handlePresenceToggle(
                            c.member_id, e.target.checked
                          )}
                          className="w-5 h-5 accent-orange-500 rounded cursor-pointer disabled:cursor-not-allowed"
                        />
                      </label>
                    </div>

                    {/* 2x2 input grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: t.savingsLabel, field: 'savings_amount',
                          disabled: isAbsent },
                        { label: t.penaltyLabel, field: 'penalty_paid',
                          disabled: false },
                        { label: t.loanRepaidLabel, field: 'loan_repayment',
                          disabled: isAbsent },
                        { label: t.interestLabel, field: 'interest_paid',
                          disabled: isAbsent },
                      ].map(({ label, field, disabled }) => (
                        <div key={field}>
                          <label className="text-xs text-gray-500 mb-1 block font-medium">
                            {label}
                          </label>
                          <div className="relative">
                            <input
                              type="number" min="0"
                              value={toR((c as any)[field])}
                              disabled={isFinalized || disabled}
                              onChange={e => handleCellChange(
                                c.member_id,
                                field as keyof MeetingContribution,
                                toP(e.target.value)
                              )}
                              className="w-full border border-gray-200 rounded-lg 
                                         px-2.5 py-2 text-sm outline-none
                                         focus:border-orange-500 
                                         disabled:bg-gray-100 transition"
                            />
                            {renderCellStatus(c.member_id, field)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-semibold text-xs border-b border-gray-100">
                    <th className="px-4 py-3 text-center">#</th>
                    <th className="px-4 py-3">{t.loansListHeader}</th>
                    <th className="px-4 py-3 text-center">{t.presentLabel}</th>
                    <th className="px-4 py-3 w-28">{t.savingsLabel}</th>
                    <th className="px-4 py-3 w-28">{t.penaltyLabel}</th>
                    <th className="px-4 py-3 w-28">{t.loanRepaidLabel}</th>
                    <th className="px-4 py-3 w-28">{t.interestLabel}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {contributionsList.map((c, i) => {
                    const outstanding = getMemberOutstanding(c.member_id)
                    const rowOpacity = c.is_present ? "opacity-100" : "opacity-50 bg-gray-50/30"
                    
                    return (
                      <tr key={c.id} className={`${rowOpacity} hover:bg-orange-50/5 transition-colors duration-150`}>
                        <td className="px-4 py-4 text-center text-gray-400 font-medium">{i + 1}</td>
                        <td className="px-4 py-4">
                          <div className="font-bold text-gray-900">{c.member?.name}</div>
                          {outstanding > 0 && (
                            <div className="text-[11px] text-orange-600 font-medium mt-0.5">
                              {t.outstandingLabel} {formatRupees(outstanding)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            disabled={isFinalized}
                            checked={c.is_present}
                            onChange={(e) => handlePresenceToggle(c.member_id, e.target.checked)}
                            className="w-4.5 h-4.5 accent-orange-500 rounded-md outline-none cursor-pointer disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="px-4 py-4 relative">
                          <input
                            type="number"
                            min="0"
                            disabled={isFinalized || !c.is_present}
                            value={toR(c.savings_amount)}
                            onChange={(e) => handleCellChange(c.member_id, 'savings_amount', toP(e.target.value))}
                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100 transition"
                          />
                          {renderCellStatus(c.member_id, 'savings_amount')}
                        </td>
                        <td className="px-4 py-4 relative">
                          <input
                            type="number"
                            min="0"
                            disabled={isFinalized}
                            value={toR(c.penalty_paid)}
                            onChange={(e) => handleCellChange(c.member_id, 'penalty_paid', toP(e.target.value))}
                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100 transition font-semibold text-red-600"
                          />
                          {renderCellStatus(c.member_id, 'penalty_paid')}
                        </td>
                        <td className="px-4 py-4 relative">
                          <input
                            type="number"
                            min="0"
                            disabled={isFinalized || !c.is_present}
                            value={toR(c.loan_repayment)}
                            onChange={(e) => handleCellChange(c.member_id, 'loan_repayment', toP(e.target.value))}
                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100 transition"
                          />
                          {renderCellStatus(c.member_id, 'loan_repayment')}
                        </td>
                        <td className="px-4 py-4 relative">
                          <input
                            type="number"
                            min="0"
                            disabled={isFinalized || !c.is_present}
                            value={toR(c.interest_paid)}
                            onChange={(e) => handleCellChange(c.member_id, 'interest_paid', toP(e.target.value))}
                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100 transition"
                          />
                          {renderCellStatus(c.member_id, 'interest_paid')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Loans Issued Section */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-900">{t.loansHeader}</h2>
              <p className="text-gray-500 text-xs mt-1">{t.loansSub}</p>
            </div>

            {/* Loan Issue Form */}
            {!isFinalized && (
              <form onSubmit={handleIssueLoan} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <div className="lg:col-span-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t.selectMemberLabel}</label>
                  <select
                    value={loanForm.member_id}
                    onChange={(e) => setLoanForm({ ...loanForm, member_id: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2 text-xs bg-white focus:border-orange-500 outline-none"
                  >
                    <option value="">{t.selectMemberOption}</option>
                    {orgMembers.map(m => (
                      <option key={m.id} value={m.id}>
                        #{m.member_number} {m.name}
                        {m.phone ? ` (${m.phone})` : ''}
                      </option>
                    ))}
                  </select>
                  {formErrors.member_id && <p className="text-red-500 text-[10px] mt-0.5">{formErrors.member_id}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t.amountLabel}</label>
                  <input
                    type="number"
                    min="1"
                    placeholder={t.amountPlaceholder}
                    value={loanForm.amount}
                    onChange={(e) => setLoanForm({ ...loanForm, amount: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:border-orange-500 outline-none"
                  />
                  {formErrors.amount && <p className="text-red-500 text-[10px] mt-0.5">{formErrors.amount}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t.rateLabel}</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 2.0"
                    value={loanForm.interest_rate}
                    onChange={(e) => setLoanForm({ ...loanForm, interest_rate: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:border-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t.termLabel}</label>
                  <input
                    type="number"
                    min="1"
                    value={loanForm.term_months}
                    onChange={(e) => setLoanForm({ ...loanForm, term_months: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:border-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t.purposeLabel}</label>
                  <input
                    type="text"
                    placeholder={t.purposePlaceholder}
                    value={loanForm.purpose}
                    onChange={(e) => setLoanForm({ ...loanForm, purpose: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:border-orange-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-5 flex justify-between items-center mt-2 pt-2 border-t border-gray-100/50">
                  <span className="text-[10px] text-gray-400" dangerouslySetInnerHTML={{ __html: t.adminHint }} />
                  <button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition active:scale-95"
                  >
                    {t.issueLoanBtn}
                  </button>
                </div>
              </form>
            )}

            {/* Issued Loans List */}
            {issuedLoans.length === 0 ? (
              <p className="text-gray-400 text-xs italic text-center py-4">{t.noLoans}</p>
            ) : (
              <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                      <th className="px-4 py-2.5">{t.loansListHeader}</th>
                      <th className="px-4 py-2.5">{t.loansListAmount}</th>
                      <th className="px-4 py-2.5 text-center">{t.loansListInterest}</th>
                      <th className="px-4 py-2.5 text-center">{t.loansListTerm}</th>
                      <th className="px-4 py-2.5">{t.loansListStatus}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {issuedLoans.map(l => (
                      <tr key={l.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-bold text-gray-900">{l.member?.name}</td>
                        <td className="px-4 py-3 text-gray-900">{formatRupees(l.loan_amount)}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{l.interest_rate}%</td>
                        <td className="px-4 py-3 text-center text-gray-600">{l.term_months}m</td>
                        <td className="px-4 py-3">
                          {l.status === 'PENDING' ? (
                            <span className="inline-flex px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px]">
                              {t.awaitingApproval}
                            </span>
                          ) : l.status === 'ACTIVE' ? (
                            <span className="inline-flex px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-[10px]">
                              {t.activeApproved}
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 bg-red-50 text-red-700 rounded-full text-[10px]">
                              {l.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Expenses & Income forms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Other Expenses Section */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-bold text-gray-900 text-base">{t.otherExpensesHeader}</h3>
                <p className="text-gray-400 text-[10px] mt-0.5">{t.otherExpensesSub}</p>
              </div>

              {!isFinalized && (
                <form onSubmit={handleAddExpense} className="grid grid-cols-3 gap-2 items-end">
                  <div className="col-span-2 space-y-2">
                    <select
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2 text-xs bg-white outline-none focus:border-orange-500"
                    >
                      <option value="MISCELLANEOUS">MISCELLANEOUS</option>
                      <option value="STATIONERY">STATIONERY</option>
                      <option value="TEA_SNACKS">TEA/SNACKS</option>
                      <option value="PRINTING">PRINTING</option>
                      <option value="BANK_CHARGES">BANK CHARGES</option>
                    </select>
                    <input
                      type="text"
                      placeholder={t.descriptionPlaceholder}
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder={t.amountExpensesPlaceholder}
                      required
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-orange-500"
                    />
                    <button
                      type="submit"
                      className="w-full bg-red-50 text-red-600 hover:bg-red-100 font-bold p-2 rounded-lg text-xs transition"
                    >
                      {t.addExpenseBtn}
                    </button>
                  </div>
                </form>
              )}

              {/* Expenses List */}
              {expenses.length === 0 ? (
                <p className="text-gray-400 text-xs italic text-center py-2">{t.noExpenses}</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {expenses.map(e => (
                    <div key={e.id} className="flex justify-between items-center p-2.5 border border-gray-50 bg-gray-50/20 rounded-xl text-xs">
                      <div>
                        <div className="font-bold text-gray-800">{e.category}</div>
                        {e.description && <div className="text-gray-400 text-[10px]">{e.description}</div>}
                      </div>
                      <div className="flex items-center gap-2 font-semibold">
                        <span className="text-red-600">-{formatRupees(e.amount)}</span>
                        {!isFinalized && (
                          <button
                            onClick={() => handleDeleteExpense(e.id)}
                            className="text-red-400 hover:text-red-600"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Other Income Section */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-bold text-gray-900 text-base">{t.otherIncomeHeader}</h3>
                <p className="text-gray-400 text-[10px] mt-0.5">{t.otherIncomeSub}</p>
              </div>

              {!isFinalized && (
                <form onSubmit={handleAddIncome} className="grid grid-cols-3 gap-2 items-end">
                  <div className="col-span-2 space-y-2">
                    <select
                      value={incomeForm.category}
                      onChange={(e) => setIncomeForm({ ...incomeForm, category: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2 text-xs bg-white outline-none focus:border-orange-500"
                    >
                      <option value="OTHER">OTHER</option>
                      <option value="DONATION">DONATION</option>
                      <option value="BANK_LOAN">BANK LOAN</option>
                      <option value="BANK_INTEREST">BANK INTEREST</option>
                    </select>
                    <input
                      type="text"
                      placeholder={t.descriptionPlaceholder}
                      value={incomeForm.description}
                      onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder={t.amountExpensesPlaceholder}
                      required
                      value={incomeForm.amount}
                      onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-orange-500"
                    />
                    <button
                      type="submit"
                      className="w-full bg-green-50 text-green-600 hover:bg-green-100 font-bold p-2 rounded-lg text-xs transition"
                    >
                      {t.addIncomeBtn}
                    </button>
                  </div>
                </form>
              )}

              {/* Income List */}
              {incomes.length === 0 ? (
                <p className="text-gray-400 text-xs italic text-center py-2">{t.noIncome}</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {incomes.map(i => (
                    <div key={i.id} className="flex justify-between items-center p-2.5 border border-gray-50 bg-gray-50/20 rounded-xl text-xs">
                      <div>
                        <div className="font-bold text-gray-800">{i.category}</div>
                        {i.description && <div className="text-gray-400 text-[10px]">{i.description}</div>}
                      </div>
                      <div className="flex items-center gap-2 font-semibold">
                        <span className="text-green-600">+{formatRupees(i.amount)}</span>
                        {!isFinalized && (
                          <button
                            onClick={() => handleDeleteIncome(i.id)}
                            className="text-red-400 hover:text-red-600"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
        
        {/* Right Column (Sticky Summary Sidebar) */}
        <div className="lg:col-span-1">
          <div className="lg:hidden h-px bg-gray-100 -mx-4 mb-6" />
          <div className="sticky top-6 space-y-6">
            
            {/* Summary Card */}
            <div className="bg-white border-2 border-orange-100 rounded-3xl p-6 shadow-xl space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  {t.summaryHeader}
                </h2>
                <p className="text-gray-500 text-xs mt-1">{t.summarySub}</p>
              </div>

              <div className="space-y-3.5 text-sm font-medium">
                <div className="flex justify-between text-gray-500">
                  <span>{t.summaryOpening}</span>
                  <span className="text-gray-900">{formatRupees(meeting.opening_balance)}</span>
                </div>
                
                <hr className="border-gray-100" />
                
                <div className="flex justify-between text-gray-500 text-xs">
                  <span>{t.summarySavings}</span>
                  <span className="text-gray-700">+{formatRupees(sumSavings)}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-xs">
                  <span>{t.summaryPenalties}</span>
                  <span className="text-gray-700">+{formatRupees(sumPenalties)}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-xs">
                  <span>{t.summaryLoanRepaid}</span>
                  <span className="text-gray-700">+{formatRupees(sumRepayments)}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-xs">
                  <span>{t.summaryInterest}</span>
                  <span className="text-gray-700">+{formatRupees(sumInterest)}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-xs">
                  <span>{t.summaryOtherIncome}</span>
                  <span className="text-gray-700">+{formatRupees(sumOtherContributions + sumIncomes)}</span>
                </div>

                <div className="flex justify-between font-bold text-green-700 bg-green-50 p-2.5 rounded-xl border border-green-200">
                  <span>{t.summaryTotalReceipts}</span>
                  <span>{formatRupees(totalReceipts)}</span>
                </div>

                <hr className="border-gray-100" />

                <div className="flex justify-between text-gray-500 text-xs">
                  <span>{t.summaryLoansGiven}</span>
                  <span className="text-gray-700">-{formatRupees(sumLoansIssued)}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-xs">
                  <span>{t.summaryOtherExpenses}</span>
                  <span className="text-gray-700">-{formatRupees(sumExpenses)}</span>
                </div>

                <div className="flex justify-between font-bold text-red-600 bg-red-50/50 p-2.5 rounded-xl border border-red-100/50">
                  <span>{t.summaryTotalExpenses}</span>
                  <span>{formatRupees(totalExpenses)}</span>
                </div>

                <hr className="border-2 border-dashed border-gray-100" />

                <div className={`flex justify-between items-center p-3 rounded-2xl border ${closingBalance >= 0 ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-red-50/80 border-red-200 text-red-700"}`}>
                  <span className="text-xs font-bold uppercase tracking-wider">{t.summaryClosingBalance}</span>
                  <span className="text-2xl font-black">{formatRupees(closingBalance)}</span>
                </div>
              </div>

              {/* Attendance Indicator */}
              <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between text-xs text-gray-500">
                <span>{t.attendanceLabel}</span>
                <span className="font-bold text-gray-900">{presentMembers} / {totalMembers} {t.attendanceSub}</span>
              </div>

              {/* Alerts & Action Buttons */}
              {closingBalance < 0 && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-xs flex gap-2 font-medium">
                  <span className="text-base">⚠️</span>
                  <span>{t.negativeBalanceWarning}</span>
                </div>
              )}

              {!isFinalized && currentMemberRole === 'SUPERADMIN' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      {t.closingDateLabel}
                    </label>
                    <input
                      type="date"
                      value={closingDate}
                      onChange={e => setClosingDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl 
                                 px-3 py-2 text-sm focus:outline-none 
                                 focus:ring-2 focus:ring-orange-400"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {t.closingDateSub}
                    </p>
                  </div>
                  <button
                    onClick={handleFinalize}
                    disabled={closingBalance < 0 || finalizeLoading}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold p-4 rounded-2xl text-center shadow-lg active:scale-95 transition disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {finalizeLoading ? t.finalizingText : t.finalizeBtn}
                  </button>
                </div>
              )}

              {!isFinalized && currentMemberRole === 'ADMIN' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 text-center font-semibold">
                  {t.onlySuperadminNotice}
                </div>
              )}
            </div>

            {/* Meeting Notes Card */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-md space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
                <span className="text-xl">📝</span>
                <h3 className="font-extrabold text-gray-900 text-sm md:text-base">
                  {t.notesCardTitle}
                </h3>
              </div>

              {!isFinalized && (currentMemberRole === 'SUPERADMIN' || currentMemberRole === 'ADMIN') ? (
                <div className="space-y-3">
                  <textarea
                    placeholder={t.notesPlaceholder}
                    rows={6}
                    value={meetingNotes}
                    onChange={(e) => setMeetingNotes(e.target.value)}
                    className="w-full border border-gray-200 rounded-2xl p-4 text-xs md:text-sm outline-none focus:ring-2 focus:ring-orange-400 transition"
                  />
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold p-3 rounded-2xl text-center text-xs shadow-md transition active:scale-95 disabled:opacity-50"
                  >
                    {savingNotes ? t.savingNotesText : t.saveNotesBtn}
                  </button>
                </div>
              ) : (
                <div className="bg-amber-50/20 border border-amber-100/50 rounded-2xl p-4 text-xs md:text-sm text-gray-700 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {meetingNotes.trim() ? meetingNotes : (
                    <p className="text-gray-400 italic text-center py-2">{t.noNotesText}</p>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  )
}

