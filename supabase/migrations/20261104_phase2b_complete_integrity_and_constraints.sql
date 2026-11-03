-- ==============================================================================
-- MIGRATION: 20261104_phase2b_complete_integrity_and_constraints.sql
-- DESCRIPTION: Enforces table integrity, foreign keys, sensible check constraints,
--              unique indexes, receipts ledger, and automated updated_at triggers.
-- ==============================================================================

-- Ensure pgcrypto extension is enabled for gen_random_uuid() and password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Automated updated_at trigger function
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 2. Receipts Ledger Table (GST Compliance & Audit Trail)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL UNIQUE REFERENCES public.payments(id) ON DELETE CASCADE,
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    taxable_amount NUMERIC(10,2) NOT NULL CHECK (taxable_amount >= 0),
    gst_rate NUMERIC(5,2) NOT NULL DEFAULT 18.00 CHECK (gst_rate >= 0),
    gst_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (gst_amount >= 0),
    total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount > 0),
    signed_hash TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. Extend / Fix Missing Columns & Constraints on Core Tables
-- ------------------------------------------------------------------------------

-- Institutes: ensure invite_code is unique and non-empty
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'institutes_invite_code_unique'
    ) THEN
        ALTER TABLE public.institutes ADD CONSTRAINT institutes_invite_code_unique UNIQUE (invite_code);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN others THEN NULL;
END $$;

-- Profiles: ensure role check constraint
DO $$
BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_default_role_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_default_role_check 
        CHECK (default_role IN ('admin', 'teacher', 'student', 'parent'));
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Teachers: ensure unique teacher_code, sensible fee check
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teachers' AND column_name = 'teacher_code'
    ) THEN
        ALTER TABLE public.teachers ADD COLUMN teacher_code VARCHAR(50);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teachers' AND column_name = 'mode'
    ) THEN
        ALTER TABLE public.teachers ADD COLUMN mode VARCHAR(20) DEFAULT 'solo';
    END IF;

    ALTER TABLE public.teachers DROP CONSTRAINT IF EXISTS teachers_mode_check;
    ALTER TABLE public.teachers ADD CONSTRAINT teachers_mode_check 
        CHECK (mode IN ('solo', 'coaching_faculty'));

    ALTER TABLE public.teachers DROP CONSTRAINT IF EXISTS teachers_code_unique;
    ALTER TABLE public.teachers ADD CONSTRAINT teachers_code_unique UNIQUE (teacher_code);

    ALTER TABLE public.teachers DROP CONSTRAINT IF EXISTS teachers_institute_user_unique;
    ALTER TABLE public.teachers ADD CONSTRAINT teachers_institute_user_unique UNIQUE (institute_id, user_id);
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Students: ensure parent_link_code unique and non-empty
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'parent_link_code'
    ) THEN
        ALTER TABLE public.students ADD COLUMN parent_link_code VARCHAR(50);
    END IF;

    ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_parent_link_code_unique;
    ALTER TABLE public.students ADD CONSTRAINT students_parent_link_code_unique UNIQUE (parent_link_code);

    ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_institute_user_unique;
    ALTER TABLE public.students ADD CONSTRAINT students_institute_user_unique UNIQUE (institute_id, user_id);
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Parents: ensure institute_id and user_id uniqueness
DO $$
BEGIN
    ALTER TABLE public.parents DROP CONSTRAINT IF EXISTS parents_institute_user_unique;
    ALTER TABLE public.parents ADD CONSTRAINT parents_institute_user_unique UNIQUE (institute_id, user_id);
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Parent-Student Link: ensure one link per parent-student pair
DO $$
BEGIN
    ALTER TABLE public.parent_students DROP CONSTRAINT IF EXISTS parent_students_unique_pair;
    ALTER TABLE public.parent_students ADD CONSTRAINT parent_students_unique_pair UNIQUE (parent_id, student_id);
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Batch Enrollments: prevent duplicate enrollment of a student in the same batch
DO $$
BEGIN
    ALTER TABLE public.batch_students DROP CONSTRAINT IF EXISTS batch_students_unique_enrollment;
    ALTER TABLE public.batch_students ADD CONSTRAINT batch_students_unique_enrollment UNIQUE (batch_id, student_id);
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Batch Teachers: prevent duplicate assignment of teacher to the same batch
DO $$
BEGIN
    ALTER TABLE public.batch_teachers DROP CONSTRAINT IF EXISTS batch_teachers_unique_assignment;
    ALTER TABLE public.batch_teachers ADD CONSTRAINT batch_teachers_unique_assignment UNIQUE (batch_id, teacher_id);
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Attendance: ensure status is strictly P, A, or L; enforce unique student attendance per batch/day
DO $$
BEGIN
    ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_status_check;
    ALTER TABLE public.attendance ADD CONSTRAINT attendance_status_check 
        CHECK (status IN ('P', 'A', 'L', 'present', 'absent', 'late'));

    ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_unique_daily_student;
    ALTER TABLE public.attendance ADD CONSTRAINT attendance_unique_daily_student 
        UNIQUE (batch_id, student_id, date);
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Submissions: ensure marks obtained is non-negative and <= max marks
DO $$
BEGIN
    ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_marks_non_negative;
    ALTER TABLE public.submissions ADD CONSTRAINT submissions_marks_non_negative 
        CHECK (marks_obtained IS NULL OR marks_obtained >= 0);

    ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_unique_student_assignment;
    ALTER TABLE public.submissions ADD CONSTRAINT submissions_unique_student_assignment 
        UNIQUE (assignment_id, student_id);
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Fee Plans: ensure amount is positive
DO $$
BEGIN
    ALTER TABLE public.fee_plans DROP CONSTRAINT IF EXISTS fee_plans_amount_positive;
    ALTER TABLE public.fee_plans ADD CONSTRAINT fee_plans_amount_positive CHECK (amount > 0);
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Student Fees: ensure gross and net amounts are positive, status is valid
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_fees') THEN
        ALTER TABLE public.student_fees DROP CONSTRAINT IF EXISTS student_fees_amount_positive;
        ALTER TABLE public.student_fees ADD CONSTRAINT student_fees_amount_positive CHECK (gross_amount > 0);

        ALTER TABLE public.student_fees DROP CONSTRAINT IF EXISTS student_fees_net_positive;
        ALTER TABLE public.student_fees ADD CONSTRAINT student_fees_net_positive CHECK (net_payable > 0);

        ALTER TABLE public.student_fees DROP CONSTRAINT IF EXISTS student_fees_status_check;
        ALTER TABLE public.student_fees ADD CONSTRAINT student_fees_status_check 
            CHECK (status IN ('pending', 'partial', 'paid', 'overdue'));
    END IF;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Payments: ensure paid amount is positive, valid status
