# Acadly - Tuition & Coaching Management App

Acadly is a multi-institute mobile platform built with **Expo SDK 58**, **React Native**, **TypeScript**, and **Supabase**, designed to manage teachers, students, parents, batches, attendance, study materials, video lectures, assignments, examinations, fees, and reports.

---

## 🎯 Product Overview

Acadly provides multi-tenant, role-based experiences tailored for four key user roles:

- 🏫 **Institute Admin**: Manages institute settings, teachers, students, batches, fee structures, and analytics.
- 👨‍🏫 **Teacher**: Manages assigned batches, attendance roll calls, video lectures, study materials, assignments, and exams.
- 🎓 **Student**: Accesses enrolled batches, lecture recordings, notes/PDFs, attendance records, assignments, and exam results.
- 👨‍👩‍👦 **Parent**: Tracks linked children's daily attendance, assignments, exam reports, and fee dues.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Mobile Application** | Expo SDK 58 + React Native |
| **Language** | TypeScript |
| **Routing / Navigation** | Expo Router |
| **Styling** | NativeWind (Tailwind CSS) |
| **Backend & Database** | Supabase (PostgreSQL + RLS) |
| **Authentication** | Supabase Auth |
| **Design System** | Google Stitch |
| **Video Player** | React Native WebView (YouTube Unlisted) |
| **Notifications** | Expo Notifications |
| **Payments** | Razorpay (UPI, Cards, Netbanking) |

---

## 🗺️ 5-Phase Development Roadmap

- [x] **Phase 1: UI/UX Design System & Project Setup**
  - Configured Stitch MCP and imported Google Stitch high-fidelity mobile prototypes (`designs/`).
  - Created reusable UI component library (`Button`, `Input`, `Card`, `Badge`, `AttendanceToggle`, `RoleCard`, `MetricCard`, `HeaderBar`, `ScreenWrapper`).
  - Integrated NativeWind styling and Expo Router.
- [x] **Phase 2: Authentication & Multi-Institute Management**
  - Connected Supabase client with environment keys.
  - Multi-institute database schema with Row Level Security (RLS) policies (`supabase/migrations/20261101_phase2_schema.sql`).
  - Implemented 4-role workspace switching, center join codes (`APX-9021`), and academy registration.
- [x] **Phase 3: Core Academic Workflows**
  - Daily batch attendance marking with **P / A / L** toggles and audit correction with reason.
  - PDF study materials and formula sheets repository with upload and download viewer.
  - YouTube Unlisted video lectures module with built-in modal player and offline caching.
  - Assignment creation for faculty and submission/grading workflow for students.
- [x] **Phase 4: Fees, Push Notifications & Analytics**
  - Fee plans and student dues ledger with automatic receipt generation (`#APX-REC-...`).
  - Simulated 256-bit SSL secured Razorpay checkout (UPI, Cards, Netbanking).
  - Real-time mobile push notifications via `expo-notifications`.
  - Institutional analytics: Revenue realization vs pending dues, roll call rates, and CSV audit reports.
- [x] **Phase 5: Testing, Security & Release**
  - Automated E2E verification test suite (`scripts/test-e2e-suite.ts`) passing with **100% success rate (31/31 tests)**.
  - Complete foreign key indexes and composite query optimizations (`supabase/migrations/20261101_phase5_security_and_indexes.sql`).
  - EAS Build configuration (`eas.json`) and production bundle IDs (`com.acadly.app`).
  - Deployment guide and Play Store / App Store compliance documentation (`docs/DEPLOYMENT_GUIDE.md`).

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm start
```

### 3. Run Automated E2E & Security Tests
```bash
npx ts-node scripts/test-e2e-suite.ts
```

### 4. Build for Production (EAS)
```bash
# Android APK for testing
eas build --platform android --profile preview

# Android Production AAB for Google Play Store
eas build --platform android --profile production
```
