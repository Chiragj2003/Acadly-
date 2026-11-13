# Acadly Production Deployment & Operations Guide

This guide outlines the end-to-end production deployment, security auditing, and release workflow for **Acadly** (Tuition & Coaching Management App) built with **Expo SDK 58**, **React Native**, **TypeScript**, and **Supabase**.

---

## 1. Architecture & Multi-Tenant Model

Acadly uses **Institute-Level Tenant Isolation**:
- Every record (`batches`, `attendance`, `lectures`, `study_materials`, `student_fees`, etc.) is strictly keyed by `institute_id`.
- Tenant boundaries and permissions are enforced at the database layer via **PostgreSQL Row Level Security (RLS)**.
- Users authenticate via Supabase Auth and are mapped to institutes with roles (`admin`, `teacher`, `student`, `parent`) via `institute_members`.

---

## 2. Complete Environment & Secret Inventory

All sensitive secrets live **ONLY** in Supabase Edge Function secrets. The mobile client utilizes only the public anonymous key.

| Secret Name | Destination / Environment | Purpose | Required Tier |
| :--- | :--- | :--- | :--- |
| `EXPO_PUBLIC_SUPABASE_URL` | Mobile App (`.env`) | Supabase Kong API Gateway URL | Free / Pro |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Mobile App (`.env`) | Client RLS-protected anonymous API key | Free / Pro |
| `EXPO_PUBLIC_SENTRY_DSN` | Mobile App (`.env`) | Production crash reporting & error tracking | Free Tier |
| `GEMINI_API_KEY` | Supabase Edge Function Secret | Google Gemini LLM API (Quiz generator & grading) | Free Tier |
| `GEMINI_MODEL` | Supabase Edge Function Secret | Model identifier (`gemini-1.5-flash`) | Free Tier |
| `RAZORPAY_KEY_ID` | Supabase Edge Function Secret | Razorpay Live Key ID for fee checkout orders | Standard |
| `RAZORPAY_KEY_SECRET` | Supabase Edge Function Secret | Razorpay Secret for HMAC-SHA256 signature verification | Standard |
| `RAZORPAY_WEBHOOK_SECRET` | Supabase Edge Function Secret | Webhook signature verification on payment capture | Standard |
| `YOUTUBE_CLIENT_ID` | Supabase Edge Function Secret | Google Cloud OAuth 2.0 client for unlisted videos | Free Tier |
| `YOUTUBE_CLIENT_SECRET` | Supabase Edge Function Secret | Google Cloud OAuth 2.0 secret | Free Tier |
| `YOUTUBE_REFRESH_TOKEN` | Supabase Edge Function Secret | Persistent token for automated unlisted lecture uploads | Free Tier |
| `EXPO_ACCESS_TOKEN` | Supabase Edge Function Secret | Expo Push Notification API delivery service | Free Tier |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Edge Function Secret | Elevated backend execution for webhook balance updates | Built-in |

---

## 3. "Move to Premium Supabase Project" Checklist

Follow these exact steps when transitioning from local development / test environment to a managed production Supabase instance:

