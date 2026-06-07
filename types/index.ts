export type Role = 'SUPERADMIN' | 'MEMBER';
export type MemberStatus = 'ACTIVE' | 'PENDING' | 'REJECTED';
export type KycStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type MeetingStatus = 'DRAFT' | 'FINALIZED';
export type LoanStatus = 'PENDING' | 'ACTIVE' | 'CLOSED' | 'REJECTED';
export type EmiStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';

export interface Organization {
  id: string;
  name: string;
  name_marathi?: string;
  village: string;
  taluka?: string;
  district: string;
  group_code: string;
  meeting_frequency: string;
  monthly_saving_amount: number; // paise
  default_interest_rate: number; // annual %
  default_penalty_amount: number; // paise
  max_loan_limit: number; // paise, 0=unlimited
  subscription_plan: string;
  subscription_status: string;
  subscription_expires_at?: string;
  trial_ends_at?: string;
  max_members?: number;
  is_approved: boolean;
  is_email_verified?: boolean;
  logo_url?: string;
  created_at: string;
}

export interface Member {
  id: string;
  organization_id: string;
  user_id?: string;
  name: string;
  name_marathi?: string;
  phone: string;
  email?: string;
  address?: string;
  role: Role;
  status: MemberStatus;
  is_active: boolean;
  kyc_status: KycStatus;
  kyc_notes?: string;
  kyc_verified_by?: string;
  kyc_verified_at?: string;
  member_number: number;
  joining_date: string;
  created_at: string;
  organization?: Organization;
}

export interface Meeting {
  id: string;
  organization_id: string;
  meeting_date: string;
  month_year: string; // 'YYYY-MM'
  status: MeetingStatus;
  opening_balance: number; // paise — auto-carried from prev meeting
  notes?: string;
  closing_date?: string;
  created_by?: string;
  created_at: string;
}

export interface MeetingContribution {
  id: string;
  meeting_id: string;
  member_id: string;
  savings_amount: number; // paise
  loan_repayment: number; // paise
  interest_paid: number; // paise
  penalty_paid: number; // paise
  other_amount: number; // paise
  is_present: boolean;
  member?: Member;
}

export interface MeetingExpense {
  id: string;
  meeting_id: string;
  category: string;
  amount: number; // paise
  description?: string;
}

export interface MeetingIncome {
  id: string;
  meeting_id: string;
  category: string;
  amount: number; // paise
  description?: string;
}

export interface Loan {
  id: string;
  organization_id: string;
  member_id: string;
  loan_amount: number; // paise
  outstanding_amount: number; // paise
  interest_rate: number; // annual %
  disbursed_date: string;
  purpose?: string;
  term_months: number;
  status: LoanStatus;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  member?: Member;
}

export interface LoanEmi {
  id: string;
  loan_id: string;
  month_year: string;
  due_date: string;
  principal_due: number; // paise
  interest_due: number; // paise
  principal_paid: number; // paise
  interest_paid: number; // paise
  fine_amount: number; // paise
  status: EmiStatus;
  paid_at?: string;
}

export interface MeetingTotals {
  total_savings: number;
  total_penalty: number;
  total_loan_repayment: number;
  total_interest: number;
  total_other_income: number;
  total_receipts: number;
  total_loans_issued: number;
  total_other_expenses: number;
  total_expenses: number;
  closing_balance: number;
}

export interface ActivityLog {
  id: string;
  organization_id: string;
  performed_by: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  created_at: string;
  member?: Pick<Member, 'id' | 'name'>;
}

export interface PaymentProof {
  id: string;
  organization_id: string;
  member_id: string;
  meeting_id?: string;
  amount: number;
  upi_reference?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  created_at: string;
  member?: Member;
}

export interface LoanWithMember extends Loan {
  member: Member;
}

export interface LoanWithEmis extends Loan {
  member: Member;
  loan_emis: LoanEmi[];
}

export interface MeetingContributionWithMember extends MeetingContribution {
  member: Member;
}

export interface MeetingWithDetails extends Meeting {
  meeting_contributions: MeetingContributionWithMember[];
  meeting_expenses: MeetingExpense[];
  meeting_income: MeetingIncome[];
}

export type MemberWithOrg = Member & { organization: Organization };

