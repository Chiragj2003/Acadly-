# REBUILD-V1 PROGRESS LOG

## Master Plan Checklist
- [x] Save `docs/PRODUCT_SPEC.md` as source of truth and create branch `rebuild-v1`.
- [x] **Phase 1: Critical Cleanup (Quick Wins)**
  - [x] 1.1 Remove bypass buttons from `join-institute.tsx` and add role guards to routes.
  - [x] 1.2 Fix all corrupted UTF-8 strings and replace emojis in headers/titles with lucide icons.
  - [x] 1.3 Delete `src/app/explore.tsx` and unused boilerplate.
  - [x] 1.4 Remove mock-success fallbacks (Google login mock, DEFAULT_CHILDREN fallback, fake offline video toggle, fake absentee alert, example.com PDF).
  - [x] 1.5 Remove broken `switchRole` identity-swapping in `AuthContext`.
  - [x] 1.6 Make all SVG charts responsive with viewBox + container width, and safe with 0, 1, or N points.
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

### Entry 006 - Student UI/UX Polish, In-App Document Reader & Analytics Fixes
- **Timestamp:** 2026-11-05T00:51:00+05:30
- **Actions:**
  - In-App Document Opening & Download:
    - Created `DocumentReaderModal.tsx` for immediate offline reading of study notes and solution files inside the app with formatted sections and a 1-tap "Save PDF" button.
    - Integrated in-app reading and device downloads across `StudyMaterialsViewer.tsx`, `AssignmentsModule.tsx`, and `student.tsx`.
  - Analytics & Cohort Curve Fixes:
    - Redesigned `PerformanceComparisonChart.tsx` with genuine SVG curves (Cohort Average, Batch Topper, and Student Score) with dynamic coordinate mapping and score halos.
    - Replaced hardcoded static vitals with 100% dynamically computed stats (Latest Score %, pts vs. Batch Avg, and Gap to Topper).
    - Fixed Leaderboard card in `student.tsx`: added `overflow-hidden`, `min-w-0 flex-1` text truncation, and `shrink-0` score badges so values never overflow container boxes.
  - Profile Clean-Up:
    - Removed non-essential fields (Blood Group, residential address) from Student profile.
    - Preserved relevant academic fields: School/Junior College, Target Exam, Enrolled Batch, and Admission Number.
  - Classroom Chat Reorganization:
    - Renamed tab from "Doubts" to "Chat".
    - Removed 1-on-1 direct faculty messaging.
    - Structured authentic group chat channels: `Class 12 • Mathematics Group`, `Class 12 • Physics Group`, `Class 12 • Chemistry Discussion`, `Batch Announcements & Circulars`, and `Community Student Lounge`.
  - TypeScript verification: `npx tsc --noEmit` passed with 0 errors.

### Entry 005 - Sub-step 1D: Responsive SVG Charts, React Native Text Crash Fix & i18n
- **Timestamp:** 2026-11-05T00:31:00+05:30
- **Actions:**
  - Resolved fatal runtime crash in `src/app/student.tsx` caused by illegal HTML `<strong>` tags, replacing them with React Native `<Text className="font-bold">`.
  - Audited full AST across all TSX files in `src/` to confirm zero illegal HTML tags or strings outside `<Text>` components remain.
  - Made SVG charts fully responsive and guarded against zero/empty data points:
    - `AttendanceRingAndTrendChart.tsx`: Added `viewBox="0 0 110 110"`, clamped rates between 0% and 100%, and handled 0 classes safely.
    - `PerformanceComparisonChart.tsx`: Added responsive `viewBox` with dynamic width scaling, clamped bar heights, and safe fallbacks for empty assessment histories.
    - `SubjectRadarOrBarChart.tsx`: Added dynamic percentage average calculation, clamped mastery percentages, and empty state safety.
  - Established i18n foundation:
    - Installed `i18next`, `react-i18next`, and `expo-localization`.
    - Created `src/i18n/locales/en.json` and `src/i18n/locales/hi.json` with primary localization keys.
    - Created `src/i18n/index.ts` and initialized in `src/app/_layout.tsx`.
  - Verified default teacher code `JOSHI-MATH-89` is consistently aligned with `Prof. Vikram Joshi`.
  - TypeScript verification: `npx tsc --noEmit` passed with 0 errors.