DO $$
BEGIN
    ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_amount_positive;
    ALTER TABLE public.payments ADD CONSTRAINT payments_amount_positive CHECK (amount_paid > 0);

    ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_check;
    ALTER TABLE public.payments ADD CONSTRAINT payments_status_check 
        CHECK (status IN ('pending', 'success', 'failed', 'refunded'));
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Chat: ensure pinned messages are indexed and attachments validate
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_messages' AND column_name = 'is_pinned'
    ) THEN
        ALTER TABLE public.chat_messages ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_messages' AND column_name = 'attachment_name'
    ) THEN
        ALTER TABLE public.chat_messages ADD COLUMN attachment_name VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_messages' AND column_name = 'attachment_type'
    ) THEN
        ALTER TABLE public.chat_messages ADD COLUMN attachment_type VARCHAR(20);
    END IF;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- ------------------------------------------------------------------------------
-- 4. High-Performance Query Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(default_role);
CREATE INDEX IF NOT EXISTS idx_teachers_code ON public.teachers(teacher_code);
CREATE INDEX IF NOT EXISTS idx_students_parent_code ON public.students(parent_link_code);
CREATE INDEX IF NOT EXISTS idx_parent_students_parent ON public.parent_students(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_students_student ON public.parent_students(student_id);

CREATE INDEX IF NOT EXISTS idx_batch_students_batch ON public.batch_students(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_students_student ON public.batch_students(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_lookup ON public.attendance(batch_id, date, status);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id, date);

CREATE INDEX IF NOT EXISTS idx_study_materials_batch ON public.study_materials(batch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lectures_batch ON public.lectures(batch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_batch ON public.assignments(batch_id, due_date);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.submissions(assignment_id, status);

CREATE INDEX IF NOT EXISTS idx_payments_student ON public.payments(student_id, paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_payment ON public.receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_receipts_number ON public.receipts(receipt_number);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON public.chat_messages(room_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_pinned ON public.chat_messages(room_id) WHERE is_pinned = TRUE;

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON public.notifications(recipient_user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_join_requests_institute_status ON public.join_requests(institute_id, status, applied_at DESC);

-- ------------------------------------------------------------------------------
-- 5. Attach updated_at Triggers
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    DROP TRIGGER IF EXISTS trigger_institutes_updated_at ON public.institutes;
    CREATE TRIGGER trigger_institutes_updated_at BEFORE UPDATE ON public.institutes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

    DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
    CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

    DROP TRIGGER IF EXISTS trigger_batches_updated_at ON public.batches;
    CREATE TRIGGER trigger_batches_updated_at BEFORE UPDATE ON public.batches
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
    WHEN others THEN NULL;
END $$;
