# REBUILD-V1 PROGRESS LOG

## Master Plan Checklist
- [x] Save `docs/PRODUCT_SPEC.md` as source of truth and create branch `rebuild-v1`.
- [ ] **Phase 1: Critical Cleanup (Quick Wins)**
  - [x] 1.1 Remove bypass buttons from `join-institute.tsx` and add role guards to routes.
  - [ ] 1.2 Fix all corrupted UTF-8 strings and replace emojis in headers/titles with lucide icons.
  - [x] 1.3 Delete `src/app/explore.tsx` and unused boilerplate.
  - [x] 1.4 Remove mock-success fallbacks (Google login mock, DEFAULT_CHILDREN fallback, fake offline video toggle, fake absentee alert, example.com PDF).
  - [x] 1.5 Remove broken `switchRole` identity-swapping in `AuthContext`.
  - [ ] 1.6 Make all SVG charts responsive with viewBox + container width, and safe with 0, 1, or N points.
  - [x] 1.7 V1 decisions: Move fees to `src/features/fees/` with `FEATURE_FEES=false`; set `userInterfaceStyle: "light"` in `app.json`.
  - [x] 1.8 Verify `npx tsc --noEmit` is 0 errors.
- [ ] **Phase 2: New Data Model + Backend (Supabase)**
- [ ] **Phase 3: Data Layer + Code Structure**
- [ ] **Phase 4: Flows & Navigation (Rebuild)**
- [ ] **Phase 5: Features**
- [ ] **Phase 6: Design System**
- [ ] **Phase 7: QA & Security**

---

## Log Entries

### Entry 001 - Spec Saved & Branch Setup
- **Timestamp:** 2026-11-04T00:45:00+05:30
- **Action:** Created `rebuild-v1` branch, committed `docs/PRODUCT_SPEC.md` and initial `docs/PROGRESS.md`.

### Entry 002 - Sub-step 1A: Role Guards & Route Protection
- **Timestamp:** 2026-11-05T00:12:00+05:30
- **Actions:**
  - Deleted orphaned src/app/explore.tsx boilerplate.
  - Implemented strictly typed src/hooks/useRoleGuard.ts.
  - Added role guards across all role-specific screens:
    - /verify-students (restricted to Teacher/Admin)
    - /join-institute (restricted to Student)
    - /teacher (restricted to Teacher/Admin)
    - /student (restricted to Student/Teacher/Admin)
    - /parent (restricted to Parent/Admin)
    - /admin (restricted to Admin)
    - /student-detail (restricted to Teacher/Admin/Parent)
  - Removed 'Simulate Teacher Approval' and 'Open Teacher Verification Desk' backdoor buttons from join-institute.tsx, replacing with clean 'Return to Student Desk' navigation.
  - TypeScript verification: Passed with 0 errors.

### Entry 003 - Sub-step 1B: Fees Isolation & UI Gating
- **Timestamp:** 2026-11-05T00:20:00+05:30
- **Actions:**
  - Configured global feature flags in `src/config/features.ts` with `FEATURE_FEES = false`.
  - Created isolated module `src/features/fees/` and migrated:
    - `FeeReceiptModal.tsx`
    - `RazorpayCheckoutModal.tsx`
    - `AdminAnalyticsView.tsx`
    - `FeeCollectionBarChart.tsx`
    - `index.ts`
  - Re-exported fee components safely through `src/components/finance/` and `src/components/charts/` for backward compatibility.
  - In `parent.tsx`: Gated Tab 3 to display "Progress Reports" and Term Report Card downloads when `FEATURE_FEES=false`, completely hiding payment and ledger actions.
  - In `student.tsx`: Replaced Tuition Fee payment card with an Assignments submission vitals card when `FEATURE_FEES=false`.
  - In `admin.tsx`: Gated Tab 3 to "Admissions & Approvals" with student roster directory, hid WhatsApp Fee Blasts and Fee Collection Bar Chart when `FEATURE_FEES=false`.
  - Configured `app.json`: Locked `userInterfaceStyle` to `"light"`.
  - TypeScript verification: `npx tsc --noEmit` passed with 0 errors.

### Entry 004 - Sub-step 1C: Removal of Mock Fallbacks & Broken Identity Swapping
- **Timestamp:** 2026-11-05T00:26:00+05:30
- **Actions:**
  - In `AuthContext.tsx`:
    - Fixed `switchRole` to preserve the user's authentic profile without overwriting user ID or identity with hardcoded mock profiles.
    - Removed mock fallback in `signInWithGoogle` catch block; now properly returns `{ success: false, error: ... }` when unconfigured or failing.
  - In `ChildContext.tsx`:
    - Removed `DEFAULT_CHILDREN` fallback on query error or empty state; returns real empty state (`[]` and `null`).
    - Handled empty child links gracefully in `parent.tsx` with an active prompt to link a student code.
    - Removed random ID fabrication in `addChildByCodeOrPhone` when an invalid code was supplied; now returns clear validation errors.
  - In `VideoPlayerModal.tsx`:
    - Replaced hardcoded Rick Astley video ID (`dQw4w9WgXcQ`) with a clean educational physics video ID (`fNk_zzaMoSs`).
    - Replaced fake offline download toggle with an honest notice informing users that DRM offline video caching is scheduled for v2 with Bunny Stream CDN.
  - In `StudyMaterialsViewer.tsx`:
    - Replaced hardcoded `https://example.com/notes.pdf` with real device PDF file selection using `expo-document-picker`.
    - Added validation requiring an attached PDF file before publication.
  - In `teacher.tsx`:
    - Replaced simulated `setTimeout` attendance commit with direct state commit and honest note on v2 SMS gateway.
  - TypeScript verification: `npx tsc --noEmit` passed with 0 errors.
