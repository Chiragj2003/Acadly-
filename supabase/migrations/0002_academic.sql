-- ==============================================================================
-- CANONICAL MIGRATION: 0002_academic.sql
-- Modules: Attendance, Attendance Audit Log, Lectures, Study Materials,
--          Assignments (type enum 'file'|'quiz', questions jsonb),
--          Submissions (answers jsonb, score, graded_at), Examinations & Results.
-- ==============================================================================

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE assignment_type_enum AS ENUM ('file', 'quiz');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE video_provider_enum AS ENUM ('youtube', 'bunny', 'direct');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. ACADEMIC TABLES

-- 1. Attendance Records
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(10) NOT NULL CHECK (status IN ('P', 'A', 'L', 'E', 'present', 'absent', 'late', 'excused')),
    marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(batch_id, student_id, date)
);

-- 2. Attendance Audit Log (History of status corrections & reasons)
CREATE TABLE IF NOT EXISTS public.attendance_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id UUID REFERENCES public.attendance(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    previous_status VARCHAR(10) NOT NULL,
    new_status VARCHAR(10) NOT NULL,
    changed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Lectures (Unlisted YouTube / Streamed Classrooms)
CREATE TABLE IF NOT EXISTS public.lectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    provider video_provider_enum NOT NULL DEFAULT 'youtube',
    video_id_or_url TEXT NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    duration_seconds INTEGER DEFAULT 3600,
    thumbnail_url TEXT,
    faculty_name VARCHAR(255),
    is_live BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Study Materials & PDF Notes Repository
CREATE TABLE IF NOT EXISTS public.study_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    category VARCHAR(50) DEFAULT 'notes',
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100),
    description TEXT,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50) DEFAULT 'pdf',
    file_size VARCHAR(50),
    file_size_bytes BIGINT DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Assignments (DPP & Quizzes with questions JSONB)
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100),
    instructions TEXT,
    description TEXT,
    type assignment_type_enum NOT NULL DEFAULT 'file',
    questions JSONB DEFAULT '[]'::jsonb,
    attachment_url TEXT,
    max_marks NUMERIC(6, 2) DEFAULT 100.00,
    total_marks NUMERIC(6, 2) DEFAULT 100.00,
    question_count INTEGER DEFAULT 0,
    due_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Submissions (with answers JSONB, score, graded_at)
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    file_url TEXT,
    submission_text TEXT,
    answers JSONB DEFAULT '{}'::jsonb,
    score NUMERIC(6, 2),
    marks_obtained NUMERIC(6, 2),
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late', 'resubmit')),
    feedback TEXT,
    graded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    graded_at TIMESTAMPTZ,
    UNIQUE(assignment_id, student_id)
);

-- 7. Examinations
CREATE TABLE IF NOT EXISTS public.examinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    exam_date DATE NOT NULL,
    max_marks NUMERIC(6, 2) NOT NULL DEFAULT 100.00,
    passing_marks NUMERIC(6, 2) NOT NULL DEFAULT 40.00,
    batch_average_marks NUMERIC(6, 2) DEFAULT 0.00,
    batch_highest_marks NUMERIC(6, 2) DEFAULT 0.00,
    syllabus TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Results (Grades & Rank)
CREATE TABLE IF NOT EXISTS public.results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    marks_obtained NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    batch_rank INTEGER DEFAULT 1,
    grade VARCHAR(10),
    is_absent BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(examination_id, student_id)
);

-- 3. AUTO-CALCULATION TRIGGERS (EXAM RANKS & BATCH METRICS)
CREATE OR REPLACE FUNCTION recalculate_exam_metrics_and_ranks()
RETURNS TRIGGER AS $$
DECLARE
    target_exam_id UUID;
    avg_marks NUMERIC(6, 2);
    high_marks NUMERIC(6, 2);