### Entry 006 - Student UI/UX Polish, In-App Document Reader & Analytics Fixes
- **Timestamp:** 2026-11-05T00:51:00+05:30
- **Actions:**
  - In-App Document Opening & Download:
    - Created `DocumentReaderModal.tsx` for immediate offline reading of study notes and solution files inside the app with formatted sections and a 1-tap "Save PDF" button.
    - Integrated in-app reading and device downloads across `StudyMaterialsViewer.tsx`, `AssignmentsModule.tsx`, and `student.tsx`.
  - Analytics & Cohort Curve Fixes:
    - Redesigned `PerformanceComparisonChart.tsx` with genuine SVG curves (Cohort Average, Batch Topper, and Student Score) with dynamic coordinate mapping and score halos.
    - Replaced hardcoded static vitals with 100% dynamically computed stats (Latest Score %, pts vs. Batch Avg, and Gap to Topper).
    - Fixed Leaderboard card in `student.tsx`: added `overflow-hidden`, `min-w-0 flex-1` text truncation, and `shrink-0` score badges so values never overflow container boxes.
  - Profile Clean-Up:
    - Removed non-essential fields (Blood Group, residential address) from Student profile.
    - Preserved relevant academic fields: School/Junior College, Target Exam, Enrolled Batch, and Admission Number.
  - Classroom Chat Reorganization:
    - Renamed tab from "Doubts" to "Chat".
    - Removed 1-on-1 direct faculty messaging.
    - Structured authentic group chat channels: `Class 12 • Mathematics Group`, `Class 12 • Physics Group`, `Class 12 • Chemistry Discussion`, `Batch Announcements & Circulars`, and `Community Student Lounge`.
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

### Entry 006 - Student UI/UX Polish, In-App Document Reader & Analytics Fixes
- **Timestamp:** 2026-11-05T00:51:00+05:30
- **Actions:**
  - In-App Document Opening & Download:
    - Created `DocumentReaderModal.tsx` for immediate offline reading of study notes and solution files inside the app with formatted sections and a 1-tap "Save PDF" button.
    - Integrated in-app reading and device downloads across `StudyMaterialsViewer.tsx`, `AssignmentsModule.tsx`, and `student.tsx`.
  - Analytics & Cohort Curve Fixes:
    - Redesigned `PerformanceComparisonChart.tsx` with genuine SVG curves (Cohort Average, Batch Topper, and Student Score) with dynamic coordinate mapping and score halos.
    - Replaced hardcoded static vitals with 100% dynamically computed stats (Latest Score %, pts vs. Batch Avg, and Gap to Topper).
    - Fixed Leaderboard card in `student.tsx`: added `overflow-hidden`, `min-w-0 flex-1` text truncation, and `shrink-0` score badges so values never overflow container boxes.
  - Profile Clean-Up:
    - Removed non-essential fields (Blood Group, residential address) from Student profile.
    - Preserved relevant academic fields: School/Junior College, Target Exam, Enrolled Batch, and Admission Number.
  - Classroom Chat Reorganization:
    - Renamed tab from "Doubts" to "Chat".
    - Removed 1-on-1 direct faculty messaging.
    - Structured authentic group chat channels: `Class 12 • Mathematics Group`, `Class 12 • Physics Group`, `Class 12 • Chemistry Discussion`, `Batch Announcements & Circulars`, and `Community Student Lounge`.
  - TypeScript verification: `npx tsc --noEmit` passed with 0 errors.

