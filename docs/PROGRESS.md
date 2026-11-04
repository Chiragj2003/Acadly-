# REBUILD-V1 PROGRESS LOG

## Master Plan Checklist
- [x] Save `docs/PRODUCT_SPEC.md` as source of truth and create branch `rebuild-v1`.
- [ ] **Phase 1: Critical Cleanup (Quick Wins)**
  - [ ] 1.1 Remove bypass buttons from `join-institute.tsx` and add role guards to routes.
  - [ ] 1.2 Fix all corrupted UTF-8 strings and replace emojis in headers/titles with lucide icons.
  - [ ] 1.3 Delete `src/app/explore.tsx` and unused boilerplate.
  - [ ] 1.4 Remove mock-success fallbacks (Google login mock, DEFAULT_CHILDREN fallback, fake offline video toggle, fake absentee alert, example.com PDF).
  - [ ] 1.5 Remove broken `switchRole` identity-swapping in `AuthContext`.
  - [ ] 1.6 Make all SVG charts responsive with viewBox + container width, and safe with 0, 1, or N points.
  - [ ] 1.7 V1 decisions: Move fees to `src/features/fees/` with `FEATURE_FEES=false`; set `userInterfaceStyle: "light"` in `app.json`.
  - [ ] 1.8 Verify `npx tsc --noEmit` is 0 errors.
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
