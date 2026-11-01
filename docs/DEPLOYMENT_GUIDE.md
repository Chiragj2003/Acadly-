# Acadly Production Deployment & Operations Guide

This guide outlines the end-to-end production deployment, security auditing, and release workflow for **Acadly** (Tuition & Coaching Management App) built with **Expo SDK 58**, **React Native**, **TypeScript**, and **Supabase**.

---

## 1. Architecture & Multi-Tenant Model

Acadly uses **Institute-Level Tenant Isolation**:
- Every record (`batches`, `attendance`, `lectures`, `study_materials`, `student_fees`, etc.) is strictly keyed by `institute_id`.
- Tenant boundaries and permissions are enforced at the database layer via **PostgreSQL Row Level Security (RLS)**.
- Users authenticate via Supabase Auth and are mapped to institutes with roles (`admin`, `teacher`, `student`, `parent`) via `institute_members`.

---

## 2. Supabase Production Setup

### A. Run Database Migrations
Apply the migrations in order in your production Supabase SQL Editor:
1. [`supabase/migrations/20261101_phase2_schema.sql`](file:///c:/Users/chira/Desktop/Acadly/supabase/migrations/20261101_phase2_schema.sql): Institutes, Profiles, Members, Teachers, Students, Parents, Batches & Base RLS.
2. [`supabase/migrations/20261101_phase3_schema.sql`](file:///c:/Users/chira/Desktop/Acadly/supabase/migrations/20261101_phase3_schema.sql): Daily Attendance, Study Materials (PDF), Lectures (YouTube Unlisted), and Assignments/Submissions.
3. [`supabase/migrations/20261101_phase4_schema.sql`](file:///c:/Users/chira/Desktop/Acadly/supabase/migrations/20261101_phase4_schema.sql): Fee Plans, Student Fees, Razorpay Payments Ledger, and In-App Notifications.
4. [`supabase/migrations/20261101_phase5_security_and_indexes.sql`](file:///c:/Users/chira/Desktop/Acadly/supabase/migrations/20261101_phase5_security_and_indexes.sql): Foreign key indexes, composite query optimization, and security compliance verification function.

### B. Security & Storage Checklist
- **Never expose the service-role key in mobile builds**. Use only the public anonymous key (`EXPO_PUBLIC_SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
- In Supabase Auth Settings:
  - Turn on **Leaked Password Protection** (HaveIBeenPwned integration).
  - Configure Custom SMTP (SendGrid / AWS SES / Resend) for verification and password reset emails.
  - Enable SSL Enforcement on database connections.

---

## 3. Expo EAS Build & Release Configuration

### A. Prerequisites
```bash
npm install -g eas-cli
eas login
```

### B. Build Commands (via [`eas.json`](file:///c:/Users/chira/Desktop/Acadly/eas.json))

#### Android Internal Test Build (APK):
```bash
eas build --platform android --profile preview
```

#### Android Production Build (AAB for Google Play Store):
```bash
eas build --platform android --profile production
```

#### iOS Simulator / Internal Test Build:
```bash
eas build --platform ios --profile preview
```

#### iOS App Store Production Build:
```bash
eas build --platform ios --profile production
```

---

## 4. App Store & Play Store Compliance

### A. Permissions Disclosures
- `CAMERA`: Required for scanning document notes or student profile avatars.
- `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE`: Required for saving offline video lectures and fee receipt PDFs.
- `NOTIFICATIONS`: Required for attendance roll call alerts, live class countdown reminders, and fee due alerts.

### B. Child Safety & Data Privacy
- **Student Data Isolation**: Student phone numbers and contact details are masked and only accessible by authorized institute staff and linked parents.
- **COPPA & GDPR-K Compliance**: Parental consent flows and transparent fee transaction ledgers.

---

## 5. Automated Verification Test Suite

Run the full end-to-end verification and RLS audit script anytime:
```bash
npx ts-node scripts/test-e2e-suite.ts
```
Expected output: **31 of 31 tests passed (100% SUCCESS rate)**.
