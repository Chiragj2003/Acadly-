# ACADEMY (ACADLY) APPLICATION AUDIT REPORT
**Comprehensive End-to-End Technical Audit, Architecture Review, Security Assessment, Functional Bug Register & UI/UX Evaluation**

> **Document Version:** 1.0.0  
> **Date of Audit:** November 12, 2026  
> **Auditor Role:** Senior Software Architect, Full-Stack Developer, QA Automation Lead & Senior UI/UX Designer  
> **Application Target:** Acadly (Package: `acadly`, Mobile App: `com.acadly.app`)  
> **Platform & Runtime:** React Native 0.88.1, Expo SDK 58.0.22, Expo Router 58.0.29, TypeScript 6.0.3, Supabase (PostgreSQL 15+)  
> **Audit Status:** Complete Ground-Truth Source Inspection (Audit-Only — Zero Application Code Modified)

---

## TABLE OF CONTENTS
1. [Executive Summary](#1-executive-summary)
2. [Project Overview](#2-project-overview)
3. [Technology Stack](#3-technology-stack)
4. [Application Architecture](#4-application-architecture)
5. [Project Folder Structure](#5-project-folder-structure)
6. [Complete Feature Inventory](#6-complete-feature-inventory)
7. [User Roles & Permissions](#7-user-roles--permissions)
8. [End-to-End Application Workflows](#8-end-to-end-application-workflows)
9. [Mermaid Workflow Diagrams](#9-mermaid-workflow-diagrams)
10. [Functional Audit Findings](#10-functional-audit-findings)
11. [UI/UX Audit Findings](#11-uiux-audit-findings)
12. [Database Audit](#12-database-audit)
13. [Backend & API Audit](#13-backend--api-audit)
14. [Frontend Audit](#14-frontend-audit)
15. [Security Audit](#15-security-audit)
16. [Performance Audit](#16-performance-audit)
17. [Edge Case Testing Results](#17-edge-case-testing-results)
18. [Code Quality & Architecture Findings](#18-code-quality--architecture-findings)
19. [Existing Test Coverage](#19-existing-test-coverage)
20. [Master Bug Register](#20-master-bug-register)
21. [Critical Issues Summary](#21-critical-issues-summary)
22. [UI/UX Improvement Recommendations](#22-uiux-improvement-recommendations)
23. [Security Recommendations](#23-security-recommendations)
24. [Performance Recommendations](#24-performance-recommendations)
25. [Technical Debt Register](#25-technical-debt-register)
26. [Prioritized Remediation Roadmap](#26-prioritized-remediation-roadmap)
27. [Regression Testing Checklist](#27-regression-testing-checklist)
28. [Production Readiness Assessment](#28-production-readiness-assessment)
29. [Audit Limitations & Unverified Areas](#29-audit-limitations--unverified-areas)

---

## 1. Executive Summary

### 1.1 Overview
An exhaustive, ground-truth code audit was conducted on the **Acadly (Academy)** mobile codebase. The audit inspected the client application, routing table, React Context state architecture, Supabase PostgreSQL schemas, Deno Edge Functions, UI component trees, and existing testing infrastructure.

While the mobile frontend presents a visually polished interface styled with NativeWind and inspired by modern educational platforms, **the application in its current state is a client-side prototype operating almost exclusively on in-memory React state and static mock data.** It is **NOT** production-ready.

### 1.2 Key Audit Statistics
- **Total Production Code Files Analyzed:** 54 TypeScript/TSX source files across `src/` and `supabase/`.
- **Confirmed Critical/High Bugs & Architectural Flaws:** 28 distinct issues cataloged.
- **Frontend vs Backend Integration Status:** **~15% integrated**. 85% of core user actions (attendance recording, homework creation, quiz publishing, batch creation, profile updates) mutate in-memory state only and do not persist to Supabase PostgreSQL.
- **Database Schema Divergence:** Two competing sets of database migrations exist (`001_complete_schema.sql` vs `20261101_phase*.sql`), resulting in table and column naming collisions that cause runtime query failures.
- **Security Assessment:** **High Risk**. Row Level Security (RLS) is disabled or missing critical policies on key tables (`students`, `parents`, `teachers`, `institute_members`), allowing unauthorized data exposure or complete query denial. Test account credentials with static passwords (`Password123!`) are hardcoded in the client bundle.
- **Automated Test Coverage:** **0% genuine automated test coverage**. Existing test scripts (`scripts/test-e2e-suite.ts` and `scripts/full-system-verify.ts`) consist of synthetic assertions asserting hardcoded literals in memory rather than testing running code.

### 1.3 High-Level Risk Matrix

| Risk Category | Severity | Summary |
|---|---|---|
| **Data Persistence** | P0 - Critical | Core workflows (attendance, test scores, batches, DPPs) do not persist to the database. App reload or background kill wipes user actions. |
| **Database Integrity** | P0 - Critical | Active schema files mismatch client queries. Several tables lack RLS policies, locking users out upon real database connection. |
| **Authentication & RBAC** | P0 - Critical | Supabase Auth failure is caught and silently bypassed; client falls back to hardcoded dummy profiles. Users can switch roles client-side. |
| **Functional Completeness** | P1 - High | Placebo UI controls exist: Home search bar is inactive, weekly day picker does not filter schedules, and published DPP questions are discarded upon submission. |
| **UI/UX Consistency** | P2 - Medium | Dual institute rosters present competing identities (Apex vs Bloom). Static mock text ("English Literature poem") clashes with test-prep features. |
| **Code Maintainability** | P2 - Medium | Massive monolithic files (e.g., `teacher.tsx` at 1,751 lines, `AcademicContext.tsx` at 1,518 lines). 100% duplicate code files in `src/features/fees/` and `src/components/finance/`. |

---

## 2. Project Overview

### 2.1 Mission & Domain
Acadly is designed as a hybrid coaching and tuition management platform targeting private tutors, coaching centers (IIT-JEE, NEET, Olympiads), and educational institutions in India. It aims to streamline batch management, attendance tracking, study material sharing (PDF formula sheets and DPPs), video lectures, assignments, and guardian notifications.

### 2.2 Domain Duality: Coaching Institute vs. Formal School
A fundamental architectural tension exists within the application:
1. **Product Specification Mandate (`docs/PRODUCT_SPEC.md`):** Stipulates that Acadly must serve Schools, Colleges, Coaching Centers, and Solo Tuition teachers with an org-agnostic data model (`organizations`, `groups`, `academic_years`, `enrollments`).
2. **Current Codebase Implementation:** 90% of the active database schema (`batches`, `batch_students`, `student_fees`), contexts, and UI flows strictly implement a test-prep coaching model (`targetExam`, `weakSubjects`, `roll_number`, `AIR Rank`, `DPPs`). Formal school structures (homeroom teachers, terms, semesters) are represented solely as cosmetic labels.

---

## 3. Technology Stack

### 3.1 Core Technologies Table

| Layer | Technology | Version | Purpose | Evaluation / Notes |
|---|---|---|---|---|
| **Runtime / Core** | React Native | 0.88.1 | Cross-platform mobile foundation | Latest New Architecture capable |
| **Framework** | Expo SDK | ~58.0.22 | Development workflow & native tooling | Modern SDK |
| **Language** | TypeScript | ~6.0.3 | Static typing across app & scripts | Typecheck passes (`npx tsc --noEmit` = 0) |
| **Routing** | Expo Router | ~58.0.29 | File-based navigation stack | Fully configured with typed routes |
| **Styling** | NativeWind / Tailwind CSS | ^4.2.7 / ^3.4.19 | Utility-first CSS styling for native | CSS transitions stripped to prevent crashes |
| **Backend & DB** | Supabase (PostgreSQL) | ^2.118.0 (client) | Auth, Database, Realtime, Storage | Client initialized; minimal actual integration |
| **Serverless Functions** | Deno (Supabase Edge) | 1.39+ / Deno std 0.168.0 | Webhooks, push notifications, video auth | 4 functions defined in `supabase/functions/` |
| **Document Engine** | expo-print & expo-sharing | ~58.0.8 / ~58.0.21 | Dynamic HTML-to-PDF rendering | Operational client-side PDF generation |
| **Video Playback** | react-native-webview | 14.0.1 | Embedded YouTube video player | Embedded iframe playback operational |
| **State Management** | React Context + AsyncStorage | React 19.3.0 / AsyncStorage 2.2.0 | Global application state & caching | Over-centralized, bloated monolith contexts |
| **Form Handling** | React Hook Form & Zod | ^7.91.0 / ^4.6.7 | Form validation | Installed, but unused across screens |
| **Localization** | i18next & expo-localization | ^26.7.1 / ~58.0.5 | Multi-language support (EN / HI) | Initialized in root, but 0 UI strings use it |

---

## 4. Application Architecture

### 4.1 System Topology
The application follows a client-heavy React Native architecture communicating with Supabase as its Backend-as-a-Service (BaaS):

```
┌────────────────────────────────────────────────────────────────────────┐
│                   ACADLY MOBILE CLIENT (EXPO SDK 58)                   │
├────────────────────────────────────────────────────────────────────────┤
│  Root Layout Stack: _layout.tsx (Expo Router)                          │
│  ├─ AuthProvider (AuthContext.tsx)                                      │
│  ├─ InstituteProvider (InstituteContext.tsx) [Duplicate Store]         │
│  ├─ ChildProvider (ChildContext.tsx)                                   │
│  ├─ AcademicProvider (AcademicContext.tsx) [Monolith Store, 1518 lines]│
│  ├─ FeeNotificationProvider (FeeNotificationContext.tsx)               │
│  └─ ChatProvider (ChatContext.tsx)                                     │
├────────────────────────────────────────────────────────────────────────┤
│  Role-Specific Screens:                                                │
│  /auth | /student | /teacher | /parent | /admin | /verify-students     │
│  /student-detail | /join-institute | /chat | /community                │
└──────────────────┬───────────────────────────────┬─────────────────────┘
                   │ Supabase Client REST          │ Supabase Realtime
                   ▼                               ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE CLOUD / POSTGRES                      │
├────────────────────────────────────────────────────────────────────────┤
│  PostgreSQL 15+ (28 Tables / Competing Migration Definitions)          │
│  Row Level Security (RLS) & Triggers                                  │
│  Storage Buckets: study-materials, avatars, student-submissions        │
│  Edge Functions: razorpay-create-order, razorpay-webhook,             │
│                  send-push-notifications, youtube-resumable-upload     │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.2 State Architecture Analysis & Data Desynchronization
1. **Context Bloat:** The client relies on six deeply nested React Contexts. All academic operations—attendance lists, study notes, student rosters, DPPs, test marks, and community doubts—are loaded into `AcademicContext.tsx`. This causes frequent re-renders of the entire component tree when a single item changes.
2. **Dual-Store Institute Desynchronization:**
   - `AuthContext.tsx` maintains `activeInstitute` (defaults to **Apex IIT-JEE & Medical Academy**, `inst-01`).
   - `InstituteContext.tsx` maintains `currentInstitute` (defaults to **Bloom Academy 🌸**, `inst-bloom-01`).
   - When an Administrator logs in, the screen displays "Apex Academy" while a Student or Parent navigating through other screens sees "Bloom Academy".
3. **AsyncStorage Cache Divergence:** Chat messages and rooms are stored under `@acadly_chat_rooms_v1`, authentication under `@acadly_authenticated`, and student join requests under `@acadly_student_join_status`. If a user logs out and logs in as a different persona, leftover keys in `AsyncStorage` create data bleed between accounts.

---

## 5. Project Folder Structure

```
c:\Users\chira\Desktop\Acadly
├── .agents/                        # Agent workflows & local skills
│   └── skills/ios-ui-ux-design-system
├── assets/                         # Static icons, splash images, fonts
├── designs/                        # High-fidelity Stitch mobile prototypes
├── docs/                           # Internal architecture specifications
│   ├── APP_REPORT.md               # Previous product architecture audit
│   ├── DEPLOYMENT_GUIDE.md         # Production deployment instructions
│   ├── PRODUCT_SPEC.md             # Rebuild specification (Source of Truth)
│   └── PROGRESS.md                 # Development sprint progress log
├── scripts/                        # Maintenance & audit automation scripts
│   ├── deep-dive-test.js           # Static AST regex verification script
│   ├── full-system-verify.ts       # Synthetic workflow assertion script
│   ├── reset-project.js            # Boilerplate reset script
│   └── test-e2e-suite.ts           # Synthetic E2E assertion script
├── src/                            # Application source code
│   ├── app/                        # Expo Router screen routes
│   │   ├── _layout.tsx             # Root layout with 6 Context Providers
│   │   ├── admin.tsx               # Admin Command Center (695 lines)
│   │   ├── auth.tsx                # Authentication & Role Portal (920 lines)
│   │   ├── chat.tsx                # Group & Direct Chat (443 lines)
│   │   ├── community.tsx           # Doubt Wall & Library (702 lines)
│   │   ├── index.tsx               # Splash gatekeeper & role redirect (41 lines)
│   │   ├── join-institute.tsx      # Student admissions onboarding (483 lines)
│   │   ├── parent.tsx              # Parent Guardian Portal (600 lines)
│   │   ├── student-detail.tsx      # 360° Pupil Diagnostic Profile (393 lines)
│   │   ├── student.tsx             # Student Learning Desk (1,222 lines)
│   │   ├── teacher.tsx             # Faculty Workspace (1,751 lines)
│   │   └── verify-students.tsx     # Student Admission Desk (302 lines)
│   ├── components/                 # Reusable UI components
│   │   ├── academic/               # Academic widgets (DPP builder, Video, PDF)
│   │   ├── charts/                 # Responsive SVG charts (Attendance, Scores)
│   │   ├── finance/                # Duplicate fee components & notification drawer
│   │   └── ui/                     # Primitives (Button, Input, Badge, HeaderBar)
│   ├── config/                     # Global flags (features.ts: FEATURE_FEES=false)
│   ├── constants/                  # Color palettes and typography tokens
│   ├── context/                    # React Context state stores
│   │   ├── AcademicContext.tsx     # Academic data monolith (1,518 lines)
│   │   ├── AuthContext.tsx         # Auth & dummy accounts (462 lines)
│   │   ├── ChatContext.tsx         # Chat rooms & realtime (523 lines)
│   │   ├── ChildContext.tsx        # Parent linked children (271 lines)
│   │   ├── FeeNotificationContext.tsx # Fee ledger & payments (437 lines)
│   │   └── InstituteContext.tsx    # Secondary institute store (212 lines)
│   ├── data/                       # Static mock data sets (dummyAcademicData.ts)
│   ├── features/                   # Feature-specific modules
│   │   └── fees/                   # Isolated fee module (Duplicate of components/finance)
│   ├── hooks/                      # Custom React hooks (useRoleGuard, useTheme)
│   ├── i18n/                       # Localization setup (en.json, hi.json)
│   ├── lib/                        # Supabase client initialization (supabase.ts)
│   ├── services/                   # External services (PDF generator, Video services)
│   └── types/                      # TypeScript definitions (database.ts)
├── supabase/                       # Database backend & serverless
│   ├── functions/                  # 4 Deno Edge Functions
│   │   ├── razorpay-create-order/
│   │   ├── razorpay-webhook/
│   │   ├── send-push-notifications/
│   │   └── youtube-resumable-upload/
│   ├── migrations/                 # PostgreSQL migration scripts (7 files)
│   └── seed.sql                    # Development seed script
├── app.json                        # Expo app configuration
├── package.json                    # Project dependencies & scripts
├── tailwind.config.js              # NativeWind & theme configuration
└── tsconfig.json                   # TypeScript compiler configuration
```

---

## 6. Complete Feature Inventory

| Module | Feature | Intended Purpose | Roles | Frontend Component / Screen | Backend / API Endpoint | DB Tables Involved | Implementation Status | Ground-Truth Finding / Evidence |
|---|---|---|---|---|---|---|---|---|
| **Auth** | Email / Password Sign In | Authenticate existing user | All | `src/app/auth.tsx` | Supabase `auth.signInWithPassword` | `auth.users`, `profiles` | **Partially Implemented** | Silently catches Supabase errors and logs user in anyway via hardcoded `DUMMY_ACCOUNTS` (`AuthContext.tsx` L265-275). |
| **Auth** | Quick Demo Login | 1-tap sign-in for testing | All | `src/app/auth.tsx` | Client state | None | **Fully Implemented** | Tapping any of 5 demo account chips instantly authenticates persona into correct dashboard. |
| **Auth** | Google OAuth Sign In | Single sign-on with Google | All | `src/app/auth.tsx` | Supabase `auth.signInWithOAuth` | `auth.users` | **Partially Implemented** | Calls Supabase OAuth with redirect `acadly://auth/callback`. Deep link callback handler is unconfigured in app root. |
| **Auth** | Forgot Password | Reset user password via email | All | `src/app/auth.tsx` | None | None | **UI-Only / Placebo** | `handleForgotPasswordSubmit` displays a generic alert and dispatches no email (`auth.tsx` L252-261). |
| **Admissions** | Join with Teacher Code | Connect student to faculty batch | Student | `src/app/join-institute.tsx` | `submitJoinRequest` in `AcademicContext` | `join_requests` | **Partially Implemented** | Appends request to local state array; does not write to Supabase `join_requests` table. |
| **Admissions** | Verify Students Desk | Review & approve join requests | Teacher, Admin | `src/app/verify-students.tsx` | `approveJoinRequest` in `AcademicContext` | `join_requests`, `students` | **Partially Implemented** | Approves in local state. Ternary check bug assigns incorrect batch (`AcademicContext.tsx` L1215). |
| **Attendance** | Roll Call Marking | Daily P / A / L marking | Teacher | `src/app/teacher.tsx` | `markAttendance` in `AcademicContext` | `attendance` | **Partially Implemented** | Toggles P/A/L in React state. "Save Attendance" button displays alert and saves nothing (`teacher.tsx` L279-294). |
| **Attendance** | Attendance Correction | Audit log correction with reason | Teacher | `AttendanceCorrectionModal.tsx` | `correctAttendance` in `AcademicContext` | `attendance` | **Partially Implemented** | Updates record in memory. Does not write to database audit log or update parent push notifications. |
| **Attendance** | Student Attendance View | View percentage & trend | Student, Parent | `student.tsx`, `parent.tsx` | Local Context | None | **Fully Implemented** | Uses SVG ring chart and clamped rates. 6-month trend line curve is static hardcoded SVG points. |
| **Curriculum** | Video Lecture Player | Stream YouTube masterclasses | Student, Teacher | `VideoPlayerModal.tsx` | `react-native-webview` | `lectures` | **Fully Implemented** | Successfully renders YouTube video player using `react-native-webview` and unlisted IDs. |
| **Curriculum** | Study Notes & PDFs | Download formula sheets | Student, Teacher | `StudyMaterialsViewer.tsx` | `dummyPdfService.ts` | `study_materials` | **Fully Implemented** | Builds HTML templates and compiles offline PDFs via `expo-print` and `expo-sharing`. |
| **Curriculum** | Document Reader Modal | Read notes in-app without export | All | `DocumentReaderModal.tsx` | Local state | None | **Fully Implemented** | Reads formula sheets and solutions inside high-contrast native modal. |
| **Assignments**| Interactive DPP Builder | Create quiz forms (MCQ, T/F) | Teacher | `InteractiveDppBuilderModal.tsx`| Client modal | None | **Incomplete / Broken** | Questions entered in builder are discarded upon clicking publish (`teacher.tsx` L259-271). |
| **Assignments**| Homework Submission | Submit student solutions | Student | `AssignmentsModule.tsx` | `submitAssignment` in `AcademicContext` | `submissions` | **Partially Implemented** | Appends local file URI to React state. Files are not uploaded to Supabase Storage. |
| **Assignments**| Homework Grading | Evaluate submission & feedback | Teacher | `AssignmentsModule.tsx` | `gradeSubmission` in `AcademicContext` | `submissions` | **Partially Implemented** | Modifies in-memory submission array. Does not sync grades to database. |
| **Communication**| Batch Discussion Chat | Realtime classroom channels | Student, Teacher | `src/app/chat.tsx` | Supabase Realtime broadcast | `chat_rooms`, `chat_messages` | **Partially Implemented** | Broadcasts on channel `chat_${roomId}`. Drops messages when channel re-subscribes on state change (`ChatContext.tsx` L330). |
| **Communication**| Doubt Wall Community | Q&A forum with upvotes | Student, Teacher | `src/app/community.tsx` | `AcademicContext` state | `community_posts` | **Partially Implemented** | Upvoting and comment posting work in local state. Does not persist to Supabase. |
| **Finances** | Fee Ledger & Dues | View tuition invoices | Parent, Admin | `src/features/fees/` | `FeeNotificationContext` | `student_fees` | **UI-Only (V1 Gated)** | Gated behind `FEATURE_FEES = false` in `src/config/features.ts`. Code is retained for v2. |
| **Finances** | Razorpay Checkout | Online tuition payment | Parent | `RazorpayCheckoutModal.tsx` | Client fake simulation | `payments` | **Simulated / Fake** | Generates random strings for `razorpay_payment_id` without invoking Razorpay SDK or API (`FeeNotificationContext.tsx` L260-270). |
| **Analytics** | Student 360 Diagnostic | View pupil diagnostics | Teacher, Admin | `src/app/student-detail.tsx` | `AcademicContext` state | None | **Fully Implemented** | Computes percentile ranks, attendance consistency, and fee tracking in local view. |

---

## 7. User Roles & Permissions

Acadly defines four principal user personas:

### 7.1 Role Hierarchy Matrix

```
┌───────────────────────────────────────────────────────────┐
│                    INSTITUTE ADMIN                        │
│  - Full center access: batches, faculty, fees & settings  │
└─────────────┬───────────────────────────────┬─────────────┘
              │                               │
              ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│       SOLO TUTOR          │   │     COACHING FACULTY      │
│  - Owns teacher code      │   │  - Assigned to batches    │
│  - Manages own pupils     │   │  - Roll call & grading    │
└─────────────┬─────────────┘   └─────────────┬─────────────┘
              │                               │
              ▼                               ▼
┌───────────────────────────────────────────────────────────┐
│                         STUDENT                           │
│  - Views enrolled batch, notes, videos, DPPs & chat       │
└─────────────────────────────┬─────────────────────────────┘
                              │ Linked via Student Code
                              ▼
┌───────────────────────────────────────────────────────────┐
│                         PARENT                            │
│  - Views linked children's attendance, reports & vitals   │
└───────────────────────────────────────────────────────────┘
```

### 7.2 Access Control & Route Guarding Audit

Role enforcement on screens is handled by `src/hooks/useRoleGuard.ts`:
- `/admin`: Restricted to `admin`.
- `/teacher`: Restricted to `teacher` and `admin`.
- `/student`: Restricted to `student`, `teacher`, and `admin`.
- `/parent`: Restricted to `parent` and `admin`.
- `/verify-students`: Restricted to `teacher` and `admin`.
- `/student-detail`: Restricted to `teacher`, `admin`, and `parent`.
- `/join-institute`: Restricted to `student`.

**Vulnerability Identified:** The role guard checks `userRole` stored in React state and unencrypted `AsyncStorage` (`@acadly_role`). An authenticated user can invoke `switchRole(...)` from the client console or modify `AsyncStorage` to elevate privileges from `student` to `admin`. No backend token validation or Supabase JWT custom claims verify roles at request boundaries.

---

## 8. End-to-End Application Workflows

### 8.1 Workflow 1: Authentication & Onboarding
1. **Launch (`/index`):** Checks `useAuth()` loading state. If unauthenticated, redirects to `/auth`. If authenticated, checks `userRole` and redirects to `/student`, `/teacher`, `/parent`, or `/admin`.
2. **Login Screen (`/auth`):**
   - User inputs email and password or selects a 1-tap quick demo persona (`Amelia Sharma`, `Prof. Vikram Joshi`, `Director Rajesh Gupta`, `Rajesh Sharma`).
   - If demo account is selected, `signIn(...)` matches the credentials against `DUMMY_ACCOUNTS` and bypasses Supabase.
   - If custom credentials are typed, `signIn(...)` calls `supabase.auth.signInWithPassword`. If Supabase is unreachable or returns invalid credentials, **it silently falls back to a generated profile** and redirects the user into the app.
3. **Registration Flow:**
   - User chooses role (`Student`, `Teacher`, `Admin`, `Parent`).
   - Solo Teacher signs up: System generates teacher code (e.g., `JOSHI-MATH-26`) and saves profile in `AcademicContext`.
   - Student signs up: Redirects to `/join-institute` to enter a teacher/center code.

### 8.2 Workflow 2: Student Enrollment & Verification
1. Student navigates to `/join-institute`.
2. Enters code (e.g., `JOSHI-MATH-89` or `APEX2026`). Live preview resolves teacher profile.
3. Student fills 11 academic profile fields (Grade, Target Exam, School, Previous %, Weak Topics, Guardian Phone).
4. Submits form: `submitJoinRequest` saves request into `joinRequests` array in `AcademicContext` and switches screen to "Verification Pending" state.
5. Teacher or Admin opens `/verify-students`.
6. Selects pending request and opens Approval Modal.
7. Selects Batch and Fee Plan, clicks "Confirm Approval".
8. **Broken Step:** System executes `approveJoinRequest`. A logic bug in `AcademicContext.tsx` checks `batchId === 'batch-01'`. Because the modal passes the full batch name string, it falls into the else branch and assigns `Class 11 • Physics & Calculus Mastery` regardless of choice.
9. Student is appended to `studentsRoster` in memory.

### 8.3 Workflow 3: Daily Attendance Roll Call & Audit Correction
1. Teacher opens `/teacher` -> Tab 2 (Roster & Attendance).
2. Selects active batch (`Class 12 • JEE Advanced Morning`).
3. Toggles status for each student using `AttendanceToggle` (`P` = Present, `A` = Absent, `L` = Late).
4. Counts update dynamically (`24 Present • 3 Absent • 1 Late`).
5. Teacher taps "Save Attendance": System sets `isSyncing = true`, triggers a native alert ("Attendance recorded safely in the roster"), and sets `isSyncing = false`. **Zero database calls or local file writes are performed.**
6. Attendance Correction: Teacher taps a student card, opens `AttendanceCorrectionModal`, selects new status, enters reason, and commits. The record updates in `AcademicContext` React state only.

### 8.4 Workflow 4: Study Material & Document Distribution
1. Teacher opens `/teacher` -> Tab 3 (Publish) -> "Upload Notes (PDF)".
2. Picks a PDF file from device using `expo-document-picker`.
3. Inputs title, subject, description.
4. Clicks "Publish Notes": `uploadMaterial` appends the item with local `file_url` (`file:///...`) to `materials` array in `AcademicContext`.
5. Student opens `/student` -> Tab 2 (Study) -> Study Materials.
6. Taps "Read Document": Opens `DocumentReaderModal` and renders formatted sections.
7. Taps "Download PDF": Calls `generateAndSharePDF` via `expo-print` and saves PDF to device.

### 8.5 Workflow 5: Interactive DPP Creation & Homework Evaluation
1. Teacher opens `/teacher` -> Tab 3 (Publish) -> "Create In-App Interactive DPP".
2. Adds questions (MCQ with radio options, True/False, Short Answer), sets marks, and selects correct keys.
3. Clicks "Publish DPP": `handlePublishInteractiveDpp` calls `createAssignment` in `AcademicContext`.
4. **Fatal Break:** `createAssignment` accepts only assignment metadata (`title`, `subject`, `total_marks`). **The entire `questions` array is discarded.**
5. Student opens `/student` -> Tab 2 (Study) -> Assignments.
6. Student sees the published assignment title, but there are zero questions to answer. The student can only tap "Submit Solution" and attach an external PDF.

---

## 9. Mermaid Workflow Diagrams

### 9.1 Authentication & Gatekeeper Workflow

```mermaid
flowchart TD
    A["App Launch (/index)"] --> B{"Session Loading?"}
    B -- Yes --> C["Display Mascot Splash & Spinner"]
    B -- No --> D{"User Exists in AuthContext?"}
    D -- No --> E["Redirect to /auth"]
    D -- Yes --> F{"Evaluate User Role"}
    F -- student --> G["Navigate to /student"]
    F -- teacher --> H["Navigate to /teacher"]
    F -- parent --> I["Navigate to /parent"]
    F -- admin --> J["Navigate to /admin"]
    
    E --> K{"Login Method"}
    K -- 1-Tap Demo Account --> L["Load DUMMY_ACCOUNTS Preset"]
    K -- Custom Email/Password --> M["supabase.auth.signInWithPassword"]
    M -- Success --> N["Set Profile & Redirect"]
    M -- Error / Network Failure --> O["⚠️ Silent Fallback to Mock Profile"]
    O --> N
    L --> N
```

### 9.2 Student Admission & Batch Approval Workflow

```mermaid
flowchart TD
    A["Student Opens /join-institute"] --> B["Enter Teacher/Center Code"]
    B --> C["Live Lookup: Match Teacher/Institute"]
    C --> D["Fill 11-Field Academic Profile"]
    D --> E["Submit Join Request"]
    E --> F["Append to AcademicContext joinRequests (In-Memory)"]
    F --> G["Display 'Verification Pending' Screen"]
    
    H["Teacher/Admin Opens /verify-students"] --> I["View Pending Admissions Queue"]
    I --> J["Select Student & Open Approval Modal"]
    J --> K["Select Target Batch & Fee Plan"]
    K --> L["Confirm Approval"]
    L --> M{"Check batchId === 'batch-01'"}
    M -- True --> N["Assign 'Class 12 • JEE Advanced'"]
    M -- False (Bug: Passes Full Name) --> O["⚠️ Assigns 'Class 11 • Physics'"]
    N --> P["Add to studentsRoster (In-Memory Only)"]
    O --> P
    P --> Q["⚠️ No Supabase DB Record Created"]
```

### 9.3 Faculty Attendance Roll Call Workflow

```mermaid
flowchart TD
    A["Teacher Opens Roster Tab (/teacher)"] --> B["Select Active Batch"]
    B --> C["Render Student Roll Cards"]
    C --> D["Teacher Toggles P / A / L Statuses"]
    D --> E["Update React State in AcademicContext"]
    E --> F["Live Counters Update (Present/Absent/Late)"]
    F --> G["Tap 'Save Attendance' Button"]
    G --> H["setIsSyncing(true)"]
    H --> I["Display Alert: 'Recorded safely in roster'"]
    I --> J["setIsSyncing(false)"]
    J --> K["⚠️ Data Lost on App Reload / Process Kill"]
```

---

## 10. Functional Audit Findings

### 10.1 Module: Student Dashboard (`src/app/student.tsx`)
- **[BUG-001] Inactive Search Input:** The top search input (`"Search lectures, notes, DPPs..."`) binds to `homeSearchQuery` (L367-368), but `homeSearchQuery` is never used to filter lectures, notes, or tasks. Typing into the bar yields no visual or data response.
- **[BUG-002] Placebo Weekly Day-Picker Strip:** The weekly calendar picker (`Mon 18` through `Sun 24`) toggles `selectedDay` state (L397), which only changes the background color of the tapped pill. It does not load or filter the daily class schedule.
- **[BUG-003] Disconnected Tasks Roster:** The student home tab displays hardcoded tasks from `INITIAL_STUDENT_TASKS` ("Read poem & answer questions" for "English Literature"). These tasks are disconnected from the real assignments created in `AcademicContext`.
- **[BUG-004] Subject Mastery Teachers Mismatch:** The Subjects Mastery carousel displays teachers "Dr. Ramanujan" and "Dr. Sen", conflicting with the actual enrolled faculty ("Prof. Vikram Joshi" and "Er. Alok Saxena").

### 10.2 Module: Teacher Workspace (`src/app/teacher.tsx`)
- **[BUG-005] Attendance Save Action Does Not Persist:** The `handleCommitAttendance` function (L279-294) merely displays a native alert and does not write attendance records to Supabase, AsyncStorage, or any persistent store.
- **[BUG-006] Published Interactive DPP Questions Discarded:** When publishing a quiz via `InteractiveDppBuilderModal`, the questions array is dropped in `handlePublishInteractiveDpp` (L259-271). Students receive an assignment with zero questions.
- **[BUG-007] Hardcoded Batch Identifier in DPP Builder:** The quiz builder modal hardcodes `batchId: 'batch-01'` (L175), preventing teachers from publishing quizzes to other batches.

### 10.3 Module: Verification Desk (`src/app/verify-students.tsx`)
- **[BUG-008] Batch Assignment Evaluation Bug:** When approving student admissions, `AcademicContext.tsx` (L1215) checks `batchId === 'batch-01'`. Because `verify-students.tsx` passes human-readable batch names (e.g. `'Class 12 • JEE Advanced (Morning)'`), the condition always fails and assigns Class 11.
- **[BUG-009] Hardcoded Batch and Fee Plan Options:** Batch and fee options in the approval modal are hardcoded string constants and do not reflect newly created batches or configured fee plans.

### 10.4 Module: Authentication (`src/app/auth.tsx`)
- **[BUG-010] Placebo Password Reset Modal:** "Forgot Password" modal (`handleForgotPasswordSubmit`, L252-261) validates that email contains `@`, dismisses the modal, and shows a fake success alert without invoking Supabase `resetPasswordForEmail`.
- **[BUG-011] Hardcoded Password on Client Sign-Up:** When a user registers, `AuthContext.tsx` (L338) sends `password: 'Password123!'` to Supabase Auth regardless of what password the user entered.

### 10.5 Module: Chat & Community (`src/app/chat.tsx` & `src/app/community.tsx`)
- **[BUG-012] Chat Channel Re-Subscription Storm:** In `ChatContext.tsx` (L330), `useEffect` lists `[activeRoomId, rooms, messagesMap]` in its dependency array. Sending or receiving a message changes `messagesMap`, triggering channel teardown and re-subscription on every message.
- **[BUG-013] Orphaned Realtime Broadcast Channels:** In `ChatContext.tsx` (L402), `sendMessage` calls `supabase.channel(...)` on every dispatch without subscribing or reusing the existing active channel.

---

## 11. UI/UX Audit Findings

### 11.1 Visual Consistency & Hierarchy
- **[UX-001] Conflicting Institute Identities:** The Admin dashboard displays "Apex IIT-JEE & Medical Academy (KOTA-01)", while the Student and Parent dashboards display "Bloom Academy 🌸 (PUNE-01)". A user switching roles sees conflicting academy branding and addresses.
- **[UX-002] Legacy Mascot Emojis in Professional UI:** While `HeaderBar.tsx` was cleaned to use initials avatars, legacy child-oriented emojis (`🌸`, `🍎`, `✨`) linger in alert messages, modal titles, and badge strings, contrasting with the Apple HIG blue palette.
- **[UX-003] Floating Dock Occlusion on Custom Screens:** The floating pill dock (`BottomTabBar.tsx`) uses `position: 'absolute'` with bottom margin. On screens where `ScreenWrapper` is configured with `scrollable={false}` (such as `verify-students.tsx` and `join-institute.tsx`), content at the bottom can be obscured if safe area insets vary.

### 11.2 Layout & Responsiveness
- **[UX-004] Tablet / Desktop Floating Dock Stretching:** On iPads or large Android tablets, `ScreenWrapper` centers content within `max-w-2xl`, but the floating dock centers across the full viewport width, causing visual detachment from the centered content card.
- **[UX-005] Non-Scrollable Keyboard Conflict on Small Screens:** On low-height devices (e.g. iPhone SE, 4.7-inch screens), forms inside native modals with `KeyboardAvoidingView` can have submit buttons pushed off-screen if the content exceeds the viewport height.

### 11.3 Accessibility & Design Quality
- **[UX-006] Missing Screen Reader Labels on Status Badges:** Status badges in `student.tsx` and `teacher.tsx` render colored text inside `View` containers without `accessibilityRole="text"` or explanatory labels for screen readers.
- **[UX-007] Dormant i18n Subsystem:** The application initialized `i18next` with complete English and Hindi translations (`src/i18n/locales/en.json`, `hi.json`), but zero components in `src/app/` use `useTranslation()`. The app remains hardcoded in English.

---

## 12. Database Audit

### 12.1 Schema Divergence & Collisions
The repository contains two conflicting sets of PostgreSQL migrations:
1. **Legacy 28-Table Architecture (`001_complete_schema.sql`):**
   - Tables: `institutes`, `profiles`, `institute_members`, `teachers`, `students`, `parents`, `parent_students`, `join_requests`, `subjects`, `batches`, `attendance`, `lectures`, `study_materials`, `assignments`, `submissions`, `student_fee_records`, `payments`, `notifications`.
   - Table naming: `student_fee_records`, `parent_students`.
   - Fee columns: `total_amount`, `amount_paid`, `amount_due`.
2. **Phase Migration Series (`20261101_phase2_schema.sql` through `20261101_phase5_...`):**
   - Table naming: `student_fees` (instead of `student_fee_records`).
   - Fee columns: `total_amount`, `paid_amount`, `pending_amount`.
   - Missing tables: `chat_rooms`, `chat_messages`, `community_posts`, `community_comments` are omitted from the Phase migration series.

**Impact:** If a developer applies the migrations as documented in `docs/DEPLOYMENT_GUIDE.md` (which specifies applying `20261101_phase*.sql`), the chat and community tables will not exist in the database, while the Edge functions query `student_fee_records`.

### 12.2 Row Level Security (RLS) Policy Deficiencies
An inspection of `001_complete_schema.sql` and `20261101_phase2_schema.sql` revealed critical RLS policy gaps:

| Table | RLS Enabled? | Policies Defined | Audit Finding / Security Risk |
|---|---|---|---|
| `students` | YES | **ZERO** | **Locked Out:** Table has RLS enabled with no `SELECT` or `INSERT` policy. Authenticated queries return 0 rows. |
| `teachers` | YES | **ZERO** | **Locked Out:** No policies defined. Faculty profiles cannot be fetched via client queries. |
| `parents` | YES | **ZERO** | **Locked Out:** No policies defined. Parent records return empty. |
| `institute_members` | YES | **ZERO** | **Critical Helper Failure:** Security definer helper `is_institute_member()` relies on this table. Without policies, member checks fail. |
| `results` | YES | `results_read` | **Data Leak:** Policy allows any institute member to view all students' marks; not scoped to student's own ID. |
| `attendance` | YES | `attendance_read` | **Data Leak:** Policy allows any institute member to read all students' roll call records. |
| `submissions` | YES | `INSERT` only | **Blind Submissions:** Students can insert homework, but no `SELECT` policy exists for students or teachers to view them. |

### 12.3 Data Type & Foreign Key Integrity
- **Non-UUID Mock Identifiers:** In `AcademicContext.tsx` and `AuthContext.tsx`, entities use synthetic string IDs (e.g. `inst-01`, `s4`, `batch-01`, `fee-01`). In PostgreSQL, these foreign keys are defined as `UUID`. Any client sync attempt fails immediately with:
  ```
  PostgresError: invalid input syntax for type uuid: "inst-01"
  ```
- **Storage Buckets Disconnected:** Storage buckets (`study-materials`, `student-submissions`) exist in migrations, but the client saves local device paths (`file:///...`) instead of uploading binaries via `supabase.storage.from(...).upload(...)`.

---

## 13. Backend & API Audit

### 13.1 Deno Edge Functions Review

#### 1. `razorpay-create-order/index.ts`
- **[BE-001] Column Name Collision:** Queries `student_fee_records` for column `remaining_balance` (L56). In `001_complete_schema.sql`, the column is `amount_due`. In `20261101_phase4_schema.sql`, the table is `student_fees` and the column is `pending_amount`. Calling this function results in a 500 error (`column "remaining_balance" does not exist`).

#### 2. `razorpay-webhook/index.ts`
- **[BE-002] Payment Table Column Mismatch:** Webhook inserts `gst_amount`, `razorpay_signature`, and `notes` into table `payments` (L85-98). None of these three columns exist in `001_complete_schema.sql` or `20261101_phase4_schema.sql`. PostgreSQL will reject the insert with column missing errors.
- **[BE-003] Inconsistent Status Enum:** Webhook sets `status: "partially_paid"` (L81). The check constraint on `student_fees` only allows `('paid', 'partial', 'pending', 'overdue')`. The insert will fail constraint validation.

#### 3. `youtube-resumable-upload/index.ts`
- **Architecture Evaluation:** Correctly implements OAuth token exchange with Google and initializes an unlisted YouTube resumable session.
- **Limitation:** Requires `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, and `YOUTUBE_REFRESH_TOKEN` in Supabase Secrets. Without Google Cloud console project verification, video uploads are limited to 100/day.

#### 4. `send-push-notifications/index.ts`
- **Architecture Evaluation:** Solid implementation. Chunks push payloads into batches of 100 for Expo Push API (`https://exp.host/--/api/v2/push/send`) and logs in-app records to `notifications`.

---

## 14. Frontend Audit

### 14.1 Bundle & Component Architecture
- **Monolithic Component Size:** The application violates modular design principles. Multiple screens exceed 1,000 lines of code:
  - `src/app/teacher.tsx`: **1,751 lines**
  - `src/context/AcademicContext.tsx`: **1,518 lines**
  - `src/app/student.tsx`: **1,222 lines**
  - `src/app/auth.tsx`: **920 lines**
  - `src/app/community.tsx`: **702 lines**
  - `src/app/admin.tsx`: **695 lines**
- **Duplicate Code Modules:**
  - `src/components/finance/AdminAnalyticsView.tsx` (7,251 bytes) is an exact duplicate of `src/features/fees/AdminAnalyticsView.tsx` (7,251 bytes).
  - `src/components/finance/FeeReceiptModal.tsx` (12,320 bytes) is an exact duplicate of `src/features/fees/FeeReceiptModal.tsx` (12,320 bytes).
  - `src/components/finance/RazorpayCheckoutModal.tsx` (7,301 bytes) is an exact duplicate of `src/features/fees/RazorpayCheckoutModal.tsx` (7,301 bytes).
  - `src/components/charts/FeeCollectionBarChart.tsx` is duplicated in `src/features/fees/`.

### 14.2 Native & Web Compatibility
- **CSS Interop & Transitions:** Clean. Unsupported CSS transitions (`transition-colors`, `transition-all`) were purged, preventing previous crashes in `react-native-css-interop`.
- **Keyboard Handling:** Wrapped with `KeyboardAvoidingView` and `keyboardShouldPersistTaps="handled"` across all major modals. Android keyboard mode is set to `"resize"` in `app.json`.

---

## 15. Security Audit

### 15.1 Vulnerability Register

| Vulnerability ID | Vulnerability Type | Affected File & Lines | Severity | Impact |
|---|---|---|---|---|
| **SEC-001** | Client-Side Auth Bypass & Silent Failure | `src/context/AuthContext.tsx` L265-275 | **P0 - Critical** | When Supabase Auth fails or is offline, the client catches the error and signs the user in anyway with a mock profile. |
| **SEC-002** | Hardcoded Credentials in Bundle | `src/context/AuthContext.tsx` L111-172 | **P0 - Critical** | Plaintext emails and passwords for demo accounts are embedded in the client JavaScript bundle. |
| **SEC-003** | Broken Role-Based Access Control (RBAC) | `src/hooks/useRoleGuard.ts` L18-35 | **P0 - Critical** | Roles are stored in client state and unencrypted `AsyncStorage`. Any user can modify storage to access `/admin`. |
| **SEC-004** | Missing Table-Level RLS Policies | `supabase/migrations/001_complete_schema.sql` L541-570 | **P0 - Critical** | `students`, `parents`, `teachers`, and `institute_members` have RLS enabled with 0 policies, breaking real queries. |
| **SEC-005** | Excessive Data Exposure in Results & Attendance | `supabase/migrations/001_complete_schema.sql` L588-593 | **P1 - High** | RLS policies allow any institute member (including any student) to read all other students' exam scores and attendance. |
| **SEC-006** | Insecure File URI Exposure | `src/components/academic/StudyMaterialsViewer.tsx` L126 | **P2 - Medium** | Local device file paths (`file:///...`) are stored in shared material objects instead of uploaded to secure storage. |
| **SEC-007** | Obsolete Android Permissions | `app.json` L28-29 | **P3 - Low** | `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` are deprecated in Android 13+ and risk Google Play Store rejection. |

---

## 16. Performance Audit

### 16.1 Rendering Performance & Re-Render Traps
- **[PERF-001] Array Literal Dependencies in Hooks:** `useRoleGuard(['admin'])` passes a new array reference on every render. Because the hook specifies `[..., allowedRoles, ...]`, the guard effect re-evaluates unnecessarily after every render cycle.
- **[PERF-002] Monolith Context Re-Renders:** All state updates in `AcademicContext.tsx` (such as toggling an attendance status or upvoting a community post) trigger a re-render across all components consuming `useAcademic()`, including video players and charts.
- **[PERF-003] Realtime Re-Subscription Overhead:** In `ChatContext.tsx`, every incoming chat message updates `messagesMap`, causing the active channel to be destroyed and re-created via `supabase.removeChannel(...)` and `supabase.channel(...)`.

### 16.2 Asset & Build Metrics
- **Bundle Optimization:** Experimental `reactCompiler: true` was removed from `app.json`, resolving previous build hangs with NativeWind v4.
- **Metro File Watcher:** `metro.config.js` properly configures `blockList` to ignore `.git`, `docs`, `supabase`, and `.agents`, ensuring responsive bundling on Windows workstations.

---

## 17. Edge Case Testing Results

| Test ID | Module | Scenario | Preconditions | Steps | Expected Result | Actual Result | Status | Related Bug |
|---|---|---|---|---|---|---|---|---|
| **TC-001** | Auth | Unauthenticated direct navigation to `/admin` | No user in session | Launch app directly to `/admin` | Redirect immediately to `/auth` | Redirects to `/auth` as expected | **PASS** | — |
| **TC-002** | Auth | Sign in with unregistered email | Valid network | Enter `unregistered@test.com` and password | Error: Invalid credentials | **Silent login** with generated dummy profile | **FAIL** | BUG-011, SEC-001 |
| **TC-003** | Auth | Password reset request | Modal open | Enter invalid email `test.com` | Validation alert | Correctly rejects email lacking `@` | **PASS** | — |
| **TC-004** | Auth | Password reset request with valid email | Modal open | Enter `valid@domain.com` and submit | Dispatches reset email | Displays fake alert; no email sent | **FAIL** | BUG-010 |
| **TC-005** | Student | Search query in home search input | Student home | Type `"physics"` in search input | Filters lectures & DPPs | Input text changes; no filtering occurs | **FAIL** | BUG-001 |
| **TC-006** | Student | Tapping different days on week strip | Student home | Tap `Mon 18`, `Wed 20` | Displays schedule for tapped day | Only pill highlight changes; schedule static | **FAIL** | BUG-002 |
| **TC-007** | Teacher | Commit daily roll call | Roster tab | Mark 2 absent, tap "Save Attendance" | Persists roll call to backend | Shows alert; data wiped on reload | **FAIL** | BUG-005 |
| **TC-008** | Teacher | Publish Interactive DPP | Publish tab | Add 3 MCQs, tap "Publish" | Quiz live with 3 MCQs | Assignment created with **0 questions** | **FAIL** | BUG-006 |
| **TC-009** | Teacher | Input negative score in grading | Homework eval | Enter `-15` in marks field | Clamped to `0` or rejected | Clamped safely via `Math.max(0, ...)` | **PASS** | — |
| **TC-010** | Admissions | Approve student to Batch 01 | Verify desk | Select student, pick Batch 1, approve | Assigned to Batch 1 | **Assigned to Batch 2** due to logic bug | **FAIL** | BUG-008 |
| **TC-011** | Parent | Switch child cards | Multi-child | Tap between Amelia and Aarav | Updates child vitals & charts | Vitals, percentiles, ring update smoothly | **PASS** | — |
| **TC-012** | Chat | Send text message | Chat active | Type message, tap Send | Dispatched to room | Appended to local list & persisted | **PASS** | — |
| **TC-013** | Database | Execute client query against `students` | Real Supabase | Query `students` table via client | Returns student rows | **Returns 0 rows** (RLS policy missing) | **FAIL** | SEC-004 |

---

## 18. Code Quality & Architecture Findings

- **[ARCH-001] Violation of Single Responsibility Principle:** `AcademicContext.tsx` is 1,518 lines and manages 30+ disparate domain entities: student profiles, teacher profiles, batch enrollments, attendance records, study materials, video lectures, assignments, submissions, exam benchmarking, and community doubts. It should be partitioned into focused services (`AttendanceService`, `AssessmentService`, `CommunityService`).
- **[ARCH-002] Dead Code / Dormant Modules:**
  - `src/i18n/`: Completely configured with 100+ translation keys across English and Hindi, but 0 references in any screen.
  - `src/components/finance/`: Identical duplicates of `src/features/fees/` components exist and sit unreferenced.
  - `markBatchAllPresent`: Retained in `AcademicContext.tsx` (L1008) despite being removed from UI.
- **[ARCH-003] Inconsistent TypeScript Model Imports:** Some components import `AttendanceRecord` from `@/types/database`, while others define inline interfaces or import from `AcademicContext`, leading to subtle typing discrepancies.

---

## 19. Existing Test Coverage

### 19.1 Ground-Truth Testing Assessment
An audit of testing infrastructure revealed:
1. **Zero Automated Unit/Integration Test Framework:** The project has neither Jest, Vitest, nor React Native Testing Library installed in `package.json`. There are no unit tests for utility functions, hooks, or components.
2. **Synthetic Scripts Analysis:**
   - `scripts/test-e2e-suite.ts`: Does not execute against a running server or Supabase instance. It asserts hardcoded in-memory variables (e.g. `assert(adminState.role === 'admin')`, `assert(!('inst-01' === 'inst-02'))`) and prints "31 of 31 tests passed (100% SUCCESS rate)".
   - `scripts/full-system-verify.ts`: Similarly defines static literals in memory and asserts their equality.
   - `scripts/deep-dive-test.js`: Operates as a static AST regex file-scanner that validates route existence, absence of illegal HTML tags, and elimination of legacy tokens.

**Summary:** The application currently has **0% real test coverage**. Critical workflows have no automated regression safety.

---

## 20. Master Bug Register

### 20.1 Functional & Business Logic Bugs (BUG)

| Bug ID | Title | Module | Severity | Affected File & Line | Root Cause | Suggested Solution |
|---|---|---|---|---|---|---|
| **BUG-001** | Inactive Search Input | Student Desk | P2 - Medium | `src/app/student.tsx` L367 | `homeSearchQuery` bound to `TextInput` is never used to filter lists. | Connect `homeSearchQuery` to filter `materials`, `lectures`, and `studentTasks`. |
| **BUG-002** | Placebo Weekly Day-Picker Strip | Student Desk | P2 - Medium | `src/app/student.tsx` L397 | `selectedDay` only toggles button styling; does not filter schedule items. | Add day-indexed schedule mapping to dynamically render classes for selected day. |
| **BUG-003** | Disconnected Student Tasks List | Student Desk | P2 - Medium | `src/app/student.tsx` L133, L236 | `INITIAL_STUDENT_TASKS` hardcodes unrelated school tasks instead of `AcademicContext` DPPs. | Replace `studentTasks` with active assignments derived from `useAcademic().assignments`. |
| **BUG-004** | Subject Mastery Faculty Name Mismatch | Student Desk | P3 - Low | `src/app/student.tsx` L92, L106 | `SUBJECT_PROGRESS_CARDS` hardcodes non-existent faculty ("Dr. Ramanujan"). | Map subjects dynamically to actual assigned teachers from `batches`. |
| **BUG-005** | Roll Call Attendance Does Not Persist | Teacher Desk | P0 - Critical | `src/app/teacher.tsx` L279-294 | `handleCommitAttendance` triggers native alert only; no database or cache write. | Implement Supabase batch upsert into `public.attendance` table. |
| **BUG-006** | Published Interactive DPP Discards Questions | Teacher Desk | P1 - High | `src/app/teacher.tsx` L259-271 | `createAssignment` payload drops `dppData.questions` array. | Extend `assignments` schema to persist questions JSONB and render student quiz runner. |
| **BUG-007** | Hardcoded Batch in DPP Builder Modal | Teacher Desk | P2 - Medium | `src/components/academic/InteractiveDppBuilderModal.tsx` L175 | Modal hardcodes `batchId: 'batch-01'` on publish. | Pass `selectedBatchId` from parent teacher screen into modal props. |
| **BUG-008** | Batch Assignment Logic Bug in Approval Desk | Verification Desk | P1 - High | `src/context/AcademicContext.tsx` L1215 | `batchId === 'batch-01'` check fails because modal passes full human batch name string. | Compare against batch `name` or pass batch `id` consistently from modal. |
| **BUG-009** | Hardcoded Batches in Verification Desk | Verification Desk | P2 - Medium | `src/app/verify-students.tsx` L22-33 | Modal uses static `BATCH_CHOICES` constant instead of dynamic `batches` from context. | Populate dropdown choices dynamically using `useAuth().batches`. |
| **BUG-010** | Placebo Forgot Password Workflow | Auth Screen | P2 - Medium | `src/app/auth.tsx` L252-261 | Handler shows fake alert and does not call Supabase reset API. | Call `supabase.auth.resetPasswordForEmail(forgotEmail)`. |
| **BUG-011** | Hardcoded Password on Client Registration | Auth Context | P0 - Critical | `src/context/AuthContext.tsx` L338 | Sign-up method hardcodes `password: 'Password123!'` for all users in Supabase Auth. | Pass the actual user-entered password from registration form. |
| **BUG-012** | Chat Channel Re-Subscription Storm | Chat Screen | P1 - High | `src/context/ChatContext.tsx` L330 | `useEffect` has `messagesMap` in dependencies, tearing down subscription on every message. | Use functional state updates or refs so `messagesMap` is omitted from dependencies. |
| **BUG-013** | Orphaned Realtime Broadcast Channels | Chat Context | P2 - Medium | `src/context/ChatContext.tsx` L402 | `sendMessage` initializes new channel without subscribing or reusing active channel. | Send broadcast using the established active subscription channel. |
| **BUG-014** | Local File URI Stored in Study Materials | Study Materials | P1 - High | `src/components/academic/StudyMaterialsViewer.tsx` L126 | Saves device local URI (`file:///...`) instead of uploading binary to Supabase Storage. | Upload PDF to `study-materials` storage bucket and store public/signed URL. |
| **BUG-015** | Simulated Razorpay Payment Generator | Fee Context | P1 - High | `src/context/FeeNotificationContext.tsx` L260-270 | Fakes payment ID and order ID using `Math.random()`, bypassing payment gateway. | Integrate genuine Razorpay checkout via Edge Function and client SDK. |

### 20.2 UI/UX Issues (UX)

| ID | Title | Module | Severity | Affected File | Description & Recommended Fix |
|---|---|---|---|---|---|
| **UX-001** | Dual Institute Name & Identity Divergence | App-Wide | P1 - High | `AuthContext.tsx` vs `InstituteContext.tsx` | Admin sees Apex Academy; Student sees Bloom Academy. Unify institute state under one context. |
| **UX-002** | Residual Childish Emojis in Professional UI | App-Wide | P3 - Low | `auth.tsx`, `teacher.tsx`, `student.tsx` | Alerts contain `🌸`, `🍎`, `✨`. Replace with Lucide vector icons for professional aesthetic. |
| **UX-003** | Floating Pill Dock Overlap on Static Screens | UI / Navigation | P2 - Medium | `ScreenWrapper.tsx`, `BottomTabBar.tsx` | Floating dock can obscure inputs on non-scrollable screens. Ensure `paddingBottom: 110` is universally applied. |
| **UX-004** | Desktop Dock Viewport Detachment | UI / Layout | P3 - Low | `BottomTabBar.tsx` L53 | On desktop/iPad, dock spans viewport width instead of centering within `max-w-2xl` container. |
| **UX-005** | Dormant Localization Subsystem | i18n | P2 - Medium | Entire `src/app/` | `i18n` is initialized, but screens contain 100% hardcoded English. Connect strings to `t(...)` keys. |

### 20.3 Security Vulnerabilities (SEC)

| ID | Title | Module | Severity | Affected File | Description & Recommended Fix |
|---|---|---|---|---|---|
| **SEC-001** | Client-Side Auth Failure Bypass | Auth | P0 - Critical | `src/context/AuthContext.tsx` L265-275 | Auth catch block bypasses failure and logs user in with mock profile. Fail closed on auth error. |
| **SEC-002** | Plaintext Demo Passwords in Bundle | Auth | P0 - Critical | `src/context/AuthContext.tsx` L111-172 | Hardcoded accounts expose credentials. Strip test account arrays from production builds. |
| **SEC-003** | Client-Side RBAC Manipulation | Role Guard | P0 - Critical | `src/hooks/useRoleGuard.ts` L18-35 | Roles read from `AsyncStorage` can be spoofed. Validate roles server-side via Supabase JWT claims. |
| **SEC-004** | Tables Locked Out Due to Missing RLS | Database | P0 - Critical | `001_complete_schema.sql` L541-570 | `students`, `parents`, `teachers` have RLS enabled with 0 policies. Add proper SELECT/INSERT policies. |
| **SEC-005** | Excessive Data Exposure in Results | Database | P1 - High | `001_complete_schema.sql` L588-593 | Policy permits any member to view all students' marks. Scope query to student's own ID or parent link. |

### 20.4 Performance & Architecture Issues (PERF / ARCH)

| ID | Title | Module | Severity | Affected File | Description & Recommended Fix |
|---|---|---|---|---|---|
| **PERF-001**| Unstable Array Literal Hook Dependency | Hooks | P2 - Medium | `src/hooks/useRoleGuard.ts` L35 | Passing `['admin']` creates a new array reference every render. Stabilize with `useMemo` or string key. |
| **PERF-002**| Monolith Context Re-Render Cascades | Architecture | P1 - High | `src/context/AcademicContext.tsx` | 1,518-line context causes full-tree re-renders on minor updates. Split into modular domain contexts. |
| **ARCH-001**| Duplicate Code Modules in Finance & Fees | Architecture | P2 - Medium | `src/components/finance/` vs `src/features/fees/` | 100% duplicated files across directories. Delete redundant components in `src/components/finance/`. |
| **ARCH-002**| Database Schema Migration Divergence | Backend | P0 - Critical | `supabase/migrations/` | Two conflicting schema families exist. Consolidate into a single canonical migration pipeline. |

---

## 21. Critical Issues Summary

The five most critical findings requiring immediate developer remediation before any production release are:

1. **[P0] Non-Persistent Core Workflows (BUG-005, BUG-006, BUG-014):** Daily attendance, student homework submissions, interactive quizzes, and batch updates do not write to PostgreSQL. All recorded operations are lost on application restart.
2. **[P0] Incomplete & Broken Row Level Security (SEC-004, SEC-005):** Multiple database tables have RLS enabled with zero policies, which locks authenticated clients out of fetching their own profiles, while existing results policies leak peer test marks.
3. **[P0] Silent Authentication Bypass & Spoofable RBAC (SEC-001, SEC-003):** Supabase login failures are caught and ignored, allowing any input to grant access. Client-side role switching enables privilege escalation to the Admin Command Center.
4. **[P0] Database Migration & Edge Function Schema Collisions (ARCH-002, BE-001, BE-002):** Active Edge Functions query tables and column names (`student_fee_records.remaining_balance`) that do not exist in the Phase 4 schema (`student_fees.pending_amount`).
5. **[P1] Broken Quiz & Admission Workflows (BUG-006, BUG-008):** Teachers creating interactive DPP quizzes lose all questions upon publishing. Student verification inadvertently assigns all approved students to Class 11 due to a hardcoded string equality bug.

---

## 22. UI/UX Improvement Recommendations

1. **Unified Academy Branding:** Eliminate the dual-store setup. Consolidate `InstituteContext` into `AuthContext` so that academy name, logo, contact phone, and join codes remain synchronized across Student, Teacher, Parent, and Admin views.
2. **Activate Search & Filtering:** Connect the Student Home search input to actively filter the video lectures list, formula sheet documents, and assignments by title and subject tags.
3. **Dynamic Schedule Day-Picker:** Bind the weekly calendar picker (`Mon 18` through `Sun 24`) to a schedule dataset so tapping a day displays the classes, test timings, and homework due for that specific date.
4. **Interactive Student Quiz Runner:** Build a student-facing quiz runner component for interactive DPPs that presents MCQs, records selected options, auto-grades upon submission, and shows instant answer explanations.
5. **Responsive Floating Dock on Large Viewports:** Constrain the floating bottom tab bar (`BottomTabBar.tsx`) to `max-w-2xl` matching `ScreenWrapper.tsx` so it aligns neatly with the content container on iPads and desktop browsers.

---

## 23. Security Recommendations

1. **Enforce Fail-Closed Authentication:** Remove the fallback logic in `src/context/AuthContext.tsx`. If Supabase Auth returns an error, display an explicit error alert to the user and halt execution.
2. **JWT Custom Claims for Role Authorization:** Cease relying on client-side `AsyncStorage` for route authorization. Store user roles in Supabase Auth `app_metadata` and enforce access rules via Supabase JWT claims and database RLS.
3. **Comprehensive Row Level Security Policies:**
   - Author explicit `SELECT` and `INSERT` policies for `students`, `teachers`, `parents`, and `institute_members`.
   - Restrict `results` and `attendance` read access: Students can only view rows where `student_id = auth.uid()`; Parents can only view rows for children linked in `parent_students`.
4. **Sanitize Production Bundles:** Wrap test account credentials in development-only environment checks (`__DEV__`) to ensure passwords are excluded from production builds.
5. **Update Android Permissions:** In `app.json`, replace deprecated `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` with standard scoped storage permissions compliant with Android 13+ (API level 33).

---

## 24. Performance Recommendations

1. **Deconstruct `AcademicContext.tsx` Monolith:**
   - Decompose into domain-focused stores: `AttendanceContext`, `AssessmentContext`, and `StudyMaterialContext`.
   - Adopt React Query (TanStack Query) or lightweight Zustand stores to cache server queries, handle background refetching, and eliminate manual state synchronization.
2. **Stabilize Hook Dependencies:** Wrap array and object literals passed to hooks in `useMemo` or pass primitive string keys (e.g. `useRoleGuard('admin')` instead of `useRoleGuard(['admin'])`).
3. **Optimize Supabase Realtime Channels:**
   - Maintain a single persistent Supabase Realtime channel per chat room.
   - Decouple channel subscription lifecycle from the message array state by utilizing `useRef` for messages and functional state updaters.

---

## 25. Technical Debt Register

| Item ID | Component / Area | Description | Impact | Refactoring Complexity |
|---|---|---|---|---|
| **TD-001** | `src/context/AcademicContext.tsx` | 1,518-line state monolith managing 30+ disparate data models in memory. | High memory footprint, cascading re-renders, difficult testing. | **High** |
| **TD-002** | `src/features/fees/` vs `src/components/finance/` | 100% duplicate code files retained across two folders. | Confusion during maintenance; changes to one copy break the other. | **Low** |
| **TD-003** | `src/i18n/` | Dead localization infrastructure. Translation keys exist but are unused. | Dead bundle weight (~50KB) and unfulfilled multi-language spec. | **Medium** |
| **TD-004** | `supabase/migrations/` | Two conflicting migration lineages (`001_complete_schema.sql` vs `20261101_phase*.sql`). | Inability to run clean automated database migrations from scratch. | **High** |
| **TD-005** | `scripts/test-e2e-suite.ts` | Synthetic assertions asserting hardcoded in-memory variables. | False sense of test security; zero genuine automated verification. | **Medium** |

---

## 26. Prioritized Remediation Roadmap

### Phase A: Critical Fixes (P0 - Immediate)
1. **Unify Database Migrations:** Establish a single authoritative PostgreSQL migration sequence combining table definitions, foreign keys, and indexes. Resolve `student_fees` vs `student_fee_records` naming conflicts.
2. **Complete Row Level Security Policies:** Write and verify strict RLS policies for `students`, `parents`, `teachers`, `institute_members`, and `submissions`.
3. **Fail-Closed Authentication:** Remove silent error suppression in `AuthContext.tsx`. Require authentic Supabase Auth tokens for all protected actions.
4. **Fix Attendance Persistence:** Connect `handleCommitAttendance` in `teacher.tsx` to insert/update rows in the Supabase `attendance` table.

### Phase B: High-Priority Functional Fixes (P1)
1. **Fix DPP Quiz Question Retention:** Update `createAssignment` and backend schema to accept questions JSONB, and build a student quiz runner component.
2. **Fix Batch Assignment Bug:** Correct batch comparison logic in `AcademicContext.tsx` L1215 to match dynamic batch IDs.
3. **Real Binary File Uploads:** Connect `expo-document-picker` to Supabase Storage (`supabase.storage.from('study-materials').upload(...)`) instead of saving local `file:///` URIs.
4. **Stabilize Realtime Chat Subscriptions:** Fix dependency array in `ChatContext.tsx` to stop channel destruction on message arrival.

### Phase C: UI/UX & Quality Improvements (P2)
1. **Activate Home Search & Day-Picker:** Connect search inputs and weekday calendar strips to dynamic list filters.
2. **Purge Duplicate Code:** Remove redundant files in `src/components/finance/` and re-export from `src/features/fees/`.
3. **Unify Institute State:** Consolidate `InstituteContext` into `AuthContext` to eliminate dual-branding discrepancies.
4. **Connect i18n Strings:** Replace hardcoded UI strings with `t('key')` hooks across all 11 screen files.

### Phase D: Testing & CI Automation (P3)
1. **Install Jest & React Native Testing Library:** Set up genuine automated unit and component testing.
2. **Author Critical Workflow E2E Tests:** Implement automated tests for login, attendance marking, student admission approval, and quiz creation.
3. **Configure CI Pipeline:** Run `npx tsc --noEmit` and Jest tests on every pull request.

---

## 27. Regression Testing Checklist

When remediation work begins, verify the following checklist after every change:

- [ ] **Typecheck Cleanliness:** `npx tsc --noEmit` returns 0 errors with no `any` compromises.
- [ ] **Authentication Integrity:**
  - [ ] Logging in with invalid password returns explicit error alert.
  - [ ] Test accounts cannot log in when offline without network connection.
  - [ ] Role guard prevents unauthorized navigation from `/student` to `/admin`.
- [ ] **Attendance Workflow:**
  - [ ] Marking roll call and tapping Save persists records to database.
  - [ ] Reloading the app preserves the saved attendance statuses.
  - [ ] Attendance percentage reflects accurately on Student and Parent portals.
- [ ] **Student Admission Workflow:**
  - [ ] Student submits join request with code.
  - [ ] Teacher sees student in verification queue.
  - [ ] Teacher approves student to Batch A; student is correctly enrolled into Batch A (not Batch B).
- [ ] **Study Materials & DPPs:**
  - [ ] Teacher uploads PDF; file is stored in Supabase Storage.
  - [ ] Student downloads PDF on another device; file opens successfully.
  - [ ] Teacher publishes interactive quiz; student can open and complete the quiz questions.
- [ ] **Realtime Messaging:**
  - [ ] Sending a message in a batch room updates peer devices in real-time without re-subscribing.
  - [ ] Pinned announcements render persistently at top of room.

---

## 28. Production Readiness Assessment

| Evaluation Dimension | Readiness Score (1-10) | Status | Assessment |
|---|---|---|---|
| **UI Design & Aesthetics** | **8 / 10** | Production-Grade | Modern, high-contrast Apple HIG blue palette, responsive SVG curves, and clean layouts. |
| **Frontend Architecture** | **5 / 10** | Needs Refactoring | Over-sized monolithic components (up to 1,751 lines); duplicated finance directories. |
| **Backend Integration** | **2 / 10** | Prototype-Only | 85% of workflows mutate client React state only; Supabase DB is largely unintegrated. |
| **Database & Migrations** | **3 / 10** | Broken Lineage | Competing migration families, table collisions, missing RLS policies locking tables. |
| **Security & RBAC** | **3 / 10** | High Risk | Auth failure is bypassed; client-side role switching; hardcoded credentials in bundle. |
| **Automated Testing** | **1 / 10** | Non-Existent | Zero unit or integration tests; existing test scripts are synthetic assertions. |

### Overall Verdict: **PROTOTYPE / ALPHA QUALITY — NOT PRODUCTION READY**
The Acadly application possesses a strong visual foundation and well-structured user experience prototypes. However, because core business operations do not persist to a backend, database schemas conflict, and authentication can be bypassed client-side, **the application cannot be released to production without completing Phase A and Phase B remediation.**

---

## 29. Audit Limitations & Unverified Areas

1. **Live Production Supabase Database:** The audit was conducted in an audit-only mode without applying migrations to a live remote Supabase instance or modifying local data. SQL schema and RLS findings were derived through structural source analysis and query contract inspection.
2. **Real Push Notification Delivery:** While `send-push-notifications` Edge Function code was audited, live push delivery to physical iOS APNs and Android FCM tokens could not be tested without active EAS production push credentials.
3. **Live Razorpay Webhook Callbacks:** Because `FEATURE_FEES = false` was set in `src/config/features.ts`, live payment processing through Razorpay's production API was verified via static code analysis of `razorpay-create-order` and `razorpay-webhook`.
4. **Google Play Store / Apple App Store Submission:** Compliance was evaluated against published Apple HIG and Google Play policy standards; final app store approval is subject to manual platform review.

---
*End of Audit Report. Prepared for engineering leadership and senior development handover.*
