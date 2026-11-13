-- ==============================================================================
-- CANONICAL MIGRATION: 0009_security_hardening_round1.sql
-- Modules:
--   1. Role Security & Onboarding (Invites table, Server-Side Role Stamping, Trigger Hardening)
--   2. Secure Quiz Grading (assignment_answer_keys, get_quiz_for_student, submit_quiz, Submissions trigger)
--   3. Chat Security & Room Isolation
--   4. Tenant Isolation (Institutes Member-Only RLS & Throttled lookup_institute_by_code)
--   5. Atomic RPCs (approve_join_request, commit_attendance, correct_attendance)
--   6. Storage MIME & 20MB Size Limits
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ROLE SECURITY & ONBOARDING
-- ------------------------------------------------------------------------------

-- Helper alias for is_student_in_batch
CREATE OR REPLACE FUNCTION public.is_student_of_batch(target_batch_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT public.is_student_in_batch(target_batch_id);
$$;

-- 1.1 Invites Table
CREATE TABLE IF NOT EXISTS public.invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    role app_role_enum NOT NULL DEFAULT 'student',
    batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ,
    max_uses INT NOT NULL DEFAULT 1,
    used_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invites_code ON public.invites(code);
CREATE INDEX IF NOT EXISTS idx_invites_institute ON public.invites(institute_id);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Invites RLS: Teachers and Admins can manage their institute's invites
DROP POLICY IF EXISTS "invites_staff_manage" ON public.invites;
CREATE POLICY "invites_staff_manage" ON public.invites
    FOR ALL TO authenticated
    USING (
        public.is_institute_admin(institute_id)
        OR (batch_id IS NOT NULL AND public.is_teacher_of_batch(batch_id))
    )
    WITH CHECK (
        public.is_institute_admin(institute_id)
        OR (batch_id IS NOT NULL AND public.is_teacher_of_batch(batch_id))
    );

-- Authenticated users can view an invite by exact code for joining
DROP POLICY IF EXISTS "invites_code_lookup" ON public.invites;
CREATE POLICY "invites_code_lookup" ON public.invites
    FOR SELECT TO authenticated
    USING (
        expires_at IS NULL OR expires_at > NOW()
    );

-- 1.2 Hardened Auth Trigger: Never Trust Client user_metadata for Privileged Roles
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role app_role_enum := 'student';
    user_full_name TEXT := '';
    target_inst_id UUID := NULL;
    raw_app_role TEXT;
BEGIN
    -- Extract full name from client metadata or fallback to email local part
    user_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    -- IMPORTANT SECURITY GUARANTEE:
    -- Only read role from raw_app_meta_data (set server-side via service role / RPC).
    -- NEVER trust raw_user_meta_data->>'role'! Open signup creates a plain student account with no privileges.
    raw_app_role := NEW.raw_app_meta_data->>'role';
    IF raw_app_role IN ('admin', 'teacher', 'student', 'parent') THEN
        user_role := raw_app_role::app_role_enum;
    ELSE
        user_role := 'student';
    END IF;

    -- Extract institute_id only from raw_app_meta_data
    IF (NEW.raw_app_meta_data->>'institute_id') IS NOT NULL THEN
        BEGIN
            target_inst_id := (NEW.raw_app_meta_data->>'institute_id')::UUID;
        EXCEPTION WHEN OTHERS THEN
            target_inst_id := NULL;
        END;
    END IF;

    -- Insert into public.profiles
    INSERT INTO public.profiles (id, email, full_name, default_role)
    VALUES (NEW.id, NEW.email, user_full_name, user_role)
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        default_role = CASE
            -- Do not allow profile role escalation if already set
            WHEN public.profiles.default_role IN ('admin', 'teacher') THEN public.profiles.default_role
            ELSE EXCLUDED.default_role
        END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- 1.3 Path B: Accept Invite Code (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.accept_invite_code(
    p_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_clean_code TEXT;
    v_invite RECORD;
    v_student_id UUID;
    v_user_profile RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    v_clean_code := upper(trim(p_code));

    SELECT * INTO v_invite
    FROM public.invites
    WHERE upper(code) = v_clean_code
    FOR UPDATE;

    IF v_invite.id IS NULL THEN
        RAISE EXCEPTION 'Invalid invite code';
    END IF;

    IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < NOW() THEN
        RAISE EXCEPTION 'Invite code has expired';
    END IF;

    IF v_invite.max_uses > 0 AND v_invite.used_count >= v_invite.max_uses THEN
        RAISE EXCEPTION 'Invite code has exceeded maximum uses';
    END IF;

    SELECT full_name, email INTO v_user_profile FROM public.profiles WHERE id = v_user_id;

    -- Handle Student Onboarding
    IF v_invite.role = 'student' THEN
        INSERT INTO public.students (
            institute_id,
            user_id,
            roll_number,
            admission_number,
            parent_link_code
        ) VALUES (
            v_invite.institute_id,
            v_user_id,
            '#' || floor(100 + random() * 900)::text,
            '#' || floor(100 + random() * 900)::text,
            'STU-' || upper(substring(regexp_replace(v_user_profile.full_name, '[^a-zA-Z0-9]', '', 'g') from 1 for 4)) || '-' || floor(100 + random() * 900)::text
        ) ON CONFLICT (institute_id, user_id) DO UPDATE
        SET updated_at = NOW()
        RETURNING id INTO v_student_id;

        IF v_invite.batch_id IS NOT NULL THEN
            INSERT INTO public.batch_students (institute_id, batch_id, student_id, status)
            VALUES (v_invite.institute_id, v_invite.batch_id, v_student_id, 'enrolled')
            ON CONFLICT (batch_id, student_id) DO NOTHING;
        END IF;

        INSERT INTO public.institute_members (institute_id, user_id, role, status, verification_status)
        VALUES (v_invite.institute_id, v_user_id, 'student', 'active', 'verified')
        ON CONFLICT (institute_id, user_id, role) DO UPDATE
        SET status = 'active', verification_status = 'verified';

        UPDATE public.profiles SET default_role = 'student' WHERE id = v_user_id;

        UPDATE auth.users
        SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'student', 'institute_id', v_invite.institute_id)
        WHERE id = v_user_id;

    -- Handle Teacher Onboarding
    ELSIF v_invite.role = 'teacher' THEN
        INSERT INTO public.teachers (
            institute_id,
            user_id,
            teacher_code,
            mode
        ) VALUES (
            v_invite.institute_id,
            v_user_id,
            'TCH-' || upper(substring(regexp_replace(v_user_profile.full_name, '[^a-zA-Z0-9]', '', 'g') from 1 for 4)) || '-' || floor(100 + random() * 900)::text,
            'coaching_faculty'
        ) ON CONFLICT (institute_id, user_id) DO UPDATE
        SET updated_at = NOW();

        INSERT INTO public.institute_members (institute_id, user_id, role, status, verification_status)
        VALUES (v_invite.institute_id, v_user_id, 'teacher', 'active', 'verified')
        ON CONFLICT (institute_id, user_id, role) DO UPDATE
        SET status = 'active', verification_status = 'verified';

        UPDATE public.profiles SET default_role = 'teacher' WHERE id = v_user_id;

        UPDATE auth.users
        SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'teacher', 'institute_id', v_invite.institute_id)
        WHERE id = v_user_id;
    END IF;

    -- Increment usage
    UPDATE public.invites
    SET used_count = used_count + 1, updated_at = NOW()
    WHERE id = v_invite.id;

    RETURN jsonb_build_object(
        'success', true,
        'institute_id', v_invite.institute_id,
        'role', v_invite.role,
        'batch_id', v_invite.batch_id
    );
END;
$$;


-- ------------------------------------------------------------------------------
-- 2. SECURE QUIZ GRADING & SUBMISSIONS PROTECTION
-- ------------------------------------------------------------------------------

-- 2.1 assignment_answer_keys Table (Teacher & Admin Only)
CREATE TABLE IF NOT EXISTS public.assignment_answer_keys (
    assignment_id UUID PRIMARY KEY REFERENCES public.assignments(id) ON DELETE CASCADE,
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    answer_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Copy existing keys from quiz_answer_keys if table exists
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quiz_answer_keys') THEN
        INSERT INTO public.assignment_answer_keys (assignment_id, institute_id, answer_keys, created_at, updated_at)
        SELECT assignment_id, institute_id, answer_keys, created_at, updated_at
        FROM public.quiz_answer_keys
        ON CONFLICT (assignment_id) DO NOTHING;
    END IF;
END $$;

ALTER TABLE public.assignment_answer_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assignment_answer_keys_teacher_manage" ON public.assignment_answer_keys;
CREATE POLICY "assignment_answer_keys_teacher_manage" ON public.assignment_answer_keys
    FOR ALL TO authenticated
    USING (
        public.is_institute_admin(institute_id)
        OR EXISTS (
            SELECT 1 FROM public.assignments a
            WHERE a.id = assignment_answer_keys.assignment_id
              AND public.is_teacher_of_batch(a.batch_id)
        )
    )
    WITH CHECK (
        public.is_institute_admin(institute_id)
        OR EXISTS (
            SELECT 1 FROM public.assignments a
            WHERE a.id = assignment_answer_keys.assignment_id
              AND public.is_teacher_of_batch(a.batch_id)
        )
    );

-- 2.2 SECURITY DEFINER RPC: get_quiz_for_student (Strips answer keys and explanations)
CREATE OR REPLACE FUNCTION public.get_quiz_for_student(
    p_assignment_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_assignment RECORD;
    v_caller_uid UUID;
    v_sanitized_questions JSONB := '[]'::jsonb;
    v_item JSONB;
    v_sanitized_item JSONB;
BEGIN
    v_caller_uid := auth.uid();
    IF v_caller_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT a.*, b.name AS batch_name
    INTO v_assignment
    FROM public.assignments a
    JOIN public.batches b ON b.id = a.batch_id
    WHERE a.id = p_assignment_id;

    IF v_assignment.id IS NULL THEN
        RAISE EXCEPTION 'Assignment not found';
    END IF;

    -- Verify student is enrolled in the batch or is faculty/admin
    IF NOT (
        public.is_student_of_batch(v_assignment.batch_id)
        OR public.is_teacher_of_batch(v_assignment.batch_id)
        OR public.is_institute_admin(v_assignment.institute_id)
    ) THEN
        RAISE EXCEPTION 'Unauthorized: You are not enrolled in this batch';
    END IF;

    -- Strip correctOptionIndex, expectedAnswerText, explanation from questions
    IF v_assignment.questions IS NOT NULL AND jsonb_array_length(v_assignment.questions) > 0 THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(v_assignment.questions)
        LOOP
            v_sanitized_item := v_item - 'correctOptionIndex' - 'expectedAnswerText' - 'explanation';
            v_sanitized_questions := v_sanitized_questions || jsonb_build_array(v_sanitized_item);
        END LOOP;
    END IF;

    RETURN jsonb_build_object(
        'id', v_assignment.id,
        'institute_id', v_assignment.institute_id,
        'batch_id', v_assignment.batch_id,
        'title', v_assignment.title,
        'description', v_assignment.description,
        'subject', v_assignment.subject,
        'type', v_assignment.type,
        'total_marks', v_assignment.total_marks,
        'passing_marks', v_assignment.passing_marks,
        'due_date', v_assignment.due_date,
        'questions', v_sanitized_questions
    );
END;
$$;

-- 2.3 SECURITY DEFINER RPC: submit_quiz (Grades server-side, writes score to submissions)
CREATE OR REPLACE FUNCTION public.submit_quiz(
    p_assignment_id UUID,
    p_answers JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller_uid UUID;
    v_student RECORD;
    v_assignment RECORD;
    v_answer_keys JSONB;
    v_item JSONB;
    v_question_id TEXT;
    v_type TEXT;
    v_marks NUMERIC(6,2);
    v_total_marks NUMERIC(6,2) := 0;
    v_score NUMERIC(6,2) := 0;
    v_student_ans TEXT;
    v_correct_idx INT;
    v_expected_text TEXT;
    v_is_correct BOOLEAN;
    v_is_passed BOOLEAN := false;
    v_percentage NUMERIC(5,2) := 0;
    v_detailed_review JSONB := '[]'::jsonb;
    v_submission_id UUID;
BEGIN
    v_caller_uid := auth.uid();
    IF v_caller_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Identify student record belonging to caller
    SELECT * INTO v_student
    FROM public.students
    WHERE user_id = v_caller_uid
    LIMIT 1;

    IF v_student.id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Caller has no student record';
    END IF;

    -- Verify assignment exists
    SELECT * INTO v_assignment
    FROM public.assignments
    WHERE id = p_assignment_id;

    IF v_assignment.id IS NULL THEN
        RAISE EXCEPTION 'Assignment not found';
    END IF;

    -- Verify student is enrolled in batch
    IF NOT public.is_student_of_batch(v_assignment.batch_id) THEN
        RAISE EXCEPTION 'Unauthorized: You are not enrolled in this batch';
    END IF;

    -- Fetch answer keys from assignment_answer_keys or fallback to assignment.questions
    SELECT answer_keys INTO v_answer_keys
    FROM public.assignment_answer_keys
    WHERE assignment_id = p_assignment_id;

    IF v_answer_keys IS NULL OR jsonb_array_length(v_answer_keys) = 0 THEN
        v_answer_keys := v_assignment.questions;
    END IF;

    -- Grade server-side
    IF v_answer_keys IS NOT NULL AND jsonb_array_length(v_answer_keys) > 0 THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(v_answer_keys)
        LOOP
            v_question_id := v_item ->> 'id';
            v_type := COALESCE(v_item ->> 'type', 'mcq');
            v_marks := COALESCE((v_item ->> 'marks')::numeric, 1.0);
            v_total_marks := v_total_marks + v_marks;
            v_student_ans := p_answers ->> v_question_id;
            v_is_correct := false;

            IF v_type IN ('mcq', 'true_false') THEN
                v_correct_idx := (v_item ->> 'correctOptionIndex')::int;
                IF v_student_ans IS NOT NULL AND v_correct_idx IS NOT NULL THEN
                    IF v_student_ans::int = v_correct_idx THEN
                        v_is_correct := true;
                        v_score := v_score + v_marks;
                    END IF;
                END IF;
            ELSIF v_type = 'numerical' THEN
                v_expected_text := TRIM(LOWER(COALESCE(v_item ->> 'expectedAnswerText', '')));
                IF v_student_ans IS NOT NULL AND TRIM(LOWER(v_student_ans)) = v_expected_text THEN
                    v_is_correct := true;
                    v_score := v_score + v_marks;
                END IF;
            END IF;

            v_detailed_review := v_detailed_review || jsonb_build_array(jsonb_build_object(
                'id', v_question_id,
                'studentAnswer', v_student_ans,
                'isCorrect', v_is_correct,
                'marksObtained', CASE WHEN v_is_correct THEN v_marks ELSE 0 END,
                'maxMarks', v_marks
            ));
        END LOOP;
    END IF;

    IF v_total_marks > 0 THEN
        v_percentage := ROUND((v_score / v_total_marks) * 100.0, 2);
    END IF;

    v_is_passed := v_score >= COALESCE(v_assignment.passing_marks, (v_total_marks * 0.4));

    -- Mark transaction as running in grading RPC to pass submission protection trigger
    PERFORM set_config('app.in_grading_rpc', 'true', true);

    -- Insert or update submission record
    INSERT INTO public.submissions (
        assignment_id,
        student_id,
        institute_id,
        answers,
        score,
        total_marks,
        percentage,
        is_passed,
        status,
        graded_at,
        submitted_at
    ) VALUES (
        p_assignment_id,
        v_student.id,
        v_assignment.institute_id,
        p_answers,
        v_score,
        v_total_marks,
        v_percentage,
        v_is_passed,
        'graded',
        NOW(),
        NOW()
    ) ON CONFLICT (assignment_id, student_id) DO UPDATE
    SET
        answers = EXCLUDED.answers,
        score = EXCLUDED.score,
        total_marks = EXCLUDED.total_marks,
        percentage = EXCLUDED.percentage,
        is_passed = EXCLUDED.is_passed,
        status = 'graded',
        graded_at = NOW(),
        submitted_at = NOW()
    RETURNING id INTO v_submission_id;

    RETURN jsonb_build_object(
        'success', true,
        'submission_id', v_submission_id,
        'score', v_score,
        'total_marks', v_total_marks,
        'percentage', v_percentage,
        'is_passed', v_is_passed,
        'details', v_detailed_review
    );
END;
$$;

-- 2.4 Submissions Protection Trigger: Prevent Students From Directly Setting score, graded_at, feedback
CREATE OR REPLACE FUNCTION public.check_submissions_student_mutation()
RETURNS TRIGGER AS $$
DECLARE
    v_is_teacher BOOLEAN := false;
BEGIN
    -- Allow internal server-side auto-grading RPC
    IF current_setting('app.in_grading_rpc', true) = 'true' THEN
        RETURN NEW;
    END IF;

    -- Allow system migrations, seed scripts, or service_role operations when unauthenticated
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    -- If score, graded_at, or feedback is being inserted or altered
    IF (TG_OP = 'INSERT' AND (NEW.score IS NOT NULL OR NEW.graded_at IS NOT NULL OR NEW.feedback IS NOT NULL))
       OR (TG_OP = 'UPDATE' AND (
           NEW.score IS DISTINCT FROM OLD.score 
           OR NEW.graded_at IS DISTINCT FROM OLD.graded_at 
           OR NEW.feedback IS DISTINCT FROM OLD.feedback
       )) THEN
        
        -- Check if caller is institute admin or assigned batch teacher
        IF public.is_institute_admin(NEW.institute_id) THEN
            RETURN NEW;
        END IF;

        SELECT EXISTS (
            SELECT 1 FROM public.assignments a
            WHERE a.id = NEW.assignment_id AND public.is_teacher_of_batch(a.batch_id)
        ) INTO v_is_teacher;

        IF v_is_teacher THEN
            RETURN NEW;
        END IF;

        -- Otherwise, student or unauthorized caller attempted to set score/graded_at/feedback!
        RAISE EXCEPTION 'Access Denied: Students cannot directly set or alter score, graded_at, or feedback on submissions';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_check_submissions_student_mutation ON public.submissions;
CREATE TRIGGER trg_check_submissions_student_mutation
    BEFORE INSERT OR UPDATE ON public.submissions
    FOR EACH ROW EXECUTE FUNCTION public.check_submissions_student_mutation();


-- ------------------------------------------------------------------------------
-- 3. CHAT ISOLATION & RLS
-- ------------------------------------------------------------------------------

-- Ensure chat messages are readable and writable ONLY by verified members of the room
DROP POLICY IF EXISTS "chat_messages_select" ON public.chat_messages;
CREATE POLICY "chat_messages_select" ON public.chat_messages
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_rooms cr
            WHERE cr.id = chat_messages.room_id
              AND (
                  cr.teacher_id = auth.uid()
                  OR cr.student_id = auth.uid()
                  OR public.is_institute_admin(cr.institute_id)
                  OR (cr.batch_id IS NOT NULL AND (
                      public.is_teacher_of_batch(cr.batch_id)
                      OR public.is_student_of_batch(cr.batch_id)
                  ))
              )
        )
    );

DROP POLICY IF EXISTS "chat_messages_insert" ON public.chat_messages;
CREATE POLICY "chat_messages_insert" ON public.chat_messages
    FOR INSERT TO authenticated
    WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.chat_rooms cr
            WHERE cr.id = chat_messages.room_id
              AND (
                  cr.teacher_id = auth.uid()
                  OR cr.student_id = auth.uid()
                  OR public.is_institute_admin(cr.institute_id)
                  OR (cr.batch_id IS NOT NULL AND (
                      public.is_teacher_of_batch(cr.batch_id)
                      OR public.is_student_of_batch(cr.batch_id)
                  ))
              )
        )
    );


