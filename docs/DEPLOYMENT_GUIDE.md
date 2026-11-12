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
Apply the canonical migration set in order in your production Supabase SQL Editor (or via `supabase db push` / `supabase migration up`):
1. [`supabase/migrations/0001_core.sql`](file:///c:/Users/chira/Desktop/Acadly/supabase/migrations/0001_core.sql): Institutes, Profiles, Institute Members, Teachers, Students, Parents, Parent-Students, Subjects, Batches, Batch Teachers & Students, Join Requests, Foreign Key Indexes, and Auth User triggers.
2. [`supabase/migrations/0002_academic.sql`](file:///c:/Users/chira/Desktop/Acadly/supabase/migrations/0002_academic.sql): Daily Attendance, Attendance Audit Log, Lectures (YouTube/Bunny), Study Materials (PDF), Assignments (with `questions jsonb` & `type` enum: 'file' | 'quiz'), Submissions (with `answers jsonb`, `score`, `graded_at`), Examinations, Results, and auto-ranking triggers.
3. [`supabase/migrations/0003_community_chat.sql`](file:///c:/Users/chira/Desktop/Acadly/supabase/migrations/0003_community_chat.sql): Real-Time Chat Rooms, Messages, Community Discussion Posts, Comments, Upvotes, and Supabase Realtime publication configuration.
4. [`supabase/migrations/0004_fees.sql`](file:///c:/Users/chira/Desktop/Acadly/supabase/migrations/0004_fees.sql): Fee Plans, Student Fees Ledger (`pending_amount`, `paid_amount`, `total_amount`), Payments (with `gst_amount`, `razorpay_signature`, `notes`), Receipts Ledger, In-App Notifications, and Push Tokens.
5. [`supabase/migrations/0005_rls.sql`](file:///c:/Users/chira/Desktop/Acadly/supabase/migrations/0005_rls.sql): Complete Row Level Security (RLS) enforcement. Security Definer helper functions (`auth_role`, `auth_institute_id`, `is_institute_member`, `is_teacher_of_batch`, `is_parent_of`) and explicit policies across all 31 tables (zero tables left with RLS enabled and 0 policies).
6. [`supabase/migrations/0006_storage.sql`](file:///c:/Users/chira/Desktop/Acadly/supabase/migrations/0006_storage.sql): Storage buckets (`study-materials`, `student-submissions`, `avatars`, `institute-logos`, `community-attachments`) and storage object security policies.

### B. Security, Storage & Edge Function Secrets Checklist
- **Never expose the service-role key in mobile builds**. Use only the public anonymous key (`EXPO_PUBLIC_SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
- Set production Edge Function secrets using the Supabase CLI (`supabase secrets set`):
  ```bash
  # Razorpay Server Payment Verification & Webhooks
  supabase secrets set RAZORPAY_KEY_ID=rzp_live_...
  supabase secrets set RAZORPAY_KEY_SECRET=...
  supabase secrets set RAZORPAY_WEBHOOK_SECRET=...

  # YouTube Resumable Video Ingestion (Google Cloud OAuth 2.0)
  supabase secrets set YOUTUBE_CLIENT_ID=...apps.googleusercontent.com
  supabase secrets set YOUTUBE_CLIENT_SECRET=GOCSPX-...
  supabase secrets set YOUTUBE_REFRESH_TOKEN=...
  ```
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
- `NOTIFICATIONS`: Required for attendance roll call alerts, live class countdown reminders, and fee due alerts.
- **Scoped Storage**: No broad `READ_EXTERNAL_STORAGE` or `WRITE_EXTERNAL_STORAGE` permissions are requested. Document picking and PDF receipt downloads use standard Android Storage Access Framework (SAF) and iOS document sharing APIs.

### B. Child Safety & Data Privacy
- **Student Data Isolation**: Student phone numbers and contact details are masked and only accessible by authorized institute staff and linked parents.
- **COPPA & GDPR-K Compliance**: Parental consent flows and transparent fee transaction ledgers.

---

## 5. Automated Verification & Quality Assurance Suite

Run the full automated test and architecture lint suite anytime:
```bash
# 1. Typecheck the entire TypeScript codebase
npx tsc --noEmit

# 2. Run Jest unit & integration test suites
npm test

# 3. Run architecture and schema integrity lint
npm run lint:architecture
```