### Step 1: Provision Project & Target Region
1. Create a new organization and project on [Supabase Dashboard](https://supabase.com).
2. Select target region close to end users (e.g., `ap-south-1` Mumbai for India tuition centers).
3. Set a cryptographically random database password and store securely in your password manager.

### Step 2: Apply Database Migrations in Order
Link your project and push all 12 numbered migrations:
```bash
# Link project
npx supabase link --project-ref <your-production-ref>

# Push canonical migrations 0001 through 0012
npx supabase db push
```
The migration sequence comprises:
1. `0001_core.sql`: Core tables, profiles, institute members, teachers, students, parents, join requests.
2. `0002_academic.sql`: Attendance, lectures, study materials, assignments, submissions, examinations, results.
3. `0003_community_chat.sql`: Real-time chat rooms, messages, community posts, comments.
4. `0004_fees.sql`: Fee ledger, payments, receipts, push tokens, notifications.
5. `0005_rls.sql`: Comprehensive Row-Level Security policies across all tables.
6. `0006_storage.sql`: Storage buckets and bucket-level security policies.
7. `0007_secure_quiz_grading.sql`: Server-side quiz auto-grading and locked answer keys.
8. `0008_fix_rls_recursion_and_scoping.sql`: RLS recursion elimination and batch performance optimizations.
9. `0009_security_hardening_round1.sql`: Invite codes, institute code lookup RPC, rate-limit throttling.
10. `0010_batch_schedule_and_results.sql`: Weekly schedule editor, marks entry, subject mastery.
11. `0011_app_flows_and_state_machines.sql`: Admission state machine, attendance audit log reason checks, written homework, announcements, report card exports.
12. `0012_ai_grading_and_quiz_generation.sql`: Gemini AI daily quotas (25/day), AI submission suggestion fields, and teacher review locks.

### Step 3: Configure Storage Buckets
Verify bucket creation and limits in Supabase Dashboard $\rightarrow$ Storage:
- `study-materials`: Private, 20 MB file size limit, allowed MIME: `application/pdf`, `image/*`.
- `student-submissions`: Private, 20 MB file size limit, allowed MIME: `application/pdf`, `image/*`.
- `avatars`: Public, 5 MB file size limit, allowed MIME: `image/*`.
- `institute-logos`: Public, 5 MB file size limit, allowed MIME: `image/*`.
- `community-attachments`: Public, 10 MB file size limit.

### Step 4: Configure Edge Function Secrets
Execute from your workstation terminal:
```bash
npx supabase secrets set GEMINI_API_KEY=AIzaSy...
npx supabase secrets set GEMINI_MODEL=gemini-1.5-flash
npx supabase secrets set RAZORPAY_KEY_ID=rzp_live_...
npx supabase secrets set RAZORPAY_KEY_SECRET=...
npx supabase secrets set RAZORPAY_WEBHOOK_SECRET=...
npx supabase secrets set YOUTUBE_CLIENT_ID=...apps.googleusercontent.com
npx supabase secrets set YOUTUBE_CLIENT_SECRET=GOCSPX-...
npx supabase secrets set YOUTUBE_REFRESH_TOKEN=...
npx supabase secrets set EXPO_ACCESS_TOKEN=...
```

### Step 5: Deploy Edge Functions
Deploy all backend serverless functions:
```bash
npx supabase functions deploy generate-quiz
npx supabase functions deploy grade-submission
npx supabase functions deploy send-push-notifications
npx supabase functions deploy razorpay-create-order
npx supabase functions deploy razorpay-webhook
npx supabase functions deploy youtube-resumable-upload
```

### Step 6: Configure Supabase Auth Settings
1. **Redirect URLs**:
   - Site URL: `acadly://`
   - Additional Redirect URLs:
     - `acadly://auth/callback`
     - `acadly://reset-password`
     - `https://<your-project-ref>.supabase.co/auth/v1/callback`
2. **Security & Rate Limits**:
   - Enable **Leaked Password Protection** (HaveIBeenPwned).
   - Enable SSL enforcement on PostgreSQL connections.
   - Configure Custom SMTP (Amazon SES / Resend / SendGrid) to prevent reaching Supabase default email limits (3 emails/hour on free tier).
   - Set OTP expiration to 600 seconds (10 minutes).

### Step 7: Update Mobile Application Environment
In your production mobile build pipeline (EAS Secrets):
```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value https://<prod-ref>.supabase.co --type string
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <prod-anon-key> --type string
eas secret:create --name EXPO_PUBLIC_SENTRY_DSN --value https://<sentry-key>@o...ingest.sentry.io/... --type string
```

### Step 8: Production Verification
Run automated security tests against the live database:
```bash
npx supabase test db
```
Verify zero RLS bypasses and zero table leaks.

---

## 4. Expo EAS Build & Release Configuration

### Android Production Build (AAB for Google Play):
```bash
eas build --platform android --profile production
```

### iOS App Store Production Build:
```bash
eas build --platform ios --profile production
```

---

## 5. App Store & Play Store Compliance Checklist
1. **Account Deletion**: App Store Guideline 5.1.1(v) requires in-app account deletion. Implemented via `request_account_deletion` RPC accessible in Student & Parent profile settings.
2. **User Data Export**: GDPR/CCPA data export implemented via `export_user_data` RPC producing a downloadable JSON archive.
3. **Privacy Policy**: Publicly hosted privacy policy detailing zero-PII transmission for AI processing (`docs/PRIVACY_POLICY.md`).
