-- ==============================================================================
-- CANONICAL MIGRATION: 0007_secure_quiz_grading.sql
-- Modules: Secure Quiz Answer Keys Storage & Server-Side Auto-Grading RPC.
-- Resolves: [SEC-008] Direct column exposure of quiz answer keys to students.
-- ==============================================================================

-- 1. ISOLATED QUIZ ANSWER KEYS TABLE (Teacher & Admin Access Only)
CREATE TABLE IF NOT EXISTS public.quiz_answer_keys (
    assignment_id UUID PRIMARY KEY REFERENCES public.assignments(id) ON DELETE CASCADE,
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    answer_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for rapid join on assignment lookup
CREATE INDEX IF NOT EXISTS idx_quiz_answer_keys_assignment ON public.quiz_answer_keys(assignment_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answer_keys_institute ON public.quiz_answer_keys(institute_id);

-- 2. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.quiz_answer_keys ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES FOR QUIZ ANSWER KEYS
-- Only institute admins and assigned batch teachers can read/write answer keys. Students have ZERO access.
DROP POLICY IF EXISTS "quiz_answer_keys_teacher_manage" ON public.quiz_answer_keys;
CREATE POLICY "quiz_answer_keys_teacher_manage" ON public.quiz_answer_keys
    FOR ALL TO authenticated
    USING (
        public.is_institute_admin(institute_id)
        OR EXISTS (
            SELECT 1 FROM public.assignments a
            WHERE a.id = quiz_answer_keys.assignment_id
              AND public.is_teacher_of_batch(a.batch_id)
        )
    )
    WITH CHECK (
        public.is_institute_admin(institute_id)
        OR EXISTS (
            SELECT 1 FROM public.assignments a
            WHERE a.id = quiz_answer_keys.assignment_id
              AND public.is_teacher_of_batch(a.batch_id)
        )
    );

-- 4. SERVER-SIDE QUIZ EVALUATION & AUTO-GRADING FUNCTION (SECURITY DEFINER)
-- Evaluates student answers securely against quiz_answer_keys without leaking answer keys.
CREATE OR REPLACE FUNCTION public.submit_and_grade_quiz(
    p_assignment_id UUID,
    p_student_id UUID,
    p_answers JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_institute_id UUID;
    v_batch_id UUID;
    v_total_marks NUMERIC(6,2) := 0;
    v_score NUMERIC(6,2) := 0;
    v_percentage NUMERIC(5,2) := 0;
    v_is_passed BOOLEAN := false;
    v_passing_threshold NUMERIC(5,2) := 40.0;
    v_answer_keys JSONB;
    v_item JSONB;
    v_question_id TEXT;
    v_type TEXT;
    v_marks NUMERIC(6,2);
    v_correct_idx INT;
    v_expected_text TEXT;
    v_student_ans TEXT;
    v_is_correct BOOLEAN;
    v_detailed_results JSONB := '[]'::jsonb;
    v_submission_id UUID;
    v_caller_uid UUID;
BEGIN
    v_caller_uid := auth.uid();

    -- 1. Verify caller owns student record or is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.students s
        WHERE s.id = p_student_id AND (s.user_id = v_caller_uid OR public.auth_role() = 'admin')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Caller is not the enrolled student';
    END IF;

    -- 2. Fetch assignment metadata
    SELECT institute_id, batch_id INTO v_institute_id, v_batch_id
    FROM public.assignments
    WHERE id = p_assignment_id;

    IF v_institute_id IS NULL THEN
        RAISE EXCEPTION 'Assignment not found';
    END IF;

    -- 3. Fetch answer keys from quiz_answer_keys or fallback to assignments.questions
    SELECT answer_keys INTO v_answer_keys
    FROM public.quiz_answer_keys
    WHERE assignment_id = p_assignment_id;

    IF v_answer_keys IS NULL OR jsonb_array_length(v_answer_keys) = 0 THEN
        SELECT questions INTO v_answer_keys
        FROM public.assignments
        WHERE id = p_assignment_id;
    END IF;

    -- 4. Evaluate each question against student answers
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

        -- Build detailed question review for student
        v_detailed_results := v_detailed_results || jsonb_build_object(
            'id', v_question_id,
            'type', v_type,
            'questionText', v_item ->> 'questionText',
            'options', v_item -> 'options',
            'studentAnswer', v_student_ans,
            'correctOptionIndex', (v_item ->> 'correctOptionIndex')::int,
            'isCorrect', v_is_correct,
            'marksObtained', CASE WHEN v_is_correct THEN v_marks ELSE 0 END,
            'maxMarks', v_marks,
            'explanation', v_item ->> 'explanation'
        );
    END LOOP;

    -- 5. Calculate percentage and pass status
    IF v_total_marks > 0 THEN
        v_percentage := ROUND((v_score / v_total_marks) * 100.0, 1);
    ELSE
        v_percentage := 0;
    END IF;
    v_is_passed := (v_percentage >= v_passing_threshold);

    -- 6. Upsert submission record
    INSERT INTO public.submissions (
        institute_id,
        assignment_id,
        student_id,
        answers,
        score,
        marks_obtained,
        status,
        submitted_at,
        graded_at
    )
    VALUES (
        v_institute_id,
        p_assignment_id,
        p_student_id,
        p_answers,
        v_score,
        v_score,
        'graded',
        NOW(),
        NOW()
    )
    ON CONFLICT (assignment_id, student_id)
    DO UPDATE SET
        answers = EXCLUDED.answers,
        score = EXCLUDED.score,
        marks_obtained = EXCLUDED.marks_obtained,
        status = 'graded',
        graded_at = NOW()
    RETURNING id INTO v_submission_id;

    -- 7. Return complete evaluated result payload
    RETURN jsonb_build_object(
        'submissionId', v_submission_id,
        'totalScore', v_score,
        'totalMarks', v_total_marks,
        'percentage', v_percentage,
        'isPassed', v_is_passed,
        'status', 'graded',
        'questions', v_detailed_results
    );
END;
$$;
