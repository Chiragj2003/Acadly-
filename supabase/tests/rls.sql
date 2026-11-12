-- ==============================================================================
-- ACADLY RLS & MULTI-TENANT VERIFICATION SUITE (pgTAP)
-- File: supabase/tests/rls.sql
-- Proves:
--   1. Every RLS-enabled table has at least one policy
--   2. Student A cannot read Student B attendance, results, or submissions
--   3. Parent sees only linked children
--   4. Teacher sees only their own batches
--   5. A user in Institute X cannot read Institute Y rows
-- ==============================================================================

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(12);

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

SELECT * FROM finish();
ROLLBACK;
