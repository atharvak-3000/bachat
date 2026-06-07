-- ====================================================================
-- BACHATBOOK DATABASE SCHEMA
-- This schema represents the full database architecture for BachatBook
-- Optimized for PostgreSQL and Supabase.
-- Note: Currency fields are stored as BIGINT in paise (1 INR = 100 paise)
-- to avoid floating-point inaccuracies.
-- ====================================================================

-- Enable UUID extension if not already enabled (disabled to avoid read-only transaction errors)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. ORGANIZATIONS (Bachat Gats)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_marathi TEXT DEFAULT '',
    village TEXT NOT NULL,
    taluka TEXT DEFAULT '',
    district TEXT NOT NULL,
    group_code VARCHAR(10) NOT NULL UNIQUE,
    meeting_frequency VARCHAR(20) DEFAULT 'MONTHLY' NOT NULL,
    monthly_saving_amount BIGINT NOT NULL, -- Stored in paise
    default_interest_rate NUMERIC(5,2) DEFAULT 2.00 NOT NULL, -- Monthly/Annual % (e.g. 2.00 for 2%)
    default_penalty_amount BIGINT DEFAULT 0 NOT NULL, -- Stored in paise
    max_loan_limit BIGINT DEFAULT 0 NOT NULL, -- Stored in paise, 0 = unlimited
    subscription_plan VARCHAR(50) DEFAULT 'FREE' NOT NULL,
    subscription_status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL,
    subscription_expires_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    max_members INTEGER DEFAULT 10,
    is_approved BOOLEAN DEFAULT FALSE NOT NULL, -- Admin approval required
    is_email_verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==========================================
-- 2. MEMBERS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID, -- References auth.users(id) in Supabase Auth
    name TEXT NOT NULL,
    name_marathi TEXT DEFAULT '',
    phone VARCHAR(15) NOT NULL,
    email TEXT,
    address TEXT DEFAULT '',
    role VARCHAR(20) DEFAULT 'MEMBER' NOT NULL, -- 'SUPERADMIN', 'ADMIN', 'MEMBER'
    status VARCHAR(20) DEFAULT 'PENDING' NOT NULL, -- 'ACTIVE', 'PENDING', 'REJECTED'
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    kyc_status VARCHAR(20) DEFAULT 'PENDING' NOT NULL, -- 'PENDING', 'VERIFIED', 'REJECTED'
    kyc_notes TEXT,
    kyc_verified_by UUID REFERENCES public.members(id) ON DELETE SET NULL,
    kyc_verified_at TIMESTAMPTZ,
    member_number INTEGER NOT NULL,
    joining_date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_phone_per_organization UNIQUE (organization_id, phone)
);

-- ==========================================
-- 3. MEETINGS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    meeting_date DATE NOT NULL,
    month_year VARCHAR(30) NOT NULL, -- Format YYYY-MM or YYYY-MM-timestamp
    status VARCHAR(20) DEFAULT 'DRAFT' NOT NULL, -- 'DRAFT', 'FINALIZED'
    opening_balance BIGINT DEFAULT 0 NOT NULL, -- Stored in paise
    notes TEXT,
    created_by UUID REFERENCES public.members(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==========================================
-- 4. MEETING CONTRIBUTIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.meeting_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    savings_amount BIGINT DEFAULT 0 NOT NULL, -- Stored in paise
    loan_repayment BIGINT DEFAULT 0 NOT NULL, -- Stored in paise
    interest_paid BIGINT DEFAULT 0 NOT NULL, -- Stored in paise
    penalty_paid BIGINT DEFAULT 0 NOT NULL, -- Stored in paise
    other_amount BIGINT DEFAULT 0 NOT NULL, -- Stored in paise
    is_present BOOLEAN DEFAULT TRUE NOT NULL,
    CONSTRAINT unique_contribution_per_member_per_meeting UNIQUE (meeting_id, member_id)
);

-- ==========================================
-- 5. MEETING EXPENSES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.meeting_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    category VARCHAR(50) DEFAULT 'MISCELLANEOUS' NOT NULL,
    amount BIGINT NOT NULL, -- Stored in paise
    description TEXT DEFAULT ''
);

