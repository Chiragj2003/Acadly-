-- ==============================================================================
-- CANONICAL MIGRATION: 0011_app_flows_and_state_machines.sql
-- Modules:
--   1. Admission State Machine (pending, approved, rejected, waitlisted with reasons and reapply)
--   2. Attendance Corrections (mandatory reason, immutable audit log, batched notifications)
--   3. Homework & Submissions Lifecycle (assigned, submitted, graded, returned, late flag, written submissions)
--   4. Announcements & Read Tracking
--   5. Push Tokens Registration & Receipts
--   6. Parent Child Link Flow (student code approval and free parent access)
--   7. Account Deletion & Data Export RPCs
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ADMISSION STATE MACHINE
-- ------------------------------------------------------------------------------

-- Convert join_requests.status to VARCHAR(30) to support all state machine transitions
ALTER TABLE public.join_requests ALTER COLUMN status TYPE VARCHAR(30) USING status::text;
ALTER TABLE public.join_requests ALTER COLUMN status SET DEFAULT 'pending';

-- Add state machine reason and reapplication tracking columns
ALTER TABLE public.join_requests ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.join_requests ADD COLUMN IF NOT EXISTS waitlist_reason TEXT;
ALTER TABLE public.join_requests ADD COLUMN IF NOT EXISTS reapplied_at TIMESTAMPTZ;
ALTER TABLE public.join_requests ADD COLUMN IF NOT EXISTS assigned_batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL;