### Entry 005 - Sub-step 1D: Responsive SVG Charts, React Native Text Crash Fix & i18n
- **Timestamp:** 2026-11-05T00:31:00+05:30
- **Actions:**
  - Resolved fatal runtime crash in `src/app/student.tsx` caused by illegal HTML `<strong>` tags, replacing them with React Native `<Text className="font-bold">`.
  - Audited full AST across all TSX files in `src/` to confirm zero illegal HTML tags or strings outside `<Text>` components remain.
  - Made SVG charts fully responsive and guarded against zero/empty data points:
    - `AttendanceRingAndTrendChart.tsx`: Added `viewBox="0 0 110 110"`, clamped rates between 0% and 100%, and handled 0 classes safely.
    - `PerformanceComparisonChart.tsx`: Added responsive `viewBox` with dynamic width scaling, clamped bar heights, and safe fallbacks for empty assessment histories.
    - `SubjectRadarOrBarChart.tsx`: Added dynamic percentage average calculation, clamped mastery percentages, and empty state safety.
  - Established i18n foundation:
    - Installed `i18next`, `react-i18next`, and `expo-localization`.
    - Created `src/i18n/locales/en.json` and `src/i18n/locales/hi.json` with primary localization keys.
    - Created `src/i18n/index.ts` and initialized in `src/app/_layout.tsx`.
  - Verified default teacher code `JOSHI-MATH-89` is consistently aligned with `Prof. Vikram Joshi`.
  - TypeScript verification: `npx tsc --noEmit` passed with 0 errors.

### Entry 006 - Student UI/UX Polish, In-App Document Reader & Analytics Fixes
- **Timestamp:** 2026-11-05T00:51:00+05:30
- **Actions:**
  - In-App Document Opening & Download:
    - Created `DocumentReaderModal.tsx` for immediate offline reading of study notes and solution files inside the app with formatted sections and a 1-tap "Save PDF" button.
    - Integrated in-app reading and device downloads across `StudyMaterialsViewer.tsx`, `AssignmentsModule.tsx`, and `student.tsx`.
  - Analytics & Cohort Curve Fixes:
    - Redesigned `PerformanceComparisonChart.tsx` with genuine SVG curves (Cohort Average, Batch Topper, and Student Score) with dynamic coordinate mapping and score halos.
    - Replaced hardcoded static vitals with 100% dynamically computed stats (Latest Score %, pts vs. Batch Avg, and Gap to Topper).
    - Fixed Leaderboard card in `student.tsx`: added `overflow-hidden`, `min-w-0 flex-1` text truncation, and `shrink-0` score badges so values never overflow container boxes.
  - Profile Clean-Up:
    - Removed non-essential fields (Blood Group, residential address) from Student profile.
    - Preserved relevant academic fields: School/Junior College, Target Exam, Enrolled Batch, and Admission Number.
  - Classroom Chat Reorganization:
    - Renamed tab from "Doubts" to "Chat".
    - Removed 1-on-1 direct faculty messaging.
    - Structured authentic group chat channels: `Class 12 • Mathematics Group`, `Class 12 • Physics Group`, `Class 12 • Chemistry Discussion`, `Batch Announcements & Circulars`, and `Community Student Lounge`.
  - TypeScript verification: `npx tsc --noEmit` passed with 0 errors.

### Entry 007 - UI/UX Alignment, Visual Hierarchy, iOS/Android Safe Area & Product Catalog Redesign
- **Timestamp:** 2026-11-06T10:09:00+05:30
- **Actions:**
  - Header & Safe Area Overhaul:
    - Redesigned `HeaderBar.tsx`: reduced height to balanced 56pt, replaced hardcoded childish emojis (`🌸`, `🍎`) with clean initials badges (`AS`, `RV`, `RS`, `AD`) and vector icons.
    - Enhanced `ScreenWrapper.tsx` with status bar background continuity, `statusBarStyle`, and `keyboardAvoiding` toggle to prevent double keyboard offsets on iOS.
    - Updated `auth.tsx` with dynamic safe area insets via `useSafeAreaInsets` to eliminate Dynamic Island / notch collisions on iPhone 15/16/17 and modern Android devices.
  - Bottom Navigation & Footer Polish:
    - Updated `BottomTabBar.tsx` to follow native iOS HIG & Android Material specifications: equidistant `flex-1` layout per tab, strict height calculation accounting for Home Indicator (`insets.bottom`), hairline top border, and refined badge positioning.
  - Visual Hierarchy & Grid System:
    - Upgraded Study Hub & Library catalog cards in `student.tsx` and `community.tsx`: added structured preview thumbnail boxes, rating trust signals (`★ 4.9 • 1.4k reads`) directly adjacent to subject badges, verified instructor shield checks, and refined primary/secondary action buttons.
    - Eliminated heavy and distracting divider lines across cards, replacing them with subtle `border-slate-100` and balanced whitespace.
    - Removed redundant labels (such as "Author:", "Price:", "Category:") where context is already clear.
    - Fixed nested vertical `ScrollView` conflicts in `community.tsx`, `join-institute.tsx`, `student-detail.tsx`, `verify-students.tsx`, and `chat.tsx` by setting `scrollable={false}` on `ScreenWrapper`.
    - Modernized `AssignmentsModule.tsx` with intentional academic blue theme (`#2563EB`) and clean status indicators.
  - TypeScript verification: `npx tsc --noEmit` passed with 0 errors across all screens.