-- ==========================================
-- 6. MEETING INCOME
-- ==========================================
CREATE TABLE IF NOT EXISTS public.meeting_income (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    category VARCHAR(50) DEFAULT 'OTHER' NOT NULL,
    amount BIGINT NOT NULL, -- Stored in paise
    description TEXT DEFAULT ''
);

-- ==========================================
-- 7. LOANS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    loan_amount BIGINT NOT NULL, -- Stored in paise
    outstanding_amount BIGINT NOT NULL, -- Stored in paise
    interest_rate NUMERIC(5,2) DEFAULT 2.00 NOT NULL, -- Annual / Monthly interest %
    disbursed_date DATE NOT NULL,
    purpose TEXT DEFAULT '',
    term_months INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' NOT NULL, -- 'PENDING', 'ACTIVE', 'CLOSED', 'REJECTED'
    requested_by UUID REFERENCES public.members(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES public.members(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==========================================
-- 8. LOAN EMIs
-- ==========================================
CREATE TABLE IF NOT EXISTS public.loan_emis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    month_year VARCHAR(7) NOT NULL, -- Format 'YYYY-MM'
    due_date DATE NOT NULL,
    principal_due BIGINT NOT NULL, -- Stored in paise
    interest_due BIGINT NOT NULL, -- Stored in paise
    principal_paid BIGINT DEFAULT 0 NOT NULL, -- Stored in paise
    interest_paid BIGINT DEFAULT 0 NOT NULL, -- Stored in paise
    fine_amount BIGINT DEFAULT 0 NOT NULL, -- Stored in paise
    status VARCHAR(20) DEFAULT 'PENDING' NOT NULL, -- 'PENDING', 'PAID', 'OVERDUE', 'PARTIAL'
    paid_at TIMESTAMPTZ
);

-- ==========================================
-- 9. PAYMENT PROOFS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.payment_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    meeting_id UUID REFERENCES public.meetings(id) ON DELETE SET NULL,
    amount BIGINT NOT NULL, -- Stored in paise
    upi_reference TEXT,
    screenshot_url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' NOT NULL, -- 'PENDING', 'VERIFIED', 'REJECTED'
    verified_by UUID REFERENCES public.members(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==========================================
-- 10. NOTIFICATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'GENERAL' NOT NULL, -- 'GENERAL', 'LOAN_APPROVED', etc.
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==========================================
-- 11. ACTIVITY LOGS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    performed_by UUID REFERENCES public.members(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type VARCHAR(50) DEFAULT '',
    entity_id UUID,
    details JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ====================================================================
-- CUSTOM POSTGRESQL FUNCTIONS / RPCs
-- ====================================================================

-- Function: get_auth_users
-- Allows retrieval of user IDs and emails from the internal Supabase auth schema
CREATE OR REPLACE FUNCTION public.get_auth_users()
RETURNS TABLE (
    id UUID,
    email VARCHAR(255)
) SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY 
    SELECT u.id, u.email::VARCHAR(255) 
    FROM auth.users u;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- ROLE PRIVILEGES & PERMISSIONS GRANTS
-- Enables full CRUD access for Supabase default roles on all tables/sequences/functions.
-- ====================================================================

-- 1. Grant schema usage and creation privileges
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO service_role;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO anon;

-- 2. Grant permissions to existing tables, sequences, and functions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 3. Ensure future tables, sequences, and functions automatically get these permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;

-- ==========================================
-- 12. SUBSCRIPTIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL, -- 'BASIC', 'STANDARD', 'PREMIUM'
    amount BIGINT NOT NULL, -- Stored in paise
    max_members INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING' NOT NULL, -- 'PENDING', 'ACTIVE', 'FAILED', 'EXPIRED'
    phonepe_transaction_id TEXT,
    phonepe_merchant_transaction_id TEXT UNIQUE NOT NULL,
    payment_method VARCHAR(50),
    starts_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Grant privileges for subscriptions table
GRANT ALL PRIVILEGES ON TABLE public.subscriptions TO postgres, anon, authenticated, service_role;