BEGIN
    target_exam_id := COALESCE(NEW.examination_id, OLD.examination_id);

    -- 1. Compute Batch Average & Highest
    SELECT 
        COALESCE(ROUND(AVG(marks_obtained), 2), 0.00),
        COALESCE(MAX(marks_obtained), 0.00)
    INTO avg_marks, high_marks
    FROM public.results
    WHERE examination_id = target_exam_id AND is_absent = FALSE;

    UPDATE public.examinations
    SET 
        batch_average_marks = avg_marks,
        batch_highest_marks = high_marks
    WHERE id = target_exam_id;

    -- 2. Automatically compute dense ranks across the batch
    WITH RankedResults AS (
        SELECT id, DENSE_RANK() OVER (ORDER BY marks_obtained DESC) as computed_rank
        FROM public.results
        WHERE examination_id = target_exam_id AND is_absent = FALSE
    )
    UPDATE public.results r
    SET batch_rank = rr.computed_rank
    FROM RankedResults rr
    WHERE r.id = rr.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recalculate_exam_metrics ON public.results;
CREATE TRIGGER trigger_recalculate_exam_metrics
AFTER INSERT OR UPDATE OF marks_obtained, is_absent OR DELETE ON public.results
FOR EACH ROW EXECUTE FUNCTION recalculate_exam_metrics_and_ranks();

-- 4. INDEXES (ON EVERY FOREIGN KEY AND ATTENDANCE (batch_id, date))

-- Attendance
CREATE INDEX IF NOT EXISTS idx_fk_attendance_institute ON public.attendance(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_attendance_batch ON public.attendance(batch_id);
CREATE INDEX IF NOT EXISTS idx_fk_attendance_student ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_fk_attendance_marked_by ON public.attendance(marked_by);
CREATE INDEX IF NOT EXISTS idx_attendance_batch_date ON public.attendance(batch_id, date);
CREATE INDEX IF NOT EXISTS idx_composite_attendance_lookup ON public.attendance(institute_id, batch_id, date, status);

-- Attendance Audit Log
CREATE INDEX IF NOT EXISTS idx_fk_audit_attendance ON public.attendance_audit_log(attendance_id);
CREATE INDEX IF NOT EXISTS idx_fk_audit_batch ON public.attendance_audit_log(batch_id);
CREATE INDEX IF NOT EXISTS idx_fk_audit_student ON public.attendance_audit_log(student_id);
CREATE INDEX IF NOT EXISTS idx_fk_audit_changed_by ON public.attendance_audit_log(changed_by);

-- Lectures
CREATE INDEX IF NOT EXISTS idx_fk_lectures_institute ON public.lectures(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_lectures_batch ON public.lectures(batch_id);
CREATE INDEX IF NOT EXISTS idx_fk_lectures_subject ON public.lectures(subject_id);
CREATE INDEX IF NOT EXISTS idx_fk_lectures_uploaded_by ON public.lectures(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_lectures_batch_created ON public.lectures(batch_id, created_at DESC);

-- Study Materials
CREATE INDEX IF NOT EXISTS idx_fk_materials_institute ON public.study_materials(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_materials_batch ON public.study_materials(batch_id);
CREATE INDEX IF NOT EXISTS idx_fk_materials_subject ON public.study_materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_fk_materials_uploaded_by ON public.study_materials(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_materials_batch_created ON public.study_materials(batch_id, created_at DESC);

-- Assignments
CREATE INDEX IF NOT EXISTS idx_fk_assignments_institute ON public.assignments(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_assignments_batch ON public.assignments(batch_id);
CREATE INDEX IF NOT EXISTS idx_fk_assignments_teacher ON public.assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_fk_assignments_subject ON public.assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_fk_assignments_created_by ON public.assignments(created_by);
CREATE INDEX IF NOT EXISTS idx_assignments_batch_due ON public.assignments(batch_id, due_date);

-- Submissions
CREATE INDEX IF NOT EXISTS idx_fk_submissions_institute ON public.submissions(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_submissions_assignment ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_fk_submissions_student ON public.submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_fk_submissions_graded_by ON public.submissions(graded_by);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_status ON public.submissions(assignment_id, status);

-- Examinations
CREATE INDEX IF NOT EXISTS idx_fk_examinations_institute ON public.examinations(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_examinations_batch ON public.examinations(batch_id);
CREATE INDEX IF NOT EXISTS idx_fk_examinations_subject ON public.examinations(subject_id);

-- Results
CREATE INDEX IF NOT EXISTS idx_fk_results_institute ON public.results(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_results_examination ON public.results(examination_id);
CREATE INDEX IF NOT EXISTS idx_fk_results_student ON public.results(student_id);
CREATE INDEX IF NOT EXISTS idx_fk_results_recorded_by ON public.results(recorded_by);
