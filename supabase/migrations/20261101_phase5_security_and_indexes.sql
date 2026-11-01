-- ==============================================================================
-- ACADLY - PHASE 5: SECURITY AUDIT, FOREIGN KEY INDEXES & PERFORMANCE OPTIMIZATION
-- ==============================================================================

-- 1. Index All Foreign Keys (Supabase Postgres Best Practice)
CREATE INDEX IF NOT EXISTS idx_fk_teachers_user ON public.teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_fk_teachers_institute ON public.teachers(institute_id);

CREATE INDEX IF NOT EXISTS idx_fk_students_user ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_fk_students_institute ON public.students(institute_id);

CREATE INDEX IF NOT EXISTS idx_fk_parents_user ON public.parents(user_id);
CREATE INDEX IF NOT EXISTS idx_fk_parents_institute ON public.parents(institute_id);

CREATE INDEX IF NOT EXISTS idx_fk_parent_students_parent ON public.parent_students(parent_id);
CREATE INDEX IF NOT EXISTS idx_fk_parent_students_student ON public.parent_students(student_id);

CREATE INDEX IF NOT EXISTS idx_fk_batches_institute ON public.batches(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_batch_teachers_batch ON public.batch_teachers(batch_id);
CREATE INDEX IF NOT EXISTS idx_fk_batch_teachers_teacher ON public.batch_teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_fk_batch_students_batch ON public.batch_students(batch_id);
CREATE INDEX IF NOT EXISTS idx_fk_batch_students_student ON public.batch_students(student_id);

CREATE INDEX IF NOT EXISTS idx_fk_attendance_institute ON public.attendance(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_attendance_batch ON public.attendance(batch_id);
CREATE INDEX IF NOT EXISTS idx_fk_attendance_student ON public.attendance(student_id);

CREATE INDEX IF NOT EXISTS idx_fk_materials_institute ON public.study_materials(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_materials_batch ON public.study_materials(batch_id);

CREATE INDEX IF NOT EXISTS idx_fk_lectures_institute ON public.lectures(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_lectures_batch ON public.lectures(batch_id);

CREATE INDEX IF NOT EXISTS idx_fk_assignments_institute ON public.assignments(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_assignments_batch ON public.assignments(batch_id);

CREATE INDEX IF NOT EXISTS idx_fk_submissions_assignment ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_fk_submissions_student ON public.submissions(student_id);

CREATE INDEX IF NOT EXISTS idx_fk_student_fees_institute ON public.student_fees(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_student_fees_student ON public.student_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fk_student_fees_plan ON public.student_fees(fee_plan_id);

CREATE INDEX IF NOT EXISTS idx_fk_payments_institute ON public.payments(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_payments_fee ON public.payments(student_fee_id);
CREATE INDEX IF NOT EXISTS idx_fk_payments_student ON public.payments(student_id);

CREATE INDEX IF NOT EXISTS idx_fk_notifications_institute ON public.notifications(institute_id);

-- 2. Composite Query Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_composite_attendance_lookup 
    ON public.attendance(institute_id, batch_id, date, status);

CREATE INDEX IF NOT EXISTS idx_composite_student_fees_overdue
    ON public.student_fees(institute_id, status, due_date);

CREATE INDEX IF NOT EXISTS idx_composite_institute_member_auth
    ON public.institute_members(user_id, institute_id, role, status);

-- 3. Security Audit & RLS Verification Function
CREATE OR REPLACE FUNCTION public.audit_security_compliance()
RETURNS TABLE(
    table_name TEXT,
    rls_enabled BOOLEAN,
    policy_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.relname::TEXT AS table_name,
        c.relrowsecurity AS rls_enabled,
        COUNT(p.polname) AS policy_count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_policy p ON p.polrelid = c.oid
    WHERE n.nspname = 'public' 
      AND c.relkind = 'r'
    GROUP BY c.relname, c.relrowsecurity
    ORDER BY c.relname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