-- 1.1 Reject Join Request RPC
CREATE OR REPLACE FUNCTION public.reject_join_request(
    p_request_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_caller_uid UUID;
    v_request RECORD;
    v_clean_reason TEXT;
BEGIN
    v_caller_uid := auth.uid();
    IF v_caller_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    v_clean_reason := COALESCE(trim(p_reason), 'Seat capacity reached for current intake');

    SELECT * INTO v_request
    FROM public.join_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF v_request.id IS NULL THEN
        RAISE EXCEPTION 'Join request not found';
    END IF;

    IF NOT (
        public.is_institute_admin(v_request.institute_id)
        OR EXISTS (
            SELECT 1 FROM public.teachers t
            WHERE t.institute_id = v_request.institute_id AND t.user_id = v_caller_uid
        )
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only faculty or admin can reject join requests';
    END IF;

    UPDATE public.join_requests
    SET status = 'rejected',
        rejection_reason = v_clean_reason,
        reviewed_by = v_caller_uid,
        reviewed_at = NOW()
    WHERE id = p_request_id;

    -- Send notification to applicant
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
        'Admission Update 📋',
        'Your admission application was not accepted: ' || v_clean_reason,
        'admission_rejected',
        jsonb_build_object('request_id', p_request_id, 'reason', v_clean_reason, 'can_reapply', true)
    );

    RETURN jsonb_build_object(
        'success', true,
        'status', 'rejected',
        'request_id', p_request_id,
        'reason', v_clean_reason
    );
END;
$$;

-- 1.2 Waitlist Join Request RPC
CREATE OR REPLACE FUNCTION public.waitlist_join_request(
    p_request_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_caller_uid UUID;
    v_request RECORD;
    v_clean_reason TEXT;
BEGIN
    v_caller_uid := auth.uid();
    IF v_caller_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    v_clean_reason := COALESCE(trim(p_reason), 'Waitlisted for upcoming batch intake');

    SELECT * INTO v_request
    FROM public.join_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF v_request.id IS NULL THEN
        RAISE EXCEPTION 'Join request not found';
    END IF;

    IF NOT (
        public.is_institute_admin(v_request.institute_id)
        OR EXISTS (
            SELECT 1 FROM public.teachers t
            WHERE t.institute_id = v_request.institute_id AND t.user_id = v_caller_uid
        )
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only faculty or admin can waitlist join requests';
    END IF;

    UPDATE public.join_requests
    SET status = 'waitlisted',
        waitlist_reason = v_clean_reason,
        reviewed_by = v_caller_uid,
        reviewed_at = NOW()
    WHERE id = p_request_id;

    -- Send notification to applicant
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
        'Admission Waitlisted ⏳',
        'Your application is on the waitlist: ' || v_clean_reason,
        'admission_waitlisted',
        jsonb_build_object('request_id', p_request_id, 'reason', v_clean_reason)
    );

    RETURN jsonb_build_object(
        'success', true,
        'status', 'waitlisted',
        'request_id', p_request_id,
        'reason', v_clean_reason
    );
END;
$$;

-- 1.3 Re-apply Join Request RPC (Student can edit details and re-submit)
CREATE OR REPLACE FUNCTION public.reapply_join_request(
    p_request_id UUID,
    p_updated_details JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_caller_uid UUID;
    v_request RECORD;
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

    -- Only the applicant themselves can reapply
    IF v_request.user_id != v_caller_uid THEN
        RAISE EXCEPTION 'Unauthorized: Only the applicant can reapply';
    END IF;

    IF v_request.status NOT IN ('rejected', 'waitlisted') THEN
        RAISE EXCEPTION 'Only rejected or waitlisted applications can be resubmitted';
    END IF;

    UPDATE public.join_requests
    SET status = 'pending',
        student_extra_details_json = p_updated_details,
        rejection_reason = NULL,
        waitlist_reason = NULL,
        reapplied_at = NOW(),
        reviewed_by = NULL,
        reviewed_at = NULL
    WHERE id = p_request_id;

    -- Notify faculty about re-application
    INSERT INTO public.notifications (
        institute_id,
        user_id,
        title,
        body,
        type,
        data
    )
    SELECT
        v_request.institute_id,
        im.user_id,
        'Application Resubmitted 📝',
        COALESCE(p_updated_details->>'fullName', 'Student') || ' has updated their details and re-applied.',
        'admission_reapplied',
        jsonb_build_object('request_id', p_request_id)
    FROM public.institute_members im
    WHERE im.institute_id = v_request.institute_id AND im.role IN ('admin', 'teacher');

    RETURN jsonb_build_object(
        'success', true,
        'status', 'pending',
        'request_id', p_request_id,
        'reapplied_at', NOW()
    );
END;
$$;


-- ------------------------------------------------------------------------------
-- 2. ATTENDANCE CORRECTIONS WITH MANDATORY REASON & IMMUTABLE AUDIT LOG
-- ------------------------------------------------------------------------------

-- Ensure audit log table is immutable (no UPDATE / DELETE policies)
ALTER TABLE public.attendance_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_select" ON public.attendance_audit_log;
CREATE POLICY "audit_log_select" ON public.attendance_audit_log
    FOR SELECT TO authenticated
    USING (
        public.is_institute_admin((SELECT institute_id FROM public.batches b WHERE b.id = attendance_audit_log.batch_id))
        OR public.is_teacher_of_batch(batch_id)
        OR student_id = auth.uid()
    );

-- 2.1 Correct Attendance RPC
DROP FUNCTION IF EXISTS public.correct_attendance(UUID, VARCHAR, TEXT);
DROP FUNCTION IF EXISTS public.correct_attendance(UUID, VARCHAR(10), TEXT);
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
    v_record RECORD;
    v_batch RECORD;
    v_clean_reason TEXT;
    v_audit_id UUID;
BEGIN
    v_caller_uid := auth.uid();
    IF v_caller_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    v_clean_reason := trim(p_reason);
    IF v_clean_reason IS NULL OR length(v_clean_reason) < 3 THEN
        RAISE EXCEPTION 'A mandatory reason of at least 3 characters is required for attendance correction';
    END IF;

    IF p_new_status NOT IN ('P', 'A', 'L', 'E', 'present', 'absent', 'late', 'excused') THEN
        RAISE EXCEPTION 'Invalid attendance status code: %', p_new_status;
    END IF;

    SELECT * INTO v_record
    FROM public.attendance
    WHERE id = p_attendance_id
    FOR UPDATE;

    IF v_record.id IS NULL THEN
        RAISE EXCEPTION 'Attendance record not found';
    END IF;

    SELECT * INTO v_batch FROM public.batches WHERE id = v_record.batch_id;

    -- Verify caller is admin or teacher of this batch
    IF NOT (
        public.is_institute_admin(v_batch.institute_id)
        OR public.is_teacher_of_batch(v_record.batch_id)
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only batch teacher or admin can correct attendance';
    END IF;

    -- 1. Write immutable audit log
    INSERT INTO public.attendance_audit_log (
        attendance_id,
        batch_id,
        student_id,
        previous_status,
        new_status,
        changed_by,
        reason,
        changed_at
    ) VALUES (
        v_record.id,
        v_record.batch_id,
        v_record.student_id,
        v_record.status,
        p_new_status,
        v_caller_uid,
        v_clean_reason,
        NOW()
    ) RETURNING id INTO v_audit_id;

    -- 2. Update attendance record
    UPDATE public.attendance
    SET status = p_new_status,
        remarks = COALESCE(remarks, '') || ' [Corrected: ' || v_clean_reason || ']'
    WHERE id = p_attendance_id;

    -- 3. Notify student
    INSERT INTO public.notifications (
        institute_id,
        user_id,
        title,
        body,
        type,
        data
    ) VALUES (
        v_batch.institute_id,
        (SELECT user_id FROM public.students WHERE id = v_record.student_id),
        'Attendance Corrected 📅',
        'Your attendance for ' || v_record.date::text || ' was updated to ' || p_new_status || ' (Reason: ' || v_clean_reason || ')',
        'attendance_correction',
        jsonb_build_object('record_id', p_attendance_id, 'new_status', p_new_status, 'audit_id', v_audit_id)
    );

    RETURN jsonb_build_object(
        'success', true,
        'record_id', p_attendance_id,
        'previous_status', v_record.status,
        'new_status', p_new_status,
        'audit_id', v_audit_id,
        'reason', v_clean_reason
    );
END;
$$;


-- ------------------------------------------------------------------------------
-- 3. HOMEWORK & SUBMISSIONS LIFECYCLE (MCQ + WRITTEN)
-- ------------------------------------------------------------------------------

-- Add homework columns to assignments
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS homework_type VARCHAR(20) DEFAULT 'mcq';
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS open_at TIMESTAMPTZ;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS close_at TIMESTAMPTZ;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 0;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS max_attempts INT DEFAULT 1;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS allow_resubmission BOOLEAN DEFAULT FALSE;

-- Add submission tracking columns to submissions
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS file_urls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS attempt_number INT DEFAULT 1;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT FALSE;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS resubmission_count INT DEFAULT 0;

-- 3.1 Submit Written Homework RPC
CREATE OR REPLACE FUNCTION public.submit_written_homework(
    p_assignment_id UUID,
    p_file_urls JSONB,
    p_submission_text TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_caller_uid UUID;
    v_assignment RECORD;
    v_student RECORD;
    v_existing RECORD;
    v_submission_id UUID;
    v_is_late BOOLEAN := FALSE;
    v_attempts INT := 1;
BEGIN
    v_caller_uid := auth.uid();
    IF v_caller_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO v_assignment FROM public.assignments WHERE id = p_assignment_id;
    IF v_assignment.id IS NULL THEN
        RAISE EXCEPTION 'Assignment not found';
    END IF;

    SELECT * INTO v_student
    FROM public.students
    WHERE user_id = v_caller_uid AND institute_id = v_assignment.institute_id;

    IF v_student.id IS NULL THEN
        RAISE EXCEPTION 'Student not found in this institute';
    END IF;

    -- Check if student is enrolled in batch
    IF NOT public.is_student_in_batch(v_assignment.batch_id) THEN
        RAISE EXCEPTION 'You are not enrolled in this batch';
    END IF;

    -- Check if past due date
    IF v_assignment.due_date IS NOT NULL AND NOW() > v_assignment.due_date THEN
        v_is_late := TRUE;
    END IF;

    -- Check close_at cutoff
    IF v_assignment.close_at IS NOT NULL AND NOW() > v_assignment.close_at THEN
        RAISE EXCEPTION 'Submission deadline has passed. This assignment is closed.';
    END IF;

    -- Check existing submission
    SELECT * INTO v_existing
    FROM public.submissions
    WHERE assignment_id = p_assignment_id AND student_id = v_student.id;

    IF v_existing.id IS NOT NULL THEN
        IF v_existing.status = 'graded' AND NOT COALESCE(v_assignment.allow_resubmission, false) THEN
            RAISE EXCEPTION 'Assignment has already been graded and resubmissions are not permitted';
        END IF;

        IF COALESCE(v_existing.attempt_number, 1) >= COALESCE(v_assignment.max_attempts, 1) AND v_existing.status != 'returned' THEN
            RAISE EXCEPTION 'Maximum submission attempts reached';
        END IF;

        v_attempts := COALESCE(v_existing.attempt_number, 1) + 1;
    END IF;

    INSERT INTO public.submissions (
        assignment_id,
        student_id,
        institute_id,
        file_urls,
        submission_text,
        attempt_number,
        is_late,
        status,
        submitted_at
    ) VALUES (
        p_assignment_id,
        v_student.id,
        v_assignment.institute_id,
        p_file_urls,
        p_submission_text,
        v_attempts,
        v_is_late,
        'submitted',
        NOW()
    ) ON CONFLICT (assignment_id, student_id) DO UPDATE
    SET
        file_urls = EXCLUDED.file_urls,
        submission_text = EXCLUDED.submission_text,
        attempt_number = v_attempts,
        resubmission_count = public.submissions.resubmission_count + 1,
        is_late = v_is_late,
        status = 'submitted',
        submitted_at = NOW()
    RETURNING id INTO v_submission_id;

    -- Notify teacher
    INSERT INTO public.notifications (
        institute_id,
        user_id,
        title,
        body,
        type,
        data
    )
    SELECT
        v_assignment.institute_id,
        t.user_id,
        'New Homework Submission 📄',
        v_student.user_id::text || ' submitted homework for ' || v_assignment.title,
        'homework_submitted',
        jsonb_build_object('assignment_id', p_assignment_id, 'submission_id', v_submission_id)
    FROM public.teachers t
    WHERE t.id = v_assignment.teacher_id;

    RETURN jsonb_build_object(
        'success', true,
        'submission_id', v_submission_id,
        'status', 'submitted',
        'is_late', v_is_late,
        'attempt_number', v_attempts
    );
END;
$$;

-- 3.2 Grade / Return Written Submission RPC
CREATE OR REPLACE FUNCTION public.grade_written_submission(
    p_submission_id UUID,
    p_score NUMERIC,
    p_feedback TEXT,
    p_return_for_rework BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_caller_uid UUID;
    v_sub RECORD;
    v_assignment RECORD;
    v_status VARCHAR(20);
    v_percentage NUMERIC;
BEGIN
    v_caller_uid := auth.uid();
    IF v_caller_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO v_sub FROM public.submissions WHERE id = p_submission_id;
    IF v_sub.id IS NULL THEN
        RAISE EXCEPTION 'Submission not found';
    END IF;

    SELECT * INTO v_assignment FROM public.assignments WHERE id = v_sub.assignment_id;

    -- Verify caller is admin or assigned batch teacher
    IF NOT (
        public.is_institute_admin(v_sub.institute_id)
        OR public.is_teacher_of_batch(v_assignment.batch_id)
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only faculty can grade submissions';
    END IF;

    v_status := CASE WHEN p_return_for_rework THEN 'returned' ELSE 'graded' END;

    IF v_assignment.total_marks IS NOT NULL AND v_assignment.total_marks > 0 THEN
        v_percentage := ROUND((p_score / v_assignment.total_marks) * 100.0, 2);
    END IF;

    UPDATE public.submissions
    SET score = p_score,
        marks_obtained = p_score,
        percentage = v_percentage,
        feedback = p_feedback,
        graded_by = v_caller_uid,
        graded_at = NOW(),
        returned_at = CASE WHEN p_return_for_rework THEN NOW() ELSE returned_at END,
        status = v_status
    WHERE id = p_submission_id;

    -- Notify student
    INSERT INTO public.notifications (
        institute_id,
        user_id,
        title,
        body,
        type,
        data
    ) VALUES (
        v_sub.institute_id,
        (SELECT user_id FROM public.students WHERE id = v_sub.student_id),
        CASE WHEN p_return_for_rework THEN 'Homework Returned for Rework 🔄' ELSE 'Homework Graded 🌟' END,
        v_assignment.title || ': ' || CASE WHEN p_return_for_rework THEN 'Teacher requested corrections. Feedback: ' || p_feedback ELSE 'Scored ' || p_score::text || ' marks.' END,
        'homework_graded',
        jsonb_build_object('submission_id', p_submission_id, 'score', p_score, 'status', v_status)
    );

    RETURN jsonb_build_object(
        'success', true,
        'submission_id', p_submission_id,
        'status', v_status,
        'score', p_score,
        'feedback', p_feedback
    );
END;
$$;


-- ------------------------------------------------------------------------------
-- 4. ANNOUNCEMENTS & READ TRACKING
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.announcement_reads (
    announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (announcement_id, user_id)
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

-- Announcements RLS
DROP POLICY IF EXISTS "announcements_select" ON public.announcements;
CREATE POLICY "announcements_select" ON public.announcements
    FOR SELECT TO authenticated
    USING (
        public.is_institute_admin(institute_id)
        OR (batch_id IS NULL AND public.is_institute_member(institute_id))
        OR (batch_id IS NOT NULL AND (
            public.is_teacher_of_batch(batch_id)
            OR public.is_student_of_batch(batch_id)
            OR EXISTS (
                SELECT 1 FROM public.parent_students ps
                JOIN public.batch_students bs ON bs.student_id = ps.student_id
                WHERE ps.parent_id = auth.uid() AND bs.batch_id = announcements.batch_id
            )
        ))
    );

DROP POLICY IF EXISTS "announcements_insert" ON public.announcements;
CREATE POLICY "announcements_insert" ON public.announcements
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_institute_admin(institute_id)
        OR (batch_id IS NOT NULL AND public.is_teacher_of_batch(batch_id))
    );

-- Read tracking RLS
DROP POLICY IF EXISTS "announcement_reads_select" ON public.announcement_reads;
CREATE POLICY "announcement_reads_select" ON public.announcement_reads
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.announcements a
            WHERE a.id = announcement_reads.announcement_id
              AND (public.is_institute_admin(a.institute_id) OR (a.batch_id IS NOT NULL AND public.is_teacher_of_batch(a.batch_id)))
        )
    );

DROP POLICY IF EXISTS "announcement_reads_insert" ON public.announcement_reads;
CREATE POLICY "announcement_reads_insert" ON public.announcement_reads
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- 4.1 Post Announcement RPC
CREATE OR REPLACE FUNCTION public.post_announcement(
    p_institute_id UUID,
    p_batch_id UUID,
    p_title TEXT,
    p_content TEXT,
    p_priority TEXT DEFAULT 'normal'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_caller_uid UUID;
    v_announcement_id UUID;
    v_batch_name TEXT := 'Institute Notice';
BEGIN
    v_caller_uid := auth.uid();
    IF v_caller_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF NOT (
        public.is_institute_admin(p_institute_id)
        OR (p_batch_id IS NOT NULL AND public.is_teacher_of_batch(p_batch_id))
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only faculty can publish announcements';
    END IF;

    IF p_batch_id IS NOT NULL THEN
        SELECT name INTO v_batch_name FROM public.batches WHERE id = p_batch_id;
    END IF;

    INSERT INTO public.announcements (
        institute_id,
        batch_id,
        author_id,
        title,
        content,
        priority
    ) VALUES (
        p_institute_id,
        p_batch_id,
        v_caller_uid,
        p_title,
        p_content,
        COALESCE(p_priority, 'normal')
    ) RETURNING id INTO v_announcement_id;

    -- Broadcast notification to all batch students
    IF p_batch_id IS NOT NULL THEN
        INSERT INTO public.notifications (
            institute_id,
            user_id,
            title,
            body,
            type,
            data
        )
        SELECT
            p_institute_id,
            s.user_id,
            '📢 ' || p_title,
            substring(p_content from 1 for 120),
            'announcement',
            jsonb_build_object('announcement_id', v_announcement_id, 'batch_id', p_batch_id)
        FROM public.batch_students bs
        JOIN public.students s ON s.id = bs.student_id
        WHERE bs.batch_id = p_batch_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'announcement_id', v_announcement_id,
        'title', p_title
    );
END;
$$;


-- ------------------------------------------------------------------------------
-- 5. PUSH TOKEN REGISTRATION & RECEIPT CLEANUP
-- ------------------------------------------------------------------------------

-- Ensure push_tokens table has device tracking
ALTER TABLE public.push_tokens ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE public.push_tokens ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

CREATE OR REPLACE FUNCTION public.register_push_token(
    p_token TEXT,
    p_platform TEXT,
    p_device_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_caller_uid UUID;
BEGIN
    v_caller_uid := auth.uid();
    IF v_caller_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_token IS NULL OR length(trim(p_token)) < 10 THEN
        RAISE EXCEPTION 'Invalid push token';
    END IF;

    INSERT INTO public.push_tokens (
        user_id,
        token,
        platform,
        device_id,
        is_active,
        updated_at
    ) VALUES (
        v_caller_uid,
        p_token,
        COALESCE(p_platform, 'unknown'),
        p_device_id,
        TRUE,
        NOW()
    ) ON CONFLICT (user_id, token) DO UPDATE
    SET is_active = TRUE,
        platform = EXCLUDED.platform,
        device_id = COALESCE(EXCLUDED.device_id, public.push_tokens.device_id),
        updated_at = NOW();

    RETURN jsonb_build_object('success', true);
END;
$$;

-- Deactivate dead push token (called when Expo receipt flags DeviceNotRegistered)
CREATE OR REPLACE FUNCTION public.deactivate_push_token(
    p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    UPDATE public.push_tokens
    SET is_active = FALSE,
        updated_at = NOW()
    WHERE token = p_token;

    RETURN jsonb_build_object('success', true);
END;
$$;


-- ------------------------------------------------------------------------------
-- 6. PARENT CHILD LINK APPROVAL & ACCESS
-- ------------------------------------------------------------------------------

-- Table: parent_student_links (audits parent linking and verification status)
CREATE TABLE IF NOT EXISTS public.parent_student_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    relationship VARCHAR(50) DEFAULT 'Parent',
    student_code_entered VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'approved',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "parent_student_links_select" ON public.parent_student_links;
CREATE POLICY "parent_student_links_select" ON public.parent_student_links
    FOR SELECT TO authenticated
    USING (
        parent_id = auth.uid()
        OR student_id = (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid())
        OR public.is_institute_admin(institute_id)
    );

-- 6.1 Request Parent Child Link RPC
CREATE OR REPLACE FUNCTION public.request_parent_child_link(
    p_student_code TEXT,
    p_relationship TEXT DEFAULT 'Parent'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_caller_uid UUID;
    v_clean_code TEXT;
    v_student RECORD;
    v_link_id UUID;
BEGIN
    v_caller_uid := auth.uid();
    IF v_caller_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    v_clean_code := upper(trim(p_student_code));

    -- Lookup student by parent_link_code
    SELECT * INTO v_student
    FROM public.students
    WHERE upper(parent_link_code) = v_clean_code;

    IF v_student.id IS NULL THEN
        RAISE EXCEPTION 'No student found matching link code: %', p_student_code;
    END IF;

    -- Ensure caller is parent role
    INSERT INTO public.parents (institute_id, user_id)
    VALUES (v_student.institute_id, v_caller_uid)
    ON CONFLICT (institute_id, user_id) DO NOTHING;

    -- Ensure institute member
    INSERT INTO public.institute_members (institute_id, user_id, role, status, verification_status)
    VALUES (v_student.institute_id, v_caller_uid, 'parent', 'active', 'verified')
    ON CONFLICT (institute_id, user_id, role) DO UPDATE
    SET status = 'active', verification_status = 'verified';

    -- Insert into parent_students mapping
    INSERT INTO public.parent_students (institute_id, parent_id, student_id, relationship)
    VALUES (v_student.institute_id, v_caller_uid, v_student.id, COALESCE(p_relationship, 'Parent'))
    ON CONFLICT (parent_id, student_id) DO NOTHING;

    -- Record in parent_student_links audit table
    INSERT INTO public.parent_student_links (
        institute_id,
        parent_id,
        student_id,
        relationship,
        student_code_entered,
        status
    ) VALUES (
        v_student.institute_id,
        v_caller_uid,
        v_student.id,
        COALESCE(p_relationship, 'Parent'),
        v_clean_code,
        'approved'
    ) ON CONFLICT (parent_id, student_id) DO UPDATE
    SET status = 'approved', updated_at = NOW()
    RETURNING id INTO v_link_id;

    -- Notify student about linked parent
    INSERT INTO public.notifications (
        institute_id,
        user_id,
        title,
        body,
        type,
        data
    ) VALUES (
        v_student.institute_id,
        v_student.user_id,
        'Parent Account Linked 👨‍👩‍👦',
        'A parent has linked to your academic profile via student code ' || v_clean_code,
        'parent_linked',
        jsonb_build_object('parent_id', v_caller_uid, 'link_id', v_link_id)
    );

    RETURN jsonb_build_object(
        'success', true,
        'student_id', v_student.id,
        'institute_id', v_student.institute_id,
        'link_id', v_link_id
    );
END;
$$;


-- ------------------------------------------------------------------------------
-- 7. ACCOUNT DELETION & DATA EXPORT RPCs (APP STORE COMPLIANCE)
-- ------------------------------------------------------------------------------

-- 7.1 Request Account Deletion RPC
CREATE OR REPLACE FUNCTION public.request_account_deletion()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_caller_uid UUID;
BEGIN
    v_caller_uid := auth.uid();
    IF v_caller_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Deactivate push tokens
    UPDATE public.push_tokens
    SET is_active = FALSE, updated_at = NOW()
    WHERE user_id = v_caller_uid;

    -- Anonymize public profile
    UPDATE public.profiles
    SET full_name = 'Deleted User',
        avatar_url = NULL,
        phone_number = NULL,
        updated_at = NOW()
    WHERE id = v_caller_uid;

    -- Anonymize student guardian details if student
    UPDATE public.students
    SET guardian_name = 'Redacted',
        guardian_phone = '0000000000',
        school_name = 'Redacted'
    WHERE user_id = v_caller_uid;

    -- Mark institute memberships inactive
    UPDATE public.institute_members
    SET status = 'suspended',
        verification_status = 'rejected'
    WHERE user_id = v_caller_uid;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Your account and personal data have been anonymized and marked for permanent deletion.'
    );
END;
$$;

-- 7.2 Export User Data RPC
CREATE OR REPLACE FUNCTION public.export_user_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_caller_uid UUID;
    v_profile JSONB;
    v_attendance JSONB;
    v_results JSONB;
    v_submissions JSONB;
BEGIN
    v_caller_uid := auth.uid();
    IF v_caller_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT to_jsonb(p) INTO v_profile FROM public.profiles p WHERE id = v_caller_uid;

    SELECT COALESCE(jsonb_agg(to_jsonb(a)), '[]'::jsonb) INTO v_attendance
    FROM public.attendance a
    WHERE a.student_id = (SELECT s.id FROM public.students s WHERE s.user_id = v_caller_uid);

    SELECT COALESCE(jsonb_agg(to_jsonb(r)), '[]'::jsonb) INTO v_results
    FROM public.results r
    WHERE r.student_id = (SELECT s.id FROM public.students s WHERE s.user_id = v_caller_uid);

    SELECT COALESCE(jsonb_agg(to_jsonb(sub)), '[]'::jsonb) INTO v_submissions
    FROM public.submissions sub
    WHERE sub.student_id = (SELECT s.id FROM public.students s WHERE s.user_id = v_caller_uid);

    RETURN jsonb_build_object(
        'user_id', v_caller_uid,
        'exported_at', NOW(),
        'profile', v_profile,
        'attendance', v_attendance,
        'results', v_results,
        'submissions', v_submissions
    );
END;
$$;
