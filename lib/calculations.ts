import type { Loan, LoanEmi, MeetingContribution, MeetingTotals, EmiStatus } from "@/types"

// ─── CURRENCY HELPERS ────────────────────────────────────────

/**
 * Rupees (from user input) → paise for DB storage
 * Handles string "1000.50" or number 1000.50 → 100050
 */
export function toP(rupees: number | string): number {
  if (rupees === '' || rupees === null || rupees === undefined) return 0
  const n = typeof rupees === 'string' ? parseFloat(rupees) : rupees
  if (isNaN(n)) return 0
  // Round to avoid floating point: 10.005 * 100 = 1000.5 → 1001
  return Math.round(n * 100)
}

/**
 * Paise (from DB) → rupees for display/input
 */
export function toR(paise: number): number {
  if (!paise) return 0
  return paise / 100
}

/**
 * Format paise as ₹ string
 */
export function formatRupees(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format((paise || 0) / 100)
}

/**
 * Safe add paise values — prevents accumulating floating point errors
 */
export function addP(...values: (number | undefined | null)[]): number {
  return values.reduce((sum: number, v) => sum + Math.round(v || 0), 0) as number
}

// ─── MEETING CALCULATIONS ─────────────────────────────────────

export interface CalcMeetingInput {
  opening_balance: number      // paise
  contributions: Array<{
    savings_amount: number
    loan_repayment: number
    interest_paid: number
    penalty_paid: number
    other_amount: number
    is_present: boolean
  }>
  loans_issued_total: number   // paise
  other_expenses_total: number // paise
  other_income_total: number   // paise
}

export function calcMeetingTotals(input: CalcMeetingInput): MeetingTotals {
  const c = input.contributions

  const total_savings      = addP(...c.map(x => x.savings_amount))
  const total_penalty      = addP(...c.map(x => x.penalty_paid))
  const total_loan_repayment = addP(...c.map(x => x.loan_repayment))
  const total_interest     = addP(...c.map(x => x.interest_paid))
  const total_other_income = addP(...c.map(x => x.other_amount)) + input.other_income_total

  const total_receipts = addP(
    total_savings, total_penalty,
    total_loan_repayment, total_interest, total_other_income
  )

  const total_loans_issued    = input.loans_issued_total
  const total_other_expenses  = input.other_expenses_total
  const total_expenses        = addP(total_loans_issued, total_other_expenses)

  const closing_balance = addP(input.opening_balance, total_receipts) - total_expenses

  return {
    total_savings, total_penalty, total_loan_repayment,
    total_interest, total_other_income, total_receipts,
    total_loans_issued, total_other_expenses,
    total_expenses, closing_balance
  }
}

// ─── LOAN / EMI CALCULATIONS ──────────────────────────────────

/**
 * Monthly interest on outstanding principal
 * Uses simple interest: principal × annualRate% / 12
 */
export function calcMonthlyInterest(principalPaise: number, annualRatePercent: number): number {
  return Math.round(principalPaise * annualRatePercent / 12 / 100)
}

/**
 * Generate EMI schedule for a loan
 * Returns array ready to insert into loan_emis table
 */
export function calcEmiSchedule(
  loanAmountPaise: number,
  annualRatePercent: number,
  termMonths: number,
  startDate: Date
): Omit<LoanEmi, 'id' | 'loan_id'>[] {
  const emis: Omit<LoanEmi, 'id' | 'loan_id'>[] = []
  let outstanding = loanAmountPaise
  // Equal principal installments
  const basePrincipal = Math.floor(loanAmountPaise / termMonths)

  for (let i = 0; i < termMonths; i++) {
    const dueDate = new Date(startDate)
    dueDate.setMonth(dueDate.getMonth() + i + 1)
    const my = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`

    const interest = calcMonthlyInterest(outstanding, annualRatePercent)
    // Last EMI gets remainder to avoid rounding drift
    const principal = i === termMonths - 1 ? outstanding : Math.min(basePrincipal, outstanding)

    emis.push({
      month_year: my,
      due_date: dueDate.toISOString().split('T')[0],
      principal_due: principal,
      interest_due: interest,
      principal_paid: 0,
      interest_paid: 0,
      fine_amount: 0,
      status: 'PENDING' as EmiStatus,
      paid_at: undefined
    })

    outstanding -= principal
    if (outstanding <= 0) break
  }
  return emis
}

// ─── MEMBER STATS ─────────────────────────────────────────────

export function calcMemberStats(
  contributions: Pick<MeetingContribution, 'savings_amount' | 'interest_paid' | 'is_present'>[],
  loans: Pick<Loan, 'outstanding_amount' | 'status'>[]
) {
  const total_savings  = addP(...contributions.map(c => c.savings_amount))
  const total_interest = addP(...contributions.map(c => c.interest_paid))
  const outstanding    = addP(...loans.filter(l => l.status === 'ACTIVE').map(l => l.outstanding_amount))
  const attended       = contributions.filter(c => c.is_present).length

  return {
    total_savings,
    total_interest_paid: total_interest,
    outstanding_loan: outstanding,
    net_position: total_savings - outstanding,
    attendance_percent: contributions.length > 0
      ? Math.round(attended / contributions.length * 100) : 0,
    meetings_attended: attended,
    total_meetings: contributions.length
  }
}

// ─── DATE HELPERS ─────────────────────────────────────────────

export function getCurrentMonthYear(): string {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
}

export function formatMonthYear(my: string): string {
  if (!my) return ''
  const [y, m] = my.split('-')
  return new Date(+y, +m - 1).toLocaleDateString('en-IN', {
    month: 'long', year: 'numeric'
  })
}

export function getNextMonthYear(my: string): string {
  const [y, m] = my.split('-').map(Number)
  const d = new Date(y, m) // m is already 1-based, Date(y, m) = first of next month
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function getNextMonthStart(dateStr: string): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + 1)
  d.setDate(1)
  return d.toISOString().split('T')[0]
}
