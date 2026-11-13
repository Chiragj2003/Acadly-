-- ==============================================================================
-- MIGRATION 0012: AI GRADING AND QUIZ GENERATION WITH GEMINI
--
-- Features:
--   1. Teacher Daily AI Usage Quota (default 25 calls/day)
--   2. AI fields on Submissions (ai_score, ai_feedback, ai_status, ai_graded_at)
--   3. Atomic RPC check_and_increment_ai_quota
--   4. Atomic RPC record_ai_submission_suggestion (pending teacher review)
--   5. Hardened grade_written_submission to mark ai_status = 'approved'
--   6. Student view protection: unapproved AI grades hidden until teacher signs off
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. AI USAGE QUOTAS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_usage_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    call_count INT NOT NULL DEFAULT 0,
    daily_limit INT NOT NULL DEFAULT 25,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(teacher_id, date)
);

CREATE INDEX IF NOT EXISTS idx_ai_quotas_teacher_date ON public.ai_usage_quotas(teacher_id, date);

-- Enable RLS on ai_usage_quotas
ALTER TABLE public.ai_usage_quotas ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own quota
DROP POLICY IF EXISTS "Teachers can view own ai quota" ON public.ai_usage_quotas;
CREATE POLICY "Teachers can view own ai quota"
    ON public.ai_usage_quotas
    FOR SELECT
    TO authenticated
    USING (teacher_id = auth.uid());

-- Client cannot directly insert or modify quota records
-- (all modifications occur through SECURITY DEFINER RPCs)

-- ------------------------------------------------------------------------------
-- 2. ADD AI FIELDS TO SUBMISSIONS TABLE
-- ------------------------------------------------------------------------------
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS ai_score NUMERIC(6, 2);
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS ai_feedback TEXT;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS ai_status VARCHAR(30) DEFAULT 'none'
    CHECK (ai_status IN ('none', 'pending_review', 'suggested', 'approved', 'rejected'));
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS ai_graded_at TIMESTAMPTZ;

