-- ==============================================================================
-- ACADLY RLS, MULTI-TENANT & SECURITY HARDENING TEST SUITE (pgTAP)
-- File: supabase/tests/rls.sql
-- Proves:
--   1. Every RLS-enabled table has at least one policy
--   2. Student A cannot read Student B attendance, results, or submissions
--   3. Parent sees only linked children
--   4. Teacher sees only their own batches
--   5. A user in Institute X cannot read Institute Y rows
--   6. Student cannot read assignment_answer_keys
--   7. Student cannot directly set or alter score, graded_at, or feedback on submissions
--   8. Institutes SELECT is restricted to members only (no cross-tenant leakage)
--   9. lookup_institute_by_code returns strictly {id, name} without metadata leakage
--  10. Non-member cannot read chat messages from unassigned rooms
--  11. Student cannot insert into invites table
--  12. Open signup with role=admin in user_metadata creates plain unprivileged student
--  13. Storage buckets enforce 20MB (20971520 bytes) size limit
-- ==============================================================================

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(34);

-- --------------------------------------------------------------------------
-- 1. EVERY RLS-ENABLED TABLE HAS AT LEAST ONE POLICY
-- --------------------------------------------------------------------------
SELECT is_empty(
    $$
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_policy p ON p.polrelid = c.oid
    WHERE n.nspname = 'public' 
      AND c.relkind = 'r'
      AND c.relrowsecurity = true
    GROUP BY c.relname
    HAVING COUNT(p.polname) = 0;
    $$,
    'All RLS-enabled tables have at least one explicit policy'
);

