-- ==============================================================================
-- MIGRATION 0010: Batch Schedule and Examinations/Results Hardening
-- ==============================================================================

-- 1. Batch Schedule Table
CREATE TABLE IF NOT EXISTS public.batch_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    weekday TEXT NOT NULL CHECK (weekday IN ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    subject_name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    teacher_name TEXT,
    room TEXT,
    tag TEXT DEFAULT 'Classroom',
    is_live BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_batch_schedule_batch_id ON public.batch_schedule(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_schedule_institute_id ON public.batch_schedule(institute_id);

-- Enable RLS on batch_schedule
ALTER TABLE public.batch_schedule ENABLE ROW LEVEL SECURITY;

-- Select policy: Admins, teachers of batch, enrolled students of batch, or parents of enrolled students
CREATE POLICY batch_schedule_select ON public.batch_schedule
FOR SELECT TO authenticated
USING (
    public.is_institute_admin(institute_id)
    OR public.is_teacher_of_batch(batch_id)
    OR public.is_student_of_batch(batch_id)
    OR EXISTS (
        SELECT 1
        FROM public.parent_students ps
        JOIN public.parents p ON p.id = ps.parent_id
        JOIN public.batch_students bs ON bs.student_id = ps.student_id
        WHERE p.user_id = auth.uid()
          AND bs.batch_id = batch_schedule.batch_id
    )
);

-- Staff manage policy: Admins or teachers of batch can insert/update/delete schedule
CREATE POLICY batch_schedule_staff_manage ON public.batch_schedule
FOR ALL TO authenticated
USING (
    public.is_institute_admin(institute_id)
    OR public.is_teacher_of_batch(batch_id)
)
WITH CHECK (
    public.is_institute_admin(institute_id)
    OR public.is_teacher_of_batch(batch_id)
);

-- Ensure examinations staff manage policy allows teachers of batch to insert/update
DROP POLICY IF EXISTS examinations_staff_manage ON public.examinations;
CREATE POLICY examinations_staff_manage ON public.examinations
FOR ALL TO authenticated
USING (
    public.is_institute_admin(institute_id)
    OR public.is_teacher_of_batch(batch_id)
)
WITH CHECK (
    public.is_institute_admin(institute_id)
    OR public.is_teacher_of_batch(batch_id)
);

-- Ensure results staff manage policy allows teachers to enter/update marks
DROP POLICY IF EXISTS results_staff_manage ON public.results;
CREATE POLICY results_staff_manage ON public.results
FOR ALL TO authenticated
USING (
    public.is_institute_admin(institute_id)
    OR EXISTS (
        SELECT 1 FROM public.examinations e
        WHERE e.id = results.examination_id
          AND public.is_teacher_of_batch(e.batch_id)
    )
)
WITH CHECK (
    public.is_institute_admin(institute_id)
    OR EXISTS (
        SELECT 1 FROM public.examinations e
        WHERE e.id = results.examination_id
          AND public.is_teacher_of_batch(e.batch_id)
    )
);