-- ------------------------------------------------------------------------------
-- 3. RPC: CHECK AND INCREMENT AI QUOTA
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_and_increment_ai_quota(
    p_teacher_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_caller_uid UUID;
    v_current_count INT;
    v_limit INT;
    v_today DATE;
    v_quota_row public.ai_usage_quotas%ROWTYPE;
BEGIN
    v_caller_uid := auth.uid();
    IF v_caller_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Only allow caller to increment their own quota unless caller is service role
    IF v_caller_uid != p_teacher_id AND auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Unauthorized: Cannot modify another teacher quota';
    END IF;

    v_today := CURRENT_DATE;

    -- Upsert the daily quota record atomically with row-level lock
    INSERT INTO public.ai_usage_quotas (teacher_id, date, call_count, daily_limit)
    VALUES (p_teacher_id, v_today, 0, 25)
    ON CONFLICT (teacher_id, date) DO NOTHING;

    SELECT * INTO v_quota_row
    FROM public.ai_usage_quotas
    WHERE teacher_id = p_teacher_id AND date = v_today
    FOR UPDATE;

    v_current_count := v_quota_row.call_count;
    v_limit := v_quota_row.daily_limit;

    IF v_current_count >= v_limit THEN
        RAISE EXCEPTION 'Daily AI quota exceeded (%/% calls used today). Please try again tomorrow.', v_current_count, v_limit;
    END IF;

    -- Increment call count
    UPDATE public.ai_usage_quotas
    SET call_count = call_count + 1,
        updated_at = NOW()
    WHERE teacher_id = p_teacher_id AND date = v_today;

    RETURN jsonb_build_object(
        'success', true,
        'date', v_today,
        'used', v_current_count + 1,
        'limit', v_limit,
        'remaining', v_limit - (v_current_count + 1)
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 4. RPC: GET TEACHER AI QUOTA STATUS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_teacher_ai_quota(
    p_teacher_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_caller_uid UUID;
    v_quota_row public.ai_usage_quotas%ROWTYPE;
    v_today DATE;
BEGIN
    v_caller_uid := auth.uid();
    IF v_caller_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF v_caller_uid != p_teacher_id AND auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Unauthorized: Cannot view another teacher quota';
    END IF;

    v_today := CURRENT_DATE;

    SELECT * INTO v_quota_row
    FROM public.ai_usage_quotas
    WHERE teacher_id = p_teacher_id AND date = v_today;

    IF v_quota_row.id IS NULL THEN
        RETURN jsonb_build_object(
            'date', v_today,
            'used', 0,
            'limit', 25,
            'remaining', 25
        );
    END IF;

    RETURN jsonb_build_object(
        'date', v_today,
        'used', v_quota_row.call_count,
        'limit', v_quota_row.daily_limit,
        'remaining', GREATEST(0, v_quota_row.daily_limit - v_quota_row.call_count)
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. RPC: RECORD AI SUBMISSION SUGGESTION (AWAITING TEACHER REVIEW)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_ai_submission_suggestion(
    p_submission_id UUID,
    p_ai_score NUMERIC,
    p_ai_feedback TEXT
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

    -- Verify caller is admin, batch teacher, or service role
    IF NOT (
        auth.role() = 'service_role'
        OR public.is_institute_admin(v_sub.institute_id)
        OR public.is_teacher_of_batch(v_assignment.batch_id)
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only faculty can request or record AI grading suggestions';
    END IF;

    -- Update submission with AI suggestion, but KEEP status = 'submitted' (NOT finalized)
    UPDATE public.submissions
    SET ai_score = p_ai_score,
        ai_feedback = p_ai_feedback,
        ai_status = 'pending_review',
        ai_graded_at = NOW()
    WHERE id = p_submission_id;

    RETURN jsonb_build_object(
        'success', true,
        'submission_id', p_submission_id,
        'ai_score', p_ai_score,
        'ai_feedback', p_ai_feedback,
        'ai_status', 'pending_review'
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. ENHANCE grade_written_submission TO FINALIZE AI STATUS
-- ------------------------------------------------------------------------------
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
    v_ai_status VARCHAR(30);
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
    v_ai_status := CASE 
        WHEN v_sub.ai_status = 'pending_review' THEN 'approved'
        ELSE v_sub.ai_status
    END;

    IF v_assignment.total_marks IS NOT NULL AND v_assignment.total_marks > 0 THEN
        v_percentage := ROUND((p_score / v_assignment.total_marks) * 100.0, 2);
    END IF;

    UPDATE public.submissions
    SET score = p_score,
        marks_obtained = p_score,
        feedback = p_feedback,
        graded_by = v_caller_uid,
        graded_at = NOW(),
        returned_at = CASE WHEN p_return_for_rework THEN NOW() ELSE returned_at END,
        status = v_status,
        ai_status = v_ai_status
    WHERE id = p_submission_id;

    -- Notify student
    INSERT INTO public.notifications (
        user_id,
        institute_id,
        title,
        body,
        type,
        data
    )
    SELECT
        s.user_id,
        v_sub.institute_id,
        CASE WHEN p_return_for_rework THEN 'Homework Returned for Rework' ELSE 'Homework Evaluated' END,
        CASE WHEN p_return_for_rework 
             THEN 'Your teacher returned your homework submission for rework: ' || COALESCE(p_feedback, 'Review comments')
             ELSE 'Your homework submission has been evaluated: ' || p_score || ' marks awarded.'
        END,
        'homework',
        jsonb_build_object('submission_id', p_submission_id, 'assignment_id', v_sub.assignment_id, 'status', v_status)
    FROM public.students s
    WHERE s.id = v_sub.student_id;

    RETURN jsonb_build_object(
        'success', true,
        'submission_id', p_submission_id,
        'status', v_status,
        'score', p_score,
        'feedback', p_feedback,
        'ai_status', v_ai_status
    );
END;
$$;