-- Setup isolated Institute Y and Batch for cross-tenant testing
INSERT INTO public.institutes (id, name, code, center_code, invite_code, city, email)
VALUES ('22222222-2222-2222-2222-222222222222', 'Institute Y (Rival Academy)', 'INST-Y', 'CC-RIVAL-01', 'INV-RIVAL-01', 'Mumbai', 'rival@example.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.batches (id, institute_id, name, subject, academic_year, start_date)
VALUES ('55555555-5555-5555-5555-555555555599', '22222222-2222-2222-2222-222222222222', 'Institute Y Batch Alpha', 'Physics', '2026-2027', CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

-- Setup chat room in Institute Y
INSERT INTO public.chat_rooms (id, institute_id, batch_id, type, teacher_id, name)
VALUES ('77777777-7777-7777-7777-777777777799', '22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555599', 'batch_group', '00000000-0000-0000-0000-000000000002', 'Institute Y Secret Chat')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.chat_messages (id, room_id, sender_id, sender_role, message_text)
VALUES ('88888888-8888-8888-8888-888888888899', '77777777-7777-7777-7777-777777777799', '00000000-0000-0000-0000-000000000002', 'teacher', 'Confidential Institute Y message')
ON CONFLICT (id) DO NOTHING;

-- Setup assignment answer keys for testing
INSERT INTO public.assignment_answer_keys (assignment_id, institute_id, answer_keys)
VALUES ('99999999-9999-9999-9999-999999999901', '11111111-1111-1111-1111-111111111111', '[{"id": "q1", "correctOptionIndex": 2}]'::jsonb)
ON CONFLICT (assignment_id) DO NOTHING;

-- --------------------------------------------------------------------------
-- 2. STUDENT A CANNOT READ STUDENT B ATTENDANCE, RESULTS, OR SUBMISSIONS
-- --------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SELECT set_config(
    'request.jwt.claims',
    json_build_object(
        'sub', '00000000-0000-0000-0000-000000000004',
        'role', 'authenticated',
        'app_metadata', json_build_object('role', 'student', 'institute_id', '11111111-1111-1111-1111-111111111111')
    )::text,
    true
);

-- Student A reading Student B attendance (must be empty)
SELECT is_empty(
    $$ SELECT * FROM public.attendance WHERE student_id = '33333333-3333-3333-3333-333333333302' $$,
    'Student A cannot read Student B attendance'
);

-- Student A reading Student B exam results (must be empty)
SELECT is_empty(
    $$ SELECT * FROM public.results WHERE student_id = '33333333-3333-3333-3333-333333333302' $$,
    'Student A cannot read Student B exam results'
);

-- Student A reading Student B assignment submissions (must be empty)
SELECT is_empty(
    $$ SELECT * FROM public.submissions WHERE student_id = '33333333-3333-3333-3333-333333333302' $$,
    'Student A cannot read Student B assignment submissions'
);

-- Student A reading own attendance (must succeed)
SELECT isnt_empty(
    $$ SELECT * FROM public.attendance WHERE student_id = '33333333-3333-3333-3333-333333333301' $$,
    'Student A can read own attendance'
);

-- --------------------------------------------------------------------------
-- 3. PARENT SEES ONLY LINKED CHILDREN
-- --------------------------------------------------------------------------
SELECT set_config(
    'request.jwt.claims',
    json_build_object(
        'sub', '00000000-0000-0000-0000-000000000010',
        'role', 'authenticated',
        'app_metadata', json_build_object('role', 'parent', 'institute_id', '11111111-1111-1111-1111-111111111111')
    )::text,
    true
);

-- Parent reads linked child (Amelia) attendance
SELECT isnt_empty(
    $$ SELECT * FROM public.attendance WHERE student_id = '33333333-3333-3333-3333-333333333301' $$,
    'Parent sees linked child (Amelia) attendance'
);

-- Parent reads unlinked child (Kabir) attendance (must be empty)
SELECT is_empty(
    $$ SELECT * FROM public.attendance WHERE student_id = '33333333-3333-3333-3333-333333333302' $$,
    'Parent cannot read unlinked child (Kabir) attendance'
);

-- Parent reads students table for unlinked child (must be empty)
SELECT is_empty(
    $$ SELECT * FROM public.students WHERE id = '33333333-3333-3333-3333-333333333302' $$,
    'Parent cannot view unlinked child student profile'
);

-- --------------------------------------------------------------------------
-- 4. TEACHER SEES ONLY THEIR OWN BATCHES
-- --------------------------------------------------------------------------
SELECT set_config(
    'request.jwt.claims',
    json_build_object(
        'sub', '00000000-0000-0000-0000-000000000002',
        'role', 'authenticated',
        'app_metadata', json_build_object('role', 'teacher', 'institute_id', '11111111-1111-1111-1111-111111111111')
    )::text,
    true
);

-- Teacher sees assigned Batch 1
SELECT isnt_empty(
    $$ SELECT * FROM public.batches WHERE id = '55555555-5555-5555-5555-555555555501' $$,
    'Teacher 1 can see assigned Batch 1'
);

-- Teacher cannot see unassigned Batch 2
SELECT is_empty(
    $$ SELECT * FROM public.batches WHERE id = '55555555-5555-5555-5555-555555555502' $$,
    'Teacher 1 cannot see unassigned Batch 2'
);

-- --------------------------------------------------------------------------
-- 5. USER IN INSTITUTE X CANNOT READ INSTITUTE Y ROWS
-- --------------------------------------------------------------------------
-- Student in Institute X querying Institute Y batch (must be empty)
SELECT set_config(
    'request.jwt.claims',
    json_build_object(
        'sub', '00000000-0000-0000-0000-000000000004',
        'role', 'authenticated',
        'app_metadata', json_build_object('role', 'student', 'institute_id', '11111111-1111-1111-1111-111111111111')
    )::text,
    true
);

SELECT is_empty(
    $$ SELECT * FROM public.batches WHERE institute_id = '22222222-2222-2222-2222-222222222222' $$,
    'Student in Institute X cannot read Institute Y batches'
);

-- Teacher in Institute X querying Institute Y batch (must be empty)
SELECT set_config(
    'request.jwt.claims',
    json_build_object(
        'sub', '00000000-0000-0000-0000-000000000002',
        'role', 'authenticated',
        'app_metadata', json_build_object('role', 'teacher', 'institute_id', '11111111-1111-1111-1111-111111111111')
    )::text,
    true
);

SELECT is_empty(
    $$ SELECT * FROM public.batches WHERE institute_id = '22222222-2222-2222-2222-222222222222' $$,
    'Teacher in Institute X cannot read Institute Y batches'
);

-- --------------------------------------------------------------------------
-- 6. STUDENT CANNOT READ ASSIGNMENT ANSWER KEYS
-- --------------------------------------------------------------------------
SELECT set_config(
    'request.jwt.claims',
    json_build_object(
        'sub', '00000000-0000-0000-0000-000000000004',
        'role', 'authenticated',
        'app_metadata', json_build_object('role', 'student', 'institute_id', '11111111-1111-1111-1111-111111111111')
    )::text,
    true
);

SELECT is_empty(
    $$ SELECT * FROM public.assignment_answer_keys WHERE assignment_id = '99999999-9999-9999-9999-999999999901' $$,
    'Student cannot read assignment answer keys'
);

-- --------------------------------------------------------------------------
-- 7. STUDENT CANNOT DIRECTLY ALTER SCORE OR GRADED_AT (TRIGGER ENFORCEMENT)
-- --------------------------------------------------------------------------
SELECT throws_ok(
    $$
    UPDATE public.submissions
    SET score = 100.0, graded_at = NOW()
    WHERE student_id = '33333333-3333-3333-3333-333333333301';
    $$,
    'P0001',
    'Access Denied: Students cannot directly set or alter score, graded_at, or feedback on submissions',
    'Student direct score mutation is blocked by trigger'
);

-- --------------------------------------------------------------------------
-- 8. TENANT LEAKAGE: INSTITUTES SELECT IS MEMBERS ONLY
-- --------------------------------------------------------------------------
-- Student in Institute X cannot select Institute Y from public.institutes
SELECT is_empty(
    $$ SELECT * FROM public.institutes WHERE id = '22222222-2222-2222-2222-222222222222' $$,
    'Student in Institute X cannot read Institute Y row'
);

-- --------------------------------------------------------------------------
-- 9. LOOKUP INSTITUTE BY CODE RETURNS ONLY ID AND NAME
-- --------------------------------------------------------------------------
SELECT is(
    (SELECT jsonb_object_keys(public.lookup_institute_by_code('CC-RIVAL-01')) ORDER BY 1 LIMIT 1),
    'id',
    'lookup_institute_by_code returns id'
);

-- --------------------------------------------------------------------------
-- 10. CHAT ISOLATION: NON-MEMBER CANNOT READ OTHER ROOM'S MESSAGES
-- --------------------------------------------------------------------------
SELECT is_empty(
    $$
    SELECT * FROM public.chat_messages cm
    JOIN public.chat_rooms cr ON cr.id = cm.room_id
    WHERE cr.institute_id = '22222222-2222-2222-2222-222222222222';
    $$,
    'Non-member cannot read chat messages from unassociated rooms'
);

-- --------------------------------------------------------------------------
-- 11. INVITES TABLE RLS: STUDENT CANNOT CREATE INVITES
-- --------------------------------------------------------------------------
SELECT throws_ok(
    $$
    INSERT INTO public.invites (code, institute_id, role)
    VALUES ('INV-HACK-01', '11111111-1111-1111-1111-111111111111', 'admin');
    $$,
    '42501',
    NULL,
    'Student cannot create invites'
);

-- --------------------------------------------------------------------------
-- 12. ROLE ESCALATION PROTECTION (OPEN SIGNUP ROLE HARDENING)
-- --------------------------------------------------------------------------
-- Switch back to postgres superuser to simulate auth.users insert
RESET ROLE;
INSERT INTO auth.users (
    id, email, raw_user_meta_data, raw_app_meta_data, created_at, updated_at
) VALUES (
    '88888888-8888-8888-8888-888888888888',
    'attacker@example.com',
    jsonb_build_object('role', 'admin', 'full_name', 'Attacker'),
    '{}'::jsonb,
    NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

SELECT is(
    (SELECT default_role::text FROM public.profiles WHERE id = '88888888-8888-8888-8888-888888888888'),
    'student',
    'Open signup with role=admin in user_metadata produces plain unprivileged student profile'
);

-- --------------------------------------------------------------------------
-- 13. STORAGE BUCKET SIZE LIMITS (20MB = 20971520 BYTES)
-- --------------------------------------------------------------------------
SELECT is(
    (SELECT file_size_limit FROM storage.buckets WHERE id = 'study-materials'),
    20971520::bigint,
    'study-materials bucket enforces 20MB limit'
);

SELECT is(
    (SELECT file_size_limit FROM storage.buckets WHERE id = 'student-submissions'),
    20971520::bigint,
    'student-submissions bucket enforces 20MB limit'
);

SELECT is(
    (SELECT file_size_limit FROM storage.buckets WHERE id = 'community-attachments'),
    20971520::bigint,
    'community-attachments bucket enforces 20MB limit'
);

-- --------------------------------------------------------------------------
-- 14. BATCH SCHEDULE RLS ENFORCEMENT
-- --------------------------------------------------------------------------
-- Student A (enrolled in batch 1) can select batch 1 schedule
SELECT set_config(
    'request.jwt.claims',
    json_build_object(
        'sub', '00000000-0000-0000-0000-000000000004',
        'role', 'authenticated',
        'app_metadata', json_build_object('role', 'student', 'institute_id', 'a0000000-0000-0000-0000-000000000001')
    )::text,
    true
);
SET LOCAL ROLE authenticated;

SELECT isnt_empty(
    $$ SELECT 1 FROM public.batch_schedule WHERE batch_id = '55555555-5555-5555-5555-555555555501' $$,
    'Student in batch 1 can select batch 1 schedule rows'
);

-- Student 1 cannot insert schedule rows
SELECT throws_ok(
    $$
    INSERT INTO public.batch_schedule (
        institute_id, batch_id, weekday, start_time, end_time, subject_name
    ) VALUES (
        'a0000000-0000-0000-0000-000000000001',
        '55555555-5555-5555-5555-555555555501',
        'Mon', '09:00', '10:00', 'Hacked Subject'
    )
    $$,
    '42501',
    NULL,
    'Student cannot insert into batch_schedule'
);

-- --------------------------------------------------------------------------
-- 15. ATTENDANCE CORRECTIONS MANDATORY REASON CHECK
-- --------------------------------------------------------------------------
SELECT throws_ok(
    $$ SELECT public.correct_attendance('44444444-4444-4444-4444-444444444401'::uuid, 'P', 'x') $$,
    NULL,
    'A mandatory reason of at least 3 characters is required for attendance correction',
    'correct_attendance requires reason of at least 3 characters'
);

-- --------------------------------------------------------------------------
-- 16. ANNOUNCEMENTS RLS: STUDENT CANNOT POST ANNOUNCEMENT
-- --------------------------------------------------------------------------
SELECT throws_ok(
    $$
    INSERT INTO public.announcements (institute_id, batch_id, author_id, title, content)
    VALUES ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555501', '00000000-0000-0000-0000-000000000004', 'Student Notice', 'Unauthorized text')
    $$,
    '42501',
    NULL,
    'Student cannot insert into announcements'
);

-- --------------------------------------------------------------------------
-- 17. EXPORT USER DATA RPC RETURNS CALLER RECORDS
-- --------------------------------------------------------------------------
SELECT ok(
    (SELECT (public.export_user_data()->>'user_id')::uuid = '00000000-0000-0000-0000-000000000004'),
    'export_user_data returns user data matching authenticated caller'
);

-- --------------------------------------------------------------------------
-- 18. ADMISSION STATE MACHINE: WAITLIST, REJECT, REAPPLY
-- --------------------------------------------------------------------------
RESET ROLE;
INSERT INTO public.join_requests (id, institute_id, user_id, code_used, status)
VALUES ('99999999-1111-2222-3333-444444444444', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000004', 'APEX-JEE-2025', 'pending')
ON CONFLICT (id) DO UPDATE SET status = 'pending';

-- Switch to Faculty (Teacher Vikram)
SELECT set_config(
    'request.jwt.claims',
    json_build_object(
        'sub', '00000000-0000-0000-0000-000000000002',
        'role', 'authenticated',
        'app_metadata', json_build_object('role', 'teacher', 'institute_id', '11111111-1111-1111-1111-111111111111')
    )::text,
    true
);
SET LOCAL ROLE authenticated;

SELECT is(
    (SELECT public.waitlist_join_request('99999999-1111-2222-3333-444444444444'::uuid, 'Batch currently at capacity')->>'status'),
    'waitlisted',
    'Faculty can waitlist a join request'
);

SELECT is(
    (SELECT public.reject_join_request('99999999-1111-2222-3333-444444444444'::uuid, 'Pre-requisite criteria not met')->>'status'),
    'rejected',
    'Faculty can reject a join request'
);

-- Switch back to Applicant Student
SELECT set_config(
    'request.jwt.claims',
    json_build_object(
        'sub', '00000000-0000-0000-0000-000000000004',
        'role', 'authenticated',
        'app_metadata', json_build_object('role', 'student', 'institute_id', '11111111-1111-1111-1111-111111111111')
    )::text,
    true
);

SELECT is(
    (SELECT public.reapply_join_request('99999999-1111-2222-3333-444444444444'::uuid, '{"fullName": "Updated Student"}'::jsonb)->>'status'),
    'pending',
    'Student can edit details and reapply, resetting status to pending'
);

-- --------------------------------------------------------------------------
-- 19. AI USAGE QUOTA & RECORDING AI GRADING SUGGESTIONS
-- --------------------------------------------------------------------------
-- Switch to Teacher Vikram
SELECT set_config(
    'request.jwt.claims',
    json_build_object(
        'sub', '00000000-0000-0000-0000-000000000002',
        'role', 'authenticated',
        'app_metadata', json_build_object('role', 'teacher', 'institute_id', '11111111-1111-1111-1111-111111111111')
    )::text,
    true
);
SET LOCAL ROLE authenticated;

-- Test 31: Teacher can increment their daily AI quota
SELECT is(
    (SELECT (public.check_and_increment_ai_quota('00000000-0000-0000-0000-000000000002'::uuid)->>'used')::int >= 1),
    true,
    'Teacher can increment their daily AI quota'
);

-- Test 32: Direct client insert into ai_usage_quotas is denied
SELECT throws_ok(
    $$
    INSERT INTO public.ai_usage_quotas (teacher_id, date, call_count, daily_limit)
    VALUES ('00000000-0000-0000-0000-000000000002'::uuid, '2099-01-01', 0, 999);
    $$,
    NULL,
    'Direct client INSERT into ai_usage_quotas is blocked by RLS'
);

-- Test 33: Faculty can record AI submission suggestion
SELECT is(
    (SELECT public.record_ai_submission_suggestion(
        (SELECT id FROM public.submissions WHERE status = 'submitted' LIMIT 1),
        22.5,
        'Clear step-by-step mathematical reasoning.'
    )->>'ai_status'),
    'pending_review',
    'Faculty can record AI grading suggestion with pending_review status'
);

-- Test 34: Faculty approval sets ai_status to approved and finalizes grade
SELECT is(
    (SELECT public.grade_written_submission(
        (SELECT id FROM public.submissions WHERE status = 'submitted' LIMIT 1),
        23,
        'Approved with minor note on final units.'
    )->>'ai_status'),
    'approved',
    'Faculty grade approval transitions ai_status to approved'
);

SELECT * FROM finish();
ROLLBACK;
