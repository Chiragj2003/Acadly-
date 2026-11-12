-- ==============================================================================
-- CANONICAL MIGRATION: 0008_fix_rls_recursion_and_scoping.sql
-- Fixes:
--   1. Mutual recursion between students <-> batch_students RLS policies.
--   2. Introduces SECURITY DEFINER helper public.current_student_id().
--   3. Teacher scoping: teachers only see batches they are assigned to.
--   4. Eliminates redundant subqueries in attendance, results, submissions, fees.
-- ==============================================================================

-- 1. SECURITY DEFINER HELPERS (search_path = public to bypass RLS recursion safely)

CREATE OR REPLACE FUNCTION public.current_student_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT id FROM public.students WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_teacher_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT id FROM public.teachers WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_teacher_of_student(target_student_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.batch_students bs
        JOIN public.batches b ON b.id = bs.batch_id
        LEFT JOIN public.batch_teachers bt ON bt.batch_id = b.id
        LEFT JOIN public.teachers t ON (t.id = b.teacher_id OR t.id = bt.teacher_id)
        WHERE bs.student_id = target_student_id
          AND t.user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.is_teacher_of_batch(target_batch_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.batches b
        LEFT JOIN public.batch_teachers bt ON bt.batch_id = b.id
        LEFT JOIN public.teachers t ON (t.id = b.teacher_id OR t.id = bt.teacher_id)
        WHERE b.id = target_batch_id
          AND (
              t.user_id = auth.uid()
              OR public.is_institute_admin(b.institute_id)
          )
    );
$$;

CREATE OR REPLACE FUNCTION public.is_parent_of(target_student_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.parent_students ps
        JOIN public.parents p ON p.id = ps.parent_id
        WHERE ps.student_id = target_student_id
          AND p.user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.is_student_in_batch(target_batch_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.batch_students bs
        WHERE bs.batch_id = target_batch_id
          AND bs.student_id = public.current_student_id()
    );
$$;

-- 2. REVISE RLS POLICIES

-- 2.1 Students
DROP POLICY IF EXISTS "students_select" ON public.students;
CREATE POLICY "students_select" ON public.students FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR public.is_parent_of(id)
        OR public.is_institute_admin(institute_id)
        OR public.is_teacher_of_student(id)
    );

-- 2.2 Batches: Admin sees all in institute; teachers see only assigned batches; students see enrolled batches; parents see child batches
DROP POLICY IF EXISTS "batches_select" ON public.batches;
CREATE POLICY "batches_select" ON public.batches FOR SELECT TO authenticated
    USING (
        public.is_institute_admin(institute_id)
        OR public.is_teacher_of_batch(id)
        OR public.is_student_in_batch(id)
        OR EXISTS (
            SELECT 1 FROM public.batch_students bs
            WHERE bs.batch_id = batches.id AND public.is_parent_of(bs.student_id)
        )
    );

-- 2.3 Batch Students: Admin sees all; teacher sees assigned batch students; student sees own enrollment; parent sees child enrollment
DROP POLICY IF EXISTS "batch_students_select" ON public.batch_students;
CREATE POLICY "batch_students_select" ON public.batch_students FOR SELECT TO authenticated
    USING (
        public.is_institute_admin(institute_id)
        OR public.is_teacher_of_batch(batch_id)
        OR student_id = public.current_student_id()
        OR public.is_parent_of(student_id)
    );

-- 2.4 Attendance
DROP POLICY IF EXISTS "attendance_select" ON public.attendance;
CREATE POLICY "attendance_select" ON public.attendance FOR SELECT TO authenticated
    USING (
        public.is_institute_admin(institute_id)
        OR public.is_teacher_of_batch(batch_id)
        OR student_id = public.current_student_id()
        OR public.is_parent_of(student_id)
    );

-- 2.5 Exam Results
DROP POLICY IF EXISTS "results_select" ON public.results;
CREATE POLICY "results_select" ON public.results FOR SELECT TO authenticated
    USING (
        public.is_institute_admin(institute_id)
        OR EXISTS (
            SELECT 1 FROM public.examinations e
            WHERE e.id = results.examination_id AND public.is_teacher_of_batch(e.batch_id)
        )
        OR student_id = public.current_student_id()
        OR public.is_parent_of(student_id)
    );

-- 2.6 Submissions
DROP POLICY IF EXISTS "submissions_select" ON public.submissions;
CREATE POLICY "submissions_select" ON public.submissions FOR SELECT TO authenticated
    USING (
        public.is_institute_admin(institute_id)
        OR EXISTS (
            SELECT 1 FROM public.assignments a
            WHERE a.id = submissions.assignment_id AND public.is_teacher_of_batch(a.batch_id)
        )
        OR student_id = public.current_student_id()
        OR public.is_parent_of(student_id)
    );

-- 2.7 Student Fees
DROP POLICY IF EXISTS "student_fees_select" ON public.student_fees;
CREATE POLICY "student_fees_select" ON public.student_fees FOR SELECT TO authenticated
    USING (
        public.is_institute_admin(institute_id)
        OR student_id = public.current_student_id()
        OR public.is_parent_of(student_id)
    );

-- 2.8 Payments
DROP POLICY IF EXISTS "payments_select" ON public.payments;
CREATE POLICY "payments_select" ON public.payments FOR SELECT TO authenticated
    USING (
        public.is_institute_admin(institute_id)
        OR student_id = public.current_student_id()
        OR public.is_parent_of(student_id)
    );

-- 2.9 Receipts
DROP POLICY IF EXISTS "receipts_select" ON public.receipts;
CREATE POLICY "receipts_select" ON public.receipts FOR SELECT TO authenticated
    USING (
        public.is_institute_admin(institute_id)
        OR student_id = public.current_student_id()
        OR public.is_parent_of(student_id)
    );
