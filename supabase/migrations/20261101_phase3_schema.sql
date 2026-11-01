-- ==============================================================================
-- ACADLY - PHASE 3 DATABASE SCHEMA: CORE ACADEMIC MANAGEMENT
-- ==============================================================================

-- 1. Attendance Records Table
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(5) NOT NULL CHECK (status IN ('P', 'A', 'L', 'E')), -- Present, Absent, Late, Excused
    marked_by UUID REFERENCES public.profiles(id),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(batch_id, student_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_batch_date ON public.attendance(batch_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id);

-- 2. Study Materials & PDF Notes Table
CREATE TABLE IF NOT EXISTS public.study_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50) DEFAULT 'pdf',
    file_size_bytes BIGINT DEFAULT 0,
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materials_institute ON public.study_materials(institute_id);
CREATE INDEX IF NOT EXISTS idx_materials_batch ON public.study_materials(batch_id);

-- 3. Video Lectures Table (YouTube Unlisted / MP4)
CREATE TABLE IF NOT EXISTS public.lectures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    provider VARCHAR(50) DEFAULT 'youtube' CHECK (provider IN ('youtube', 'direct', 'bunny')),
    video_id_or_url TEXT NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    thumbnail_url TEXT,
    faculty_name VARCHAR(255),
    is_live BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lectures_batch ON public.lectures(batch_id);

-- 4. Assignments / DPP Table
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    instructions TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    total_marks INTEGER DEFAULT 100,
    attachment_url TEXT,
    question_count INTEGER DEFAULT 25,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_batch ON public.assignments(batch_id);

-- 5. Assignment Submissions Table
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    submission_text TEXT,
    file_url TEXT,
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late', 'resubmit')),
    marks_obtained NUMERIC(5, 2),
    feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    graded_at TIMESTAMPTZ,
    UNIQUE(assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON public.submissions(student_id);

-- ==============================================================================
-- RLS POLICIES FOR PHASE 3
-- ==============================================================================

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Attendance: Members can read attendance for their institute batches
CREATE POLICY "Members view attendance"
    ON public.attendance FOR SELECT
    USING (
        institute_id IN (
            SELECT institute_id FROM public.institute_members
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Attendance: Teachers and Admins can mark/correct attendance
CREATE POLICY "Teachers mark attendance"
    ON public.attendance FOR ALL
    USING (
        institute_id IN (
            SELECT institute_id FROM public.institute_members
            WHERE user_id = auth.uid() AND role IN ('admin', 'teacher') AND status = 'active'
        )
    );

-- Study Materials: Viewable by enrolled students, teachers, admins
CREATE POLICY "Members view study materials"
    ON public.study_materials FOR SELECT
    USING (
        institute_id IN (
            SELECT institute_id FROM public.institute_members
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Teachers upload study materials"
    ON public.study_materials FOR INSERT
    WITH CHECK (
        institute_id IN (
            SELECT institute_id FROM public.institute_members
            WHERE user_id = auth.uid() AND role IN ('admin', 'teacher') AND status = 'active'
        )
    );

-- Lectures: Viewable by enrolled students and faculty
CREATE POLICY "Members view lectures"
    ON public.lectures FOR SELECT
    USING (
        institute_id IN (
            SELECT institute_id FROM public.institute_members
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Teachers publish lectures"
    ON public.lectures FOR ALL
    USING (
        institute_id IN (
            SELECT institute_id FROM public.institute_members
            WHERE user_id = auth.uid() AND role IN ('admin', 'teacher') AND status = 'active'
        )
    );

-- Assignments & Submissions
CREATE POLICY "Members view assignments"
    ON public.assignments FOR SELECT
    USING (
        institute_id IN (
            SELECT institute_id FROM public.institute_members
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Students submit assignments"
    ON public.submissions FOR ALL
    USING (
        student_id IN (
            SELECT id FROM public.students
            WHERE user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.assignments a
            JOIN public.institute_members im ON im.institute_id = a.institute_id
            WHERE a.id = submissions.assignment_id
              AND im.user_id = auth.uid()
              AND im.role IN ('admin', 'teacher')
        )
    );
