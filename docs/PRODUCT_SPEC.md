# ACADLY PRODUCT SPECIFICATION (V1 REBUILD)
> **Source of Truth for Acadly Rebuild**  
> **Status:** Active / Approved Specification

## PRODUCT DIRECTION & MANDATES
1. Do NOT position the app as coaching-only. Acadly must serve SCHOOLS, COLLEGES, COACHING institutes, and SOLO TUITION teachers with ONE data model.
2. Do NOT purge the pastel "cute" palette. Students get a playful pastel design; teachers and admins get a calm one (see Phase 6).

## GLOBAL RULES
- Work on a new git branch: `rebuild-v1`. Commit after every sub-step with a clear message.
- Stop after each PHASE, show a short report (what changed, what's left, what needs me), and wait for "continue".
- `npx tsc --noEmit` must show 0 errors after every phase. No `any` types.
- Never fake success. No setTimeout "simulations", no fake IDs, no demo bypass buttons. If something can't work yet, show a clear "Coming soon" state.
- No secrets in the app. Only EXPO_PUBLIC_ vars may be in the app; server secrets go to Supabase secrets.
- Use expo-dev-client (development builds), not Expo Go, because native modules are needed.
- Every screen must have loading (skeleton), empty, error (with retry), and offline states.

## V1 PRODUCT DECISIONS
- v1 is FREE. No fees, payments, Razorpay, or GST receipts in the v1 UI. Move existing fee code into src/features/fees/ behind a feature flag FEATURE_FEES=false, and don't delete it.
- Login: email + password, and Google sign-in. Phone OTP comes in v2.
- No age restriction on students.
- Languages: English + Hindi from day 1 (i18next + expo-localization). ALL UI strings go in translation files. This also fixes the corrupted emoji/₹ strings.
- Light mode only in v1. Set userInterfaceStyle: "light" in app.json. Dark mode comes in v2.

## PHASE 1: CRITICAL CLEANUP (quick wins)
1. Remove the "Open Teacher Verification Desk" and "Simulate Teacher Approval" buttons from join-institute. Add role guards to EVERY role-specific route (a student opening /verify-students gets redirected).
2. Fix all corrupted UTF-8 strings (dYO, o", dY?Z, ",1", "?"). Make sure all source files are saved as UTF-8. Use lucide icons instead of emojis in titles.
3. Delete src/app/explore.tsx and any other unused boilerplate.
4. Remove ALL mock-success fallbacks: the mock Google login, the DEFAULT_CHILDREN fallback, the fake offline download button, fake absentee alerts, and the example.com PDF URL.
5. Remove the broken switchRole that overwrites identity. Roles will come from the database (Phase 2).
6. Make all SVG charts responsive (viewBox + container width) and safe with 0, 1, or many data points.

## PHASE 2: NEW DATA MODEL + BACKEND (Supabase)
Review the existing migrations, then write NEW migrations for this org-agnostic model. Don't edit applied migrations.

Core:
- profiles (one per auth user: name, avatar, phone, language)
- organizations (type: school | college | coaching | tuition, name, logo, city, settings JSON). A solo tutor is an org of type "tuition" where the owner is also the teacher.
- org_members (org_id, user_id, role: owner | admin | teacher | student | parent, status: pending | active | removed). ONE user can have MANY memberships across orgs and roles (e.g. a teacher in a school AND owner of their own tuition, or a student in a school AND a coaching).
- academic_years (org_id, name, start, end, is_current)
- groups (org_id, academic_year_id, name, kind: class | section | batch | semester | course, parent_group_id for sections). UI labels come from the org type: school → "Class/Section", college → "Course/Semester", coaching/tuition → "Batch".
- subjects; group_subjects (group_id, subject_id, teacher_id). Also track class_teacher_id on groups for schools.
- enrollments (student ↔ group)
- join_codes (code, org_id, group_id, role, expires_at, max_uses, uses). Shown as text + QR.
- join_requests (student, code used, short form answers, status)
- parent_links (parent_id, student_id, status: pending | active, linked_via: student_invite | org_record). Rules: a student can INVITE a parent; the org can pre-record a parent phone/email at admission, which auto-links when that parent signs up; a STUDENT CANNOT REMOVE a parent link (only admins can).

Learning:
- content_items (group_subject_id, type: note_pdf | video_upload | video_youtube | link, title, storage path / url, published_at)
- video_progress (user_id, content_id, watched_segments JSON, unique_seconds_watched, duration, last_position, completed)
- assessments (type: mcq_test | written_paper | homework | offline_exam, due_at, max_marks, status: draft | scheduled | live | closed | results_published)
- assessment_questions (for MCQ: options, correct answer, explanation)
- submissions (answers JSON or file path, score, feedback, status, submitted_at, late flag)
- doubts (group_subject_id, student_id, question, optional content_id + page/timestamp, anonymous_to_peers bool, status: open | answered | resolved); doubt_answers; doubt_upvotes ("me too")
- live_classes (group_subject_id, title, meeting_url, starts_at, ends_at); live_class_joins (who tapped Join, and when)

Attendance & study:
- attendance_sessions (group_id, subject optional, date, taken_by); attendance_records (status P | A | L | excused, corrected_by, correction_reason)
- focus_sessions (student_id, planned_minutes, started_at, ended_at, focused_seconds, interruptions_count, interruption_log JSON, completed bool)
- study_daily (student_id, date, focus_seconds, video_seconds, notes_seconds, tests_done). A rollup for fast reports.

Communication:
- chat_rooms (type: group_class | subject_group | doubt_1to1 | parent_teacher | announcement), chat_members, messages (text, attachment path, pinned, deleted_at), message_reports
- notifications, push_tokens, weekly_reports (student_id, week, summary JSON)
- audit_log (who changed what: attendance corrections, grades, approvals)

Security:
- RLS on EVERY table, using SECURITY DEFINER helpers with a fixed search_path: is_org_member(), has_org_role(), is_teacher_of_group(), is_parent_of(), is_enrolled().
- Students: only their own data and their groups. Parents: only actively linked children. Teachers: only their groups/subjects. Admins/owners: only their org.
- NO student-to-student direct messages. Students can only message teachers and their class groups.
- Write SQL tests proving cross-access is blocked.
- Storage buckets with type/size limits and matching policies: notes (PDF ≤ 20MB), submissions (PDF/images ≤ 10MB), chat (PDF/images ≤ 10MB), avatars (images ≤ 2MB), org-logos.
- Auth: Supabase email/password + Google. Store tokens in expo-secure-store. Create a profile on sign up via a DB trigger.
- Realtime only on messages, attendance_records, and notifications.
- Dev-only seed.sql: 4 orgs (one of each type), with an owner, teachers, students, and parents in each. Print the test logins in your report (never in the app).

## PHASE 3: DATA LAYER + CODE STRUCTURE
- Replace ALL mock contexts (AcademicContext, ChatContext, ChildContext, InstituteContext, FeeNotificationContext) with typed services in src/services/ + TanStack Query hooks in src/hooks/. Delete the mock data files.
- Use Zustand only for small UI state: active org, active role, active child.
- Regenerate Supabase TypeScript types and use them everywhere.
- Forms: react-hook-form + zod.
- Split every file over 400 lines. Structure: src/features/<feature>/{screens, components, hooks, services}.
- Lists: FlashList, pull-to-refresh, pagination.

## PHASE 4: FLOWS & NAVIGATION (rebuild)
Onboarding (keep it short):
1. Welcome → "I am a…" [Institution owner / Teacher / Student / Parent] → sign up (email or Google).
2. Owner: pick org type [School / College / Coaching / Tuition] → name + logo + city → setup wizard (academic year → classes/batches → subjects → invite teachers by link/QR). Each step is skippable with a checklist on the dashboard.
3. Teacher: join by invite link/code/QR, or "I teach on my own" (creates a tuition org automatically).
4. Student: scan QR or enter class code → preview showing the org + class name → SHORT form (name, roll no optional, parent phone optional; coaching-only extra fields like target exam appear only for coaching orgs) → "Waiting for approval" screen with status → push notification when approved.
5. Parent: open the student's invite link, or sign up and get auto-linked by phone/email, or enter a child code. Supports multiple children.

Org/role switcher: a top-left chip showing the active org + role. Tap it to switch between memberships. Identity never changes.

Bottom tabs per role. Chat and doubts live INSIDE the tabs, so there are no trapped pushed screens:
- Student: Today | Learn | Focus | Chat | Me
- Teacher: Today | Classes | Create | Chat | Me
- Parent: Today | Reports | Chat | Me
- Admin/Owner: Dashboard | Classes & People | Approvals | Settings
(An owner who also teaches can switch to the Teacher view.)

"Today" screens:
- Student: today's classes/live classes, pending tests and homework with countdowns, streak, a big "Start Focus" button, new notes/videos
- Teacher: today's classes, "Take attendance" shortcut, submissions to grade, open doubts, pending join requests
- Parent: a one-glance card per child (present today?, study time today, pending work, latest marks), then a weekly report link

## PHASE 5: FEATURES
1. Attendance: per group (and per subject for schools/colleges). One-tap P/A/L with "Mark all present", corrections with a reason (audit log), and a real push notification to the parent when a student is marked absent.
2. Content: teachers upload PDFs (to storage) and videos, or paste a YouTube link. Students view PDFs in-app, with the time spent reading tracked.
3. Videos: uploads go to Bunny Stream through an Edge Function (TUS upload, signed playback URLs). YouTube links play through react-native-webview with the IFrame API for events.
   GENUINE WATCH TRACKING: count only unique seconds actually played (merge watched segments); stop counting when paused, in the background, or with the screen off; send a heartbeat every 15s; count at most 2x speed; show a "Still watching?" tap every 10 min of no interaction. Parents and teachers see "Watched 34 of 50 min (68%)".
4. Tests & papers: MCQ (auto-graded with explanations), written paper (student uploads photos/PDF), homework, and offline exam (teacher enters marks). Teacher sees a live "Submitted / Pending / Late" list with a one-tap reminder to pending students. Results go to the student and parent. Class leaderboard is OFF by default.
5. Doubts: per subject inside each class. A student can raise one from anywhere, including from a PDF page or a video timestamp. Anonymous to classmates (the teacher sees the name). "Me too" upvotes. A teacher answer marks it answered, and the student marks it resolved. Resolved doubts become searchable class Q&A. This REPLACES the global community wall.
6. Chat (WhatsApp-style): class group with an "only teachers can post" toggle, subject groups, 1:1 student↔teacher doubts, parent↔teacher chat. Messages persist in the DB, with attachments, pinned messages, unread counts, report message, and teacher mute.
7. Live classes: teacher schedules one with a Meet/Zoom link → it shows on Today + calendar, with a reminder 10 min before → "Join" opens the link and records live_class_joins.
8. Focus mode (study timer):
   - Pomodoro presets (25/5, 50/10, custom). Keeps the screen awake (expo-keep-awake).
   - Android: build a small Expo native module calling Activity.startLockTask() (screen pinning) when focus starts and stopLockTask() when it ends. Explain to the student before the system prompt appears.
   - iOS (v1): no app blocking. Track interruptions via AppState and suggest Guided Access in a help sheet.
   - If the app goes to the background, log an interruption and pause the session. Only real focused seconds count.
   - Session summary: focused minutes, interruptions, and a Focus Score. Daily streaks + simple badges.
   - Do NOT use the Android AccessibilityService or iOS Screen Time APIs in v1 (store-review risk). Leave a clear TODO for v2.
9. Reports: a weekly parent report (pg_cron + Edge Function every Sunday evening, sent as a push notification plus an in-app Reports page) covering attendance %, focus time + Focus Score, genuine video watch time, notes reading time, tests done + marks, pending work, and teacher remarks. Teachers see the same per student in a Student 360 screen, plus a class overview.
10. Notifications: real push via expo-notifications + an Edge Function for absence, new content, test assigned/due tomorrow/results, doubt answered, live class starting, join approved, and the weekly report. In-app notification inbox.
11. Admin: setup checklist, classes & people management, bulk CSV import of students with parent phone/email (auto-links parents), approvals queue, announcements to the whole org/class/parents only, and a basic analytics dashboard (attendance, active students, content posted).

## PHASE 6: DESIGN SYSTEM (three moods, one system)
Build src/theme/ with shared tokens plus role/org "skins", applied via a ThemeProvider based on the active role and org type. Rebuild Button, Input, Card, Badge, Chip, Avatar, ListItem, EmptyState, Skeleton, Sheet, Header, and TabBar as shared components. No hardcoded colors or spacing anywhere.

- STUDENT "Playful" (school, coaching, tuition): Pinterest-style masonry cards (2-column on Learn/Today), cream background #FFF9F2, pastel card fills (peach #FFD9CF, mint #D3F2E3, butter #FFF0C2, lavender #E6E0FF, sky #DDF0FF), coral primary #FF7D6B, cocoa text #2E2421, 24px radius, soft shadows, rounded fonts (Baloo 2 for headings, Nunito for body), small friendly illustrations/mascot in empty states, and bouncy micro-animations (react-native-reanimated, subtle).
- STUDENT "Fresh" (college): the same structure, but less childish: softer pastels, no mascot, 20px radius.
- TEACHER / ADMIN "Calm": warm off-white background #F7F6F3, white cards with a hairline border #ECEAE5, one soft indigo accent #5B6CF0, text #1F2328, 16px radius, spacious layout, data shown clearly in simple charts, Plus Jakarta Sans font. Calm and modern, not harsh or corporate.
- PARENT "Warm": the Calm base with a peach accent. Big, glanceable summary cards with plain-language status ("Present today ✓", "2 tasks pending").
- Accessibility: pastels are for BACKGROUNDS only. All text must meet WCAG AA contrast, using darker shades for text and icons. Tap targets ≥ 44pt/48dp. Respect font scaling. Safe areas and keyboard handling on every screen. Test at 320dp width and on tablets.

## PHASE 7: QA & SECURITY
- Walk every role's full journey in each org type (School, College, Coaching, Tuition) using the seed accounts. List every bug found and fixed.
- Try cross-org and cross-role data access, and confirm the backend blocks it.
- Tests: service-layer unit tests, RLS SQL tests, and tests for focus-time and video-time calculation.
- Remove console.logs and unused deps/files. Add error boundaries and crash-safe fallbacks.

## FINAL REPORT
A table: Area | Before | After | Needs me. Also include: all env vars/secrets and where to get each one (Supabase, Google OAuth, Bunny Stream, Expo push), the exact commands to deploy migrations/functions, and the V2 list (fees + Razorpay, phone OTP, dark mode, iOS Screen Time blocking, Android app blocker, timetable, report cards, leave requests, transport).
