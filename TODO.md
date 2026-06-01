# BachatBook — Phase 2 TODO

## Phase 0/1 (Verification)
- [x] `npm run dev` starts clean
- [x] `npm run build` succeeds (middleware/proxy conflict fixed)
- [x] `npm run lint` has no errors
- [ ] Confirmed Supabase tables + RLS + auth settings (manual)
- [ ] Manual flow tests A–E (as per checklist)

## Phase 2 — Setup
- [ ] Run Supabase SQL (Section 1: status column + create new meeting/loan tables + RLS + policies)
- [ ] Verify RLS policies exist for new tables

## Phase 2 — Code (safer/surgical updates)
- [ ] Update `types/index.ts` surgically (add/adjust missing types to match Phase2; avoid breaking existing code)
- [ ] Update `lib/calculations.ts` surgically (align `calcMeetingTotals` interface with Phase2 spec via wrapper/overload)
- [ ] Add missing shared UI components under `components/shared/` as specified (PageHeader, StatCard, StatusBadge, RoleBadge, AlertBanner, DataTable, ConfirmDialog, FormField, LoadingSpinner, EmptyState, SummaryRow)
- [ ] Minimal themed updates to layouts:
  - [ ] `app/(admin)/layout.tsx`
  - [ ] `app/(member)/layout.tsx`
- [ ] Update middleware only if required (Phase2 spec changes)
- [ ] Implement/adjust member CRUD pages + API routes if mismatched
- [ ] Implement meetings core page `app/(admin)/meetings/[id]/page.tsx`
- [ ] Implement meetings list page + new meeting creation flow
- [ ] Implement loans pages (list + detail/EMI schedule + approve/reject/close)
- [ ] Update dashboard
- [ ] Update member portal pages (member overview, loans, passbook)
- [ ] Implement admin expenses read-only page

## Testing after major milestones
- [ ] `npm run build` and `npm run lint` clean
- [ ] Manual checklist: Member management, Meetings, Loans, Dashboard, Portal