### Entry 008 - Teacher Desk Overhaul, In-App Interactive DPP Form Builder, Keyboard Fix & Crash Resolution
- **Timestamp:** 2026-11-06T11:57:00+05:30
- **Actions:**
  - **Crash Resolution & Warning Fixes:**
    - Diagnosed and resolved fatal `[Error: Couldn't find a LinkingContext context.]` caused by recursive stack overflow in `react-native-css-interop` (`render-component.js:135`) due to unsupported CSS `transition-*` properties (`transition-colors`, `transition-all`, `transition-transform`) on native components. Removed all `transition-*` styles from `Input.tsx`, `BottomTabBar.tsx`, `AttendanceToggle.tsx`, and `Card.tsx`.
    - Eliminated Supabase Realtime deprecation warning (`Realtime send() is automatically falling back to REST API`) by checking `channel.httpSend` in `ChatContext.tsx`.
  - **Keyboard Avoidance Across All Modals & Chat:**
    - Solved keyboard overlap and sticking issues by wrapping all native `<Modal>` contents with dedicated `<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>` and `<ScrollView keyboardShouldPersistTaps="handled">` across `teacher.tsx`, `AssignmentsModule.tsx`, and `community.tsx`.
    - Added dynamic `keyboardVerticalOffset` in `chat.tsx` based on `insets.top` so typing never obscures message inputs on iOS or Android.
  - **Attendance Simplification & Roll Number Container:**
    - Removed "Mark All Present" button from Teacher Attendance.
    - Added live attendance status counters (`24 Present • 3 Absent • 1 Late`).
    - Replaced fixed circle container with dynamic `min-w-[36px] h-8 px-1.5 rounded-xl` container formatting roll numbers (`#01`, `#02`, `#104`) with `numberOfLines={1}` so values never bleed or clip.
  - **Active Batch & Timing Focus Switcher:**
    - Added 3 realistic teacher batches (`Class 12 • JEE Advanced Morning`, `JEE Rankers Evening`, `Class 11 Foundation`) with timings and room info.
    - Added an active batch focus selector strip on the Teacher Desk to declutter data across roster, tests, and homework.
  - **In-App Interactive DPP / Quiz Form Builder:**
    - Created `InteractiveDppBuilderModal.tsx` allowing teachers to create forms like Google Forms inside Acadly (MCQ with A/B/C/D correct key selector, True/False, and Short Answer / Numerical questions with marks per question).
    - Integrated with `useAcademic` to publish interactive DPPs directly to the student portal.
  - **Teacher Profile & Searchable Student Directory with Fee Status:**
    - Redesigned Teacher Tab 5 (Profile & Settings) with teacher credential card, active batch schedule settings, and a searchable pupil directory.
    - Filter students by `All`, `Paid`, or `Pending ₹3,500`.
    - Student cards display roll numbers, attendance rate, rank, parent phone call button, one-tap fee status toggling, and quick navigation to 360° diagnostics (`/student-detail`).
  - **In-App PDF Opening Across Tabs:**
    - Integrated `DocumentReaderModal` across Teacher Desk (reviewing student homework submissions) and Community Library ("Read Document" opens in-app with offline reading and instant download).
  - TypeScript verification: `npx tsc --noEmit` passed with 0 errors.