-- ------------------------------------------------------------------------------
-- 4. TENANT ISOLATION: INSTITUTES SELECT & THROTTLED CODE LOOKUP
-- ------------------------------------------------------------------------------

-- 4.1 Institutes SELECT for members only (Fixes open USING (true) policy)
DROP POLICY IF EXISTS "institutes_select" ON public.institutes;
CREATE POLICY "institutes_select" ON public.institutes
    FOR SELECT TO authenticated
    USING (
        public.is_institute_member(id)
        OR public.is_institute_admin(id)
        OR owner_id = auth.uid()
    );

-- 4.2 Throttling Table for Institute Code Guessing
CREATE TABLE IF NOT EXISTS public.institute_code_lookup_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    code_attempted TEXT NOT NULL,
    attempted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_code_attempts_user ON public.institute_code_lookup_attempts(user_id, attempted_at);

ALTER TABLE public.institute_code_lookup_attempts ENABLE ROW LEVEL SECURITY;
-- No direct client access to attempts table
DROP POLICY IF EXISTS "attempts_no_direct_access" ON public.institute_code_lookup_attempts;
CREATE POLICY "attempts_no_direct_access" ON public.institute_code_lookup_attempts
    FOR ALL TO authenticated
    USING (false);

-- 4.3 SECURITY DEFINER RPC: lookup_institute_by_code (Returns ONLY id and name, throttled)
CREATE OR REPLACE FUNCTION public.lookup_institute_by_code(
    p_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_clean_code TEXT;
    v_attempts INT := 0;
    v_inst RECORD;
    v_caller_uid UUID;
BEGIN
    v_caller_uid := auth.uid();
    v_clean_code := upper(trim(p_code));

    IF length(v_clean_code) < 3 THEN
        RAISE EXCEPTION 'Code must be at least 3 characters';
    END IF;

    -- Throttle: max 5 attempts in 10 minutes per authenticated user
    IF v_caller_uid IS NOT NULL THEN
        SELECT COUNT(*) INTO v_attempts
        FROM public.institute_code_lookup_attempts
        WHERE user_id = v_caller_uid
          AND attempted_at > NOW() - INTERVAL '10 minutes';

        IF v_attempts >= 5 THEN
            RAISE EXCEPTION 'Too many code lookup attempts. Please wait 10 minutes before retrying.';
        END IF;

        -- Record attempt
        INSERT INTO public.institute_code_lookup_attempts (user_id, code_attempted)
        VALUES (v_caller_uid, v_clean_code);
    END IF;

    -- Lookup institute by center_code, invite_code, or general code
    SELECT id, name INTO v_inst
    FROM public.institutes
    WHERE is_active = true
      AND (
          upper(center_code) = v_clean_code
          OR upper(invite_code) = v_clean_code
          OR upper(code) = v_clean_code
      )
    LIMIT 1;

    IF v_inst.id IS NULL THEN
        RAISE EXCEPTION 'No institute found matching code: %', p_code;
    END IF;

    -- Returns ONLY id and name (no emails, phone numbers, or metadata)
    RETURN jsonb_build_object(
        'id', v_inst.id,
        'name', v_inst.name
    );
END;
$$;


-- ------------------------------------------------------------------------------
-- 5. ATOMIC RPCs: approve_join_request, commit_attendance, correct_attendance
-- ------------------------------------------------------------------------------

-- 5.1 Atomic approve_join_request (Single Transaction with Audit & Notification)
CREATE OR REPLACE FUNCTION public.approve_join_request(
    p_request_id UUID,
    p_batch_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_caller_uid UUID;
    v_request RECORD;
    v_batch RECORD;
    v_student_id UUID;
    v_details JSONB;
    v_full_name TEXT;
    v_grade TEXT;
    v_board TEXT;
    v_roll TEXT;
    v_parent_code TEXT;
BEGIN
    v_caller_uid := auth.uid();
    IF v_caller_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO v_request
    FROM public.join_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF v_request.id IS NULL THEN
        RAISE EXCEPTION 'Join request not found';
    END IF;

    IF v_request.status != 'pending' THEN
        RAISE EXCEPTION 'Join request has already been processed';
    END IF;

    -- Verify caller is admin or teacher of this institute
    IF NOT (
        public.is_institute_admin(v_request.institute_id)
        OR EXISTS (
            SELECT 1 FROM public.teachers t
            WHERE t.institute_id = v_request.institute_id AND t.user_id = v_caller_uid
        )
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only faculty or admin can approve join requests';
    END IF;

    -- Verify batch belongs to the institute
    SELECT * INTO v_batch
    FROM public.batches
    WHERE id = p_batch_id AND institute_id = v_request.institute_id;

    IF v_batch.id IS NULL THEN
        RAISE EXCEPTION 'Target batch does not exist in this institute';
    END IF;

    v_details := COALESCE(v_request.student_details, v_request.student_extra_details_json, '{}'::jsonb);
    v_full_name := COALESCE(v_details->>'fullName', v_details->>'name', 'Student');
    v_grade := COALESCE(v_details->>'grade', v_batch.grade, 'Class 12');
    v_board := COALESCE(v_details->>'board', 'CBSE');
    v_roll := '#' || floor(100 + random() * 900)::text;
    v_parent_code := 'STU-' || upper(substring(regexp_replace(v_full_name, '[^a-zA-Z0-9]', '', 'g') from 1 for 4)) || '-' || floor(100 + random() * 900)::text;

    -- 1. Create or update student profile
    INSERT INTO public.students (
        institute_id,
        user_id,
        roll_number,
        admission_number,
        parent_link_code,
        class_grade,
        grade,
        board,
        target_exam,
        school_name,
        guardian_name,
        guardian_phone,
        blood_group
    ) VALUES (
        v_request.institute_id,
        v_request.user_id,
        v_roll,
        v_roll,
        v_parent_code,
        v_grade,
        v_grade,
        v_board,
        COALESCE(v_details->>'targetExam', 'Competitive Exam'),
        COALESCE(v_details->>'school', 'School'),
        COALESCE(v_details->>'guardianName', 'Guardian'),
        COALESCE(v_details->>'guardianPhone', ''),
        COALESCE(v_details->>'bloodGroup', 'O+')
    ) ON CONFLICT (institute_id, user_id) DO UPDATE
    SET updated_at = NOW()
    RETURNING id INTO v_student_id;

    -- 2. Enroll student in target batch
    INSERT INTO public.batch_students (institute_id, batch_id, student_id, status)
    VALUES (v_request.institute_id, p_batch_id, v_student_id, 'enrolled')
    ON CONFLICT (batch_id, student_id) DO UPDATE
    SET status = 'enrolled';

    -- 3. Upsert institute membership
    INSERT INTO public.institute_members (institute_id, user_id, role, status, verification_status, verified_by, verified_at)
    VALUES (v_request.institute_id, v_request.user_id, 'student', 'active', 'verified', v_caller_uid, NOW())
    ON CONFLICT (institute_id, user_id, role) DO UPDATE
    SET status = 'active', verification_status = 'verified', verified_by = v_caller_uid, verified_at = NOW();

    -- 4. Update join request status
    UPDATE public.join_requests
    SET status = 'approved',
        assigned_batch_id = p_batch_id,
        reviewed_by = v_caller_uid,
        reviewed_at = NOW()
    WHERE id = p_request_id;

    -- 5. Stamp app_metadata
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'student', 'institute_id', v_request.institute_id)
    WHERE id = v_request.user_id;

    -- 6. Insert notification for student
    INSERT INTO public.notifications (
        institute_id,
        user_id,
        title,
        body,
        type,
        data
    ) VALUES (
        v_request.institute_id,
        v_request.user_id,
        'Admission Approved 🎉',
        'Your admission request has been approved! You have been enrolled in ' || v_batch.name,
        'admission_update',
        jsonb_build_object('batch_id', p_batch_id, 'student_id', v_student_id)
    );

    RETURN jsonb_build_object(
        'success', true,
        'student_id', v_student_id,
        'batch_id', p_batch_id,
        'institute_id', v_request.institute_id
    );
END;
$$;

-- 5.2 Atomic commit_attendance (Single Transaction with Audit Log & Notifications)
CREATE OR REPLACE FUNCTION public.commit_attendance(
    p_batch_id UUID,
    p_date DATE,
    p_rows JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_caller_uid UUID;
    v_batch RECORD;
    v_row JSONB;
    v_student_id UUID;
    v_status VARCHAR(10);
    v_remarks TEXT;
    v_count INT := 0;
    v_parent_uid UUID;
    v_student_name TEXT;
    v_att_id UUID;
BEGIN
    v_caller_uid := auth.uid();
    IF v_caller_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO v_batch FROM public.batches WHERE id = p_batch_id;
    IF v_batch.id IS NULL THEN
        RAISE EXCEPTION 'Batch not found';
    END IF;

    -- Verify teacher or admin
    IF NOT (
        public.is_teacher_of_batch(p_batch_id)
        OR public.is_institute_admin(v_batch.institute_id)
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only batch teacher or institute admin can commit attendance';
    END IF;

    -- Iterate and upsert rows
    FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
    LOOP
        v_student_id := (v_row->>'studentId')::UUID;
        v_status := v_row->>'status';
        v_remarks := v_row->>'remarks';

        IF v_student_id IS NOT NULL AND v_status IS NOT NULL THEN
            INSERT INTO public.attendance (
                institute_id,
                batch_id,
                student_id,
                date,
                status,
                remarks,
                marked_at
            ) VALUES (
                v_batch.institute_id,
                p_batch_id,
                v_student_id,
                p_date,
                v_status,
                v_remarks,
                NOW()
            ) ON CONFLICT (student_id, batch_id, date) DO UPDATE
            SET
                status = EXCLUDED.status,
                remarks = EXCLUDED.remarks,
                marked_at = NOW(),
                updated_at = NOW()
            RETURNING id INTO v_att_id;

            v_count := v_count + 1;

            -- If student is absent, dispatch notification to parent
            IF v_status = 'A' THEN
                SELECT p.user_id, prof.full_name INTO v_parent_uid, v_student_name
                FROM public.parent_students ps
                JOIN public.parents p ON p.id = ps.parent_id
                JOIN public.students s ON s.id = ps.student_id
                JOIN public.profiles prof ON prof.id = s.user_id
                WHERE ps.student_id = v_student_id
                LIMIT 1;

                IF v_parent_uid IS NOT NULL THEN
                    INSERT INTO public.notifications (
                        institute_id,
                        user_id,
                        title,
                        body,
                        type,
                        data
                    ) VALUES (
                        v_batch.institute_id,
                        v_parent_uid,
                        'Attendance Alert: Absent',
                        v_student_name || ' was marked absent today in ' || v_batch.name,
                        'attendance_alert',
                        jsonb_build_object('student_id', v_student_id, 'date', p_date, 'batch_id', p_batch_id)
                    );
                END IF;
            END IF;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'count', v_count,
        'batch_id', p_batch_id,
        'date', p_date
    );
END;
$$;

-- 5.3 Atomic correct_attendance (Single Transaction with Audit Record & Notification)
CREATE OR REPLACE FUNCTION public.correct_attendance(
    p_attendance_id UUID,
    p_new_status VARCHAR,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_caller_uid UUID;
    v_att RECORD;
    v_batch RECORD;
    v_student_name TEXT;
    v_parent_uid UUID;
    v_old_status VARCHAR(10);
BEGIN
    v_caller_uid := auth.uid();
    IF v_caller_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO v_att FROM public.attendance WHERE id = p_attendance_id;
    IF v_att.id IS NULL THEN
        RAISE EXCEPTION 'Attendance record not found';
    END IF;

    -- Verify caller is teacher or admin
    IF NOT (
        public.is_teacher_of_batch(v_att.batch_id)
        OR public.is_institute_admin(v_att.institute_id)
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only batch teacher or institute admin can correct attendance';
    END IF;

    v_old_status := v_att.status;

    -- 1. Update status
    UPDATE public.attendance
    SET status = p_new_status,
        remarks = COALESCE(remarks, '') || ' [Corrected: ' || p_reason || ']',
        updated_at = NOW()
    WHERE id = p_attendance_id;

    -- 2. Insert audit log
    INSERT INTO public.attendance_audit_log (
        attendance_id,
        old_status,
        new_status,
        reason,
        corrected_by,
        corrected_at
    ) VALUES (
        p_attendance_id,
        v_old_status,
        p_new_status,
        trim(p_reason),
        v_caller_uid,
        NOW()
    );

    -- 3. Notify parent if linked
    SELECT p.user_id, prof.full_name INTO v_parent_uid, v_student_name
    FROM public.parent_students ps
    JOIN public.parents p ON p.id = ps.parent_id
    JOIN public.students s ON s.id = ps.student_id
    JOIN public.profiles prof ON prof.id = s.user_id
    WHERE ps.student_id = v_att.student_id
    LIMIT 1;

    IF v_parent_uid IS NOT NULL THEN
        INSERT INTO public.notifications (
            institute_id,
            user_id,
            title,
            body,
            type,
            data
        ) VALUES (
            v_att.institute_id,
            v_parent_uid,
            'Attendance Correction',
            'Attendance for ' || v_student_name || ' was corrected from ' || v_old_status || ' to ' || p_new_status || '. Reason: ' || p_reason,
            'attendance_update',
            jsonb_build_object('attendance_id', p_attendance_id, 'student_id', v_att.student_id, 'status', p_new_status)
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'attendance_id', p_attendance_id,
        'old_status', v_old_status,
        'new_status', p_new_status
    );
END;
$$;


-- ------------------------------------------------------------------------------
-- 6. STORAGE BUCKETS: MIME TYPES & 20MB SIZE LIMITS ENFORCEMENT
-- ------------------------------------------------------------------------------

-- Update all relevant storage buckets to max 20 MB (20971520 bytes) and PDF/image MIME types
UPDATE storage.buckets
SET file_size_limit = 20971520, -- 20 MB
    allowed_mime_types = ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
WHERE id IN ('study-materials', 'student-submissions', 'community-attachments');

-- Storage RLS: Enforce size limit and MIME check on storage.objects uploads
DROP POLICY IF EXISTS "storage_enforce_size_mime" ON storage.objects;
CREATE POLICY "storage_enforce_size_mime" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id IN ('study-materials', 'student-submissions', 'community-attachments')
        AND (
            -- Ensure size <= 20 MB if metadata exists
            (metadata->>'size') IS NULL OR (metadata->>'size')::bigint <= 20971520
        )
        AND (
            -- Ensure MIME type is PDF or image
            (metadata->>'mimetype') IS NULL OR (metadata->>'mimetype') IN ('application/pdf', 'image/png', 'image/jpeg', 'image/webp')
        )
    );
