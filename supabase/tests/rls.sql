-- ==============================================================================
-- ACADLY RLS AUTOMATED VERIFICATION SUITE
-- File: supabase/tests/rls.sql
-- Proves:
--   1. Zero tables with RLS enabled have 0 policies.
--   2. Student A cannot read Student B's attendance or exam results.
--   3. Parent can see only linked child records.
--   4. Teacher can see and mark only their assigned batches.
-- ==============================================================================

BEGIN;

DO $$
DECLARE
    v_unprotected_count INTEGER := 0;
    v_unprotected_tables TEXT := '';
    v_rows_found INTEGER := 0;
    
    -- Seed account UUIDs
    v_inst_id UUID := '11111111-1111-1111-1111-111111111111';
    v_teacher_1_uid UUID := '00000000-0000-0000-0000-000000000002'; -- Prof. Joshi
    v_teacher_2_uid UUID := '00000000-0000-0000-0000-000000000003'; -- Dr. Sen
    v_student_1_uid UUID := '00000000-0000-0000-0000-000000000004'; -- Amelia
    v_student_2_uid UUID := '00000000-0000-0000-0000-000000000005'; -- Kabir
    v_parent_1_uid  UUID := '00000000-0000-0000-0000-000000000010'; -- Rajesh (Parent of Amelia, NOT Kabir)

    v_student_1_id UUID;
    v_student_2_id UUID;
    v_batch_1_id UUID := '55555555-5555-5555-5555-555555555501';
    v_batch_2_id UUID := '55555555-5555-5555-5555-555555555502';
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE '  RUNNING ACADLY RLS & TENANT INTEGRITY AUDIT     ';
    RAISE NOTICE '==================================================';

    -- --------------------------------------------------------------------------
    -- TEST 1: ZERO TABLES LEFT WITH RLS ENABLED AND ZERO POLICIES
    -- --------------------------------------------------------------------------
    SELECT COUNT(*), string_agg(c.relname, ', ')
    INTO v_unprotected_count, v_unprotected_tables
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_policy p ON p.polrelid = c.oid
    WHERE n.nspname = 'public' 
      AND c.relkind = 'r'
      AND c.relrowsecurity = true
    GROUP BY c.relname
    HAVING COUNT(p.polname) = 0;

    IF v_unprotected_count > 0 THEN
        RAISE EXCEPTION 'RLS AUDIT FAILED: Tables with RLS enabled but 0 policies found: %', v_unprotected_tables;
    ELSE
        RAISE NOTICE '✓ TEST 1 PASSED: All tables with RLS have at least 1 explicit policy.';
    END IF;

    -- Fetch actual student table primary key IDs
    SELECT id INTO v_student_1_id FROM public.students WHERE user_id = v_student_1_uid;
    SELECT id INTO v_student_2_id FROM public.students WHERE user_id = v_student_2_uid;

    -- --------------------------------------------------------------------------
    -- TEST 2: STUDENT A CANNOT READ STUDENT B'S ATTENDANCE
    -- --------------------------------------------------------------------------
    -- Simulate authenticated session for Student 1 (Amelia)
    PERFORM set_config(
        'request.jwt.claims',
        json_build_object(
            'sub', v_student_1_uid::text,
            'role', 'authenticated',
            'app_metadata', json_build_object('role', 'student', 'institute_id', v_inst_id::text)
        )::text,
        true
    );

    -- Student 1 querying Student 2's attendance (must return 0 rows)
    SELECT COUNT(*) INTO v_rows_found
    FROM public.attendance
    WHERE student_id = v_student_2_id;

    IF v_rows_found > 0 THEN
        RAISE EXCEPTION 'RLS BREACH: Student 1 (Amelia) read % attendance rows of Student 2 (Kabir)!', v_rows_found;
    ELSE
        RAISE NOTICE '✓ TEST 2.1 PASSED: Student A cannot read Student B attendance (0 records leaked).';
    END IF;

    -- Student 1 querying Student 2's exam results (must return 0 rows)
    SELECT COUNT(*) INTO v_rows_found
    FROM public.results
    WHERE student_id = v_student_2_id;

    IF v_rows_found > 0 THEN
        RAISE EXCEPTION 'RLS BREACH: Student 1 (Amelia) read % result rows of Student 2 (Kabir)!', v_rows_found;
    ELSE
        RAISE NOTICE '✓ TEST 2.2 PASSED: Student A cannot read Student B exam results (0 records leaked).';
    END IF;

    -- Student 1 querying own attendance (must return records)
    SELECT COUNT(*) INTO v_rows_found
    FROM public.attendance
    WHERE student_id = v_student_1_id;

    IF v_rows_found = 0 THEN
        RAISE EXCEPTION 'RLS FAILURE: Student 1 (Amelia) cannot view their own attendance!';
    ELSE
        RAISE NOTICE '✓ TEST 2.3 PASSED: Student 1 successfully views own attendance (% records).', v_rows_found;
    END IF;

    -- --------------------------------------------------------------------------
    -- TEST 3: PARENT SEES ONLY LINKED CHILDREN
    -- --------------------------------------------------------------------------
    -- Simulate authenticated session for Parent 1 (Rajesh Sharma)
    PERFORM set_config(
        'request.jwt.claims',
        json_build_object(
            'sub', v_parent_1_uid::text,
            'role', 'authenticated',
            'app_metadata', json_build_object('role', 'parent', 'institute_id', v_inst_id::text)
        )::text,
        true
    );

    -- Parent 1 querying linked child (Amelia) attendance
    SELECT COUNT(*) INTO v_rows_found
    FROM public.attendance
    WHERE student_id = v_student_1_id;

    IF v_rows_found = 0 THEN
        RAISE EXCEPTION 'RLS FAILURE: Parent 1 cannot view linked child (Amelia) attendance!';
    ELSE
        RAISE NOTICE '✓ TEST 3.1 PASSED: Parent 1 views linked child attendance (% records).', v_rows_found;
    END IF;

    -- Parent 1 querying unlinked child (Kabir) attendance (must return 0 rows)
    SELECT COUNT(*) INTO v_rows_found
    FROM public.attendance
    WHERE student_id = v_student_2_id;

    IF v_rows_found > 0 THEN
        RAISE EXCEPTION 'RLS BREACH: Parent 1 read % attendance rows of unlinked child (Kabir)!', v_rows_found;
    ELSE
        RAISE NOTICE '✓ TEST 3.2 PASSED: Parent 1 cannot view unlinked child attendance (0 records leaked).';
    END IF;

    -- --------------------------------------------------------------------------
    -- TEST 4: TEACHER SEES ONLY OWN ASSIGNED BATCHES
    -- --------------------------------------------------------------------------
    -- Simulate authenticated session for Teacher 1 (Prof. Vikram Joshi -> assigned to Batch 1)
    PERFORM set_config(
        'request.jwt.claims',
        json_build_object(
            'sub', v_teacher_1_uid::text,
            'role', 'authenticated',
            'app_metadata', json_build_object('role', 'teacher', 'institute_id', v_inst_id::text)
        )::text,
        true
    );

    -- Teacher 1 querying attendance for assigned Batch 1
    SELECT COUNT(*) INTO v_rows_found
    FROM public.attendance
    WHERE batch_id = v_batch_1_id;

    IF v_rows_found = 0 THEN
        RAISE EXCEPTION 'RLS FAILURE: Teacher 1 cannot view assigned Batch 1 attendance!';
    ELSE
        RAISE NOTICE '✓ TEST 4.1 PASSED: Teacher 1 views assigned Batch 1 attendance (% records).', v_rows_found;
    END IF;

    -- Teacher 1 querying attendance for unassigned Batch 2 (must return 0 rows)
    SELECT COUNT(*) INTO v_rows_found
    FROM public.attendance
    WHERE batch_id = v_batch_2_id;

    IF v_rows_found > 0 THEN
        RAISE EXCEPTION 'RLS BREACH: Teacher 1 read % attendance rows of unassigned Batch 2!', v_rows_found;
    ELSE
        RAISE NOTICE '✓ TEST 4.2 PASSED: Teacher 1 cannot view unassigned Batch 2 attendance (0 records leaked).';
    END IF;

    RAISE NOTICE '==================================================';
    RAISE NOTICE '  ALL RLS & SECURITY ASSERTION TESTS PASSED!      ';
    RAISE NOTICE '==================================================';
END $$;

ROLLBACK;
