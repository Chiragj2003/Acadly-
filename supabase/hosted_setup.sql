-- =============================================================================
-- ACADLY - ONE-SHOT SETUP FOR A HOSTED SUPABASE PROJECT (dev / testing)
-- Paste this whole file into Dashboard -> SQL Editor -> New query -> Run.
-- It applies migrations 0001-0012, records them as applied (so the CLI's
-- `db push` won't re-run them later), then loads the dummy seed data.
-- Runs in one transaction: if anything fails, nothing is changed.
-- Generated from supabase/migrations/*.sql + supabase/seed.sql.
-- =============================================================================
BEGIN;

DO $guard$
BEGIN
  IF to_regclass('public.institutes') IS NOT NULL THEN
    RAISE EXCEPTION 'Acadly schema already exists in this project - setup was already run.';
  END IF;
END $guard$;

-- >>>>>>>>>>>>>>>>>>>> MIGRATION 0001_core.sql >>>>>>>>>>>>>>>>>>>>
-- ==============================================================================
-- CANONICAL MIGRATION: 0001_core.sql
-- Modules: Institutes, Profiles, Institute Members, Teachers, Students,
--          Parents, Parent-Students, Subjects, Batches, Batch Enrollments,
--          Join Requests, Foreign Key Indexes, & Auth Triggers.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE account_type_enum AS ENUM ('coaching_center', 'individual_teacher');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE app_role_enum AS ENUM ('admin', 'teacher', 'student', 'parent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE verification_status_enum AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE member_status_enum AS ENUM ('active', 'suspended', 'pending');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. CORE TABLES

-- 1. Institutes / Workspaces
CREATE TABLE IF NOT EXISTS public.institutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    center_code VARCHAR(50) UNIQUE NOT NULL,
    invite_code VARCHAR(50) UNIQUE NOT NULL,
    account_type account_type_enum NOT NULL DEFAULT 'coaching_center',
    city VARCHAR(100) NOT NULL,
    campus_name VARCHAR(100) DEFAULT 'Main Campus',
    logo_url TEXT,
    banner_url TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    state VARCHAR(100),
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    default_role app_role_enum NOT NULL DEFAULT 'student',
    expo_push_token TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Institute Members (Multi-Tenant Memberships & Roles)
CREATE TABLE IF NOT EXISTS public.institute_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role app_role_enum NOT NULL DEFAULT 'student',
    status member_status_enum NOT NULL DEFAULT 'active',
    verification_status verification_status_enum NOT NULL DEFAULT 'verified',
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, user_id, role)
);

-- 4. Teachers (Extended Faculty Profile)
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    teacher_code VARCHAR(50) UNIQUE NOT NULL,
    mode VARCHAR(20) DEFAULT 'solo' CHECK (mode IN ('solo', 'coaching_faculty')),
    qualification VARCHAR(255),
    specialization VARCHAR(255),
    specialization_subjects TEXT[] DEFAULT '{}',
    experience_years NUMERIC(4, 1) DEFAULT 0.0,
    monthly_fee_rate NUMERIC(10, 2) DEFAULT 0.00,
    bio TEXT,
    achievements TEXT,
    demo_video_url TEXT,
    joining_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, user_id)
);

-- 5. Students (Extended Student Bio & Academic Profile)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    roll_number VARCHAR(50) NOT NULL,
    admission_number VARCHAR(50),
    parent_link_code VARCHAR(50) UNIQUE NOT NULL,
    class_grade VARCHAR(50) NOT NULL,
    grade VARCHAR(50),
    board VARCHAR(50) DEFAULT 'CBSE',
    target_exam VARCHAR(100),
    school_or_college VARCHAR(255),
    school_name VARCHAR(255),
    medium VARCHAR(50) DEFAULT 'English',
    dob DATE,
    blood_group VARCHAR(10),
    address TEXT,
    guardian_name VARCHAR(100),
    guardian_phone VARCHAR(50),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(50),
    previous_percentage VARCHAR(50),
    weak_topics TEXT[] DEFAULT '{}',
    weak_subjects TEXT[] DEFAULT '{}',
    admission_date DATE DEFAULT CURRENT_DATE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, user_id)
);

-- 6. Parents
CREATE TABLE IF NOT EXISTS public.parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    phone VARCHAR(50),
    occupation VARCHAR(100),
    alternate_phone VARCHAR(50),
    relationship_type VARCHAR(50) DEFAULT 'Guardian',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, user_id)
);

-- 7. Parent-Student Mapping (Child Links)
CREATE TABLE IF NOT EXISTS public.parent_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    relationship VARCHAR(50) DEFAULT 'Child',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

-- 8. Subjects
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL,
    color_hex VARCHAR(20) DEFAULT '#ff7d6b',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, code)
);

-- 9. Batches
CREATE TABLE IF NOT EXISTS public.batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(100),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    target_exam VARCHAR(100),
    room_number VARCHAR(50),
    start_time VARCHAR(50),
    end_time VARCHAR(50),
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'upcoming', 'completed', 'archived')),
    academic_year VARCHAR(50) DEFAULT '2026-2027',
    start_date DATE,
    end_date DATE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Batch Teachers (Faculty Assignments)
CREATE TABLE IF NOT EXISTS public.batch_teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(batch_id, teacher_id)
);

-- 11. Batch Students (Enrollments)
CREATE TABLE IF NOT EXISTS public.batch_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'enrolled',
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(batch_id, student_id)
);

-- 12. Join Requests (Teacher Code Student Verification Queue)
CREATE TABLE IF NOT EXISTS public.join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    requested_role app_role_enum NOT NULL DEFAULT 'student',
    code_used VARCHAR(50) NOT NULL,
    student_extra_details_json JSONB DEFAULT '{}'::jsonb,
    status verification_status_enum NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. FOREIGN KEY INDEXES
CREATE INDEX IF NOT EXISTS idx_institutes_center_code ON public.institutes(center_code);
CREATE INDEX IF NOT EXISTS idx_institutes_invite_code ON public.institutes(invite_code);
CREATE INDEX IF NOT EXISTS idx_institutes_owner ON public.institutes(owner_id);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(default_role);

CREATE INDEX IF NOT EXISTS idx_fk_members_institute ON public.institute_members(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_members_user ON public.institute_members(user_id);
CREATE INDEX IF NOT EXISTS idx_fk_members_verified_by ON public.institute_members(verified_by);

CREATE INDEX IF NOT EXISTS idx_fk_teachers_institute ON public.teachers(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_teachers_user ON public.teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_code ON public.teachers(teacher_code);

CREATE INDEX IF NOT EXISTS idx_fk_students_institute ON public.students(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_students_user ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_parent_code ON public.students(parent_link_code);

CREATE INDEX IF NOT EXISTS idx_fk_parents_institute ON public.parents(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_parents_user ON public.parents(user_id);

CREATE INDEX IF NOT EXISTS idx_fk_parent_students_institute ON public.parent_students(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_parent_students_parent ON public.parent_students(parent_id);
CREATE INDEX IF NOT EXISTS idx_fk_parent_students_student ON public.parent_students(student_id);

CREATE INDEX IF NOT EXISTS idx_fk_subjects_institute ON public.subjects(institute_id);

CREATE INDEX IF NOT EXISTS idx_fk_batches_institute ON public.batches(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_batches_subject ON public.batches(subject_id);
CREATE INDEX IF NOT EXISTS idx_fk_batches_teacher ON public.batches(teacher_id);

CREATE INDEX IF NOT EXISTS idx_fk_batch_teachers_institute ON public.batch_teachers(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_batch_teachers_batch ON public.batch_teachers(batch_id);
CREATE INDEX IF NOT EXISTS idx_fk_batch_teachers_teacher ON public.batch_teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_fk_batch_teachers_subject ON public.batch_teachers(subject_id);

CREATE INDEX IF NOT EXISTS idx_fk_batch_students_institute ON public.batch_students(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_batch_students_batch ON public.batch_students(batch_id);
CREATE INDEX IF NOT EXISTS idx_fk_batch_students_student ON public.batch_students(student_id);

CREATE INDEX IF NOT EXISTS idx_fk_join_requests_institute ON public.join_requests(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_join_requests_teacher ON public.join_requests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_fk_join_requests_user ON public.join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_fk_join_requests_reviewed_by ON public.join_requests(reviewed_by);

-- 6. ATTACH UPDATED_AT TRIGGERS
DROP TRIGGER IF EXISTS trigger_institutes_updated_at ON public.institutes;
CREATE TRIGGER trigger_institutes_updated_at
BEFORE UPDATE ON public.institutes
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_batches_updated_at ON public.batches;
CREATE TRIGGER trigger_batches_updated_at
BEFORE UPDATE ON public.batches
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. AUTH TRIGGER: CREATE PROFILES ROW ON AUTH.USERS INSERT & COPY APP_METADATA
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role app_role_enum := 'student';
    user_full_name TEXT := '';
    target_inst_id UUID := NULL;
    raw_role_str TEXT;
BEGIN
    -- Extract full name
    user_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    -- Extract role if supplied
    raw_role_str := COALESCE(
        NEW.raw_app_meta_data->>'role',
        NEW.raw_user_meta_data->>'role',
        'student'
    );
    IF raw_role_str IN ('admin', 'teacher', 'student', 'parent') THEN
        user_role := raw_role_str::app_role_enum;
    END IF;

    -- Extract institute_id if supplied
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
        default_role = EXCLUDED.default_role;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 7. SECURE SERVER-SIDE REGISTRATION & ROLE RPCs
-- Role and institute_id are stamped into JWT raw_app_meta_data server-side.
-- Client cannot self-assign roles or modify app_metadata directly.

CREATE OR REPLACE FUNCTION public.create_institute_and_admin(
    p_name TEXT,
    p_center_code TEXT,
    p_city TEXT,
    p_phone TEXT DEFAULT NULL,
    p_subjects TEXT[] DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_inst_id UUID;
    v_invite_code TEXT;
    v_clean_name TEXT;
    v_inst RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    v_clean_name := trim(p_name);
    IF length(v_clean_name) < 2 THEN
        RAISE EXCEPTION 'Institute name must be at least 2 characters';
    END IF;

    v_invite_code := upper(substring(regexp_replace(v_clean_name, '[^a-zA-Z0-9]', '', 'g') from 1 for 4)) || '-' || floor(1000 + random() * 9000)::text;

    INSERT INTO public.institutes (
        name,
        code,
        center_code,
        invite_code,
        account_type,
        city,
        campus_name,
        phone,
        owner_id,
        is_active
    ) VALUES (
        v_clean_name,
        upper(regexp_replace(v_clean_name, '\s+', '-', 'g')) || '-' || upper(trim(p_city)),
        upper(trim(p_center_code)),
        v_invite_code,
        'coaching_center',
        trim(p_city),
        trim(p_city) || ' Campus',
        p_phone,
        v_user_id,
        true
    ) RETURNING * INTO v_inst;

    v_inst_id := v_inst.id;

    IF p_subjects IS NOT NULL AND array_length(p_subjects, 1) > 0 THEN
        INSERT INTO public.subjects (institute_id, name, code)
        SELECT v_inst_id, trim(s), upper(substring(regexp_replace(trim(s), '[^a-zA-Z0-9]', '', 'g') from 1 for 4)) || '-' || row_number() over ()
        FROM unnest(p_subjects) AS s
        ON CONFLICT (institute_id, code) DO NOTHING;
    END IF;

    INSERT INTO public.institute_members (
        institute_id,
        user_id,
        role,
        status,
        verification_status
    ) VALUES (
        v_inst_id,
        v_user_id,
        'admin',
        'active',
        'verified'
    ) ON CONFLICT (institute_id, user_id, role) DO UPDATE
    SET status = 'active', verification_status = 'verified';

    UPDATE public.profiles
    SET default_role = 'admin'
    WHERE id = v_user_id;

    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin', 'institute_id', v_inst_id)
    WHERE id = v_user_id;

    RETURN to_jsonb(v_inst);
END;
$$;

CREATE OR REPLACE FUNCTION public.join_institute_as_teacher(
    p_code TEXT,
    p_qualification TEXT DEFAULT NULL,
    p_specialization TEXT DEFAULT NULL,
    p_specialization_subjects TEXT[] DEFAULT '{}',
    p_experience_years NUMERIC DEFAULT 0,
    p_monthly_fee_rate NUMERIC DEFAULT 0,
    p_bio TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_inst RECORD;
    v_teacher_code TEXT;
    v_clean_code TEXT;
    v_user_name TEXT;
    v_teacher RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    v_clean_code := upper(trim(p_code));

    SELECT * INTO v_inst
    FROM public.institutes
    WHERE upper(invite_code) = v_clean_code
       OR upper(center_code) = v_clean_code
       OR upper(code) = v_clean_code
    LIMIT 1;

    IF v_inst.id IS NULL THEN
        RAISE EXCEPTION 'Invalid institute code: %', p_code;
    END IF;

    SELECT full_name INTO v_user_name FROM public.profiles WHERE id = v_user_id;

    v_teacher_code := upper(substring(regexp_replace(COALESCE(v_user_name, 'TCHR'), '[^a-zA-Z0-9]', '', 'g') from 1 for 4)) || '-' || floor(1000 + random() * 9000)::text;

    INSERT INTO public.teachers (
        institute_id,
        user_id,
        teacher_code,
        mode,
        qualification,
        specialization,
        specialization_subjects,
        experience_years,
        monthly_fee_rate,
        bio
    ) VALUES (
        v_inst.id,
        v_user_id,
        v_teacher_code,
        'coaching_faculty',
        p_qualification,
        p_specialization,
        p_specialization_subjects,
        p_experience_years,
        p_monthly_fee_rate,
        p_bio
    )
    ON CONFLICT (institute_id, user_id) DO UPDATE
    SET
        qualification = COALESCE(EXCLUDED.qualification, public.teachers.qualification),
        specialization = COALESCE(EXCLUDED.specialization, public.teachers.specialization),
        specialization_subjects = COALESCE(EXCLUDED.specialization_subjects, public.teachers.specialization_subjects)
    RETURNING * INTO v_teacher;

    INSERT INTO public.institute_members (
        institute_id,
        user_id,
        role,
        status,
        verification_status
    ) VALUES (
        v_inst.id,
        v_user_id,
        'teacher',
        'active',
        'verified'
    ) ON CONFLICT (institute_id, user_id, role) DO UPDATE
    SET status = 'active';

    UPDATE public.profiles
    SET default_role = 'teacher'
    WHERE id = v_user_id;

    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'teacher', 'institute_id', v_inst.id)
    WHERE id = v_user_id;

    RETURN jsonb_build_object(
        'teacher', to_jsonb(v_teacher),
        'institute', to_jsonb(v_inst)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.link_child_by_code(
    p_student_code TEXT,
    p_relationship TEXT DEFAULT 'Child'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_student RECORD;
    v_parent RECORD;
    v_student_profile RECORD;
    v_clean_code TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    v_clean_code := upper(trim(p_student_code));

    SELECT * INTO v_student
    FROM public.students
    WHERE upper(parent_link_code) = v_clean_code
       OR upper(roll_number) = v_clean_code
       OR upper(admission_number) = v_clean_code
    LIMIT 1;

    IF v_student.id IS NULL THEN
        RAISE EXCEPTION 'No student found with link code: %', p_student_code;
    END IF;

    INSERT INTO public.parents (
        institute_id,
        user_id,
        relationship_type
    ) VALUES (
        v_student.institute_id,
        v_user_id,
        p_relationship
    ) ON CONFLICT (institute_id, user_id) DO UPDATE
    SET relationship_type = EXCLUDED.relationship_type
    RETURNING * INTO v_parent;

    INSERT INTO public.parent_students (
        institute_id,
        parent_id,
        student_id,
        relationship
    ) VALUES (
        v_student.institute_id,
        v_parent.id,
        v_student.id,
        p_relationship
    ) ON CONFLICT (parent_id, student_id) DO NOTHING;

    INSERT INTO public.institute_members (
        institute_id,
        user_id,
        role,
        status,
        verification_status
    ) VALUES (
        v_student.institute_id,
        v_user_id,
        'parent',
        'active',
        'verified'
    ) ON CONFLICT (institute_id, user_id, role) DO UPDATE
    SET status = 'active';

    UPDATE public.profiles
    SET default_role = 'parent'
    WHERE id = v_user_id;

    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'parent', 'institute_id', v_student.institute_id)
    WHERE id = v_user_id;

    SELECT full_name, email INTO v_student_profile FROM public.profiles WHERE id = v_student.user_id;

    RETURN jsonb_build_object(
        'student', to_jsonb(v_student),
        'student_name', v_student_profile.full_name,
        'parent', to_jsonb(v_parent),
        'institute_id', v_student.institute_id
    );
END;
$$;


-- >>>>>>>>>>>>>>>>>>>> MIGRATION 0002_academic.sql >>>>>>>>>>>>>>>>>>>>
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


-- >>>>>>>>>>>>>>>>>>>> MIGRATION 0003_community_chat.sql >>>>>>>>>>>>>>>>>>>>
-- ==============================================================================
-- CANONICAL MIGRATION: 0003_community_chat.sql
-- Modules: Chat Rooms, Chat Messages, Community Posts, Community Comments,
--          Community Upvotes, Foreign Key Indexes & Realtime Setup.
-- ==============================================================================

-- 1. CHAT TABLES

-- 1. Chat Rooms (Batch Group Chat and 1-on-1 Direct Doubt Messaging)
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('batch_group', 'direct_doubt')),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    last_message_text TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('teacher', 'student', 'admin', 'parent')),
    message_text TEXT,
    attachment_url TEXT,
    attachment_type VARCHAR(20) CHECK (attachment_type IN ('pdf', 'image', 'file')),
    attachment_name VARCHAR(255),
    is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. COMMUNITY TABLES

-- 3. Community Posts (Peer Q&A, Doubt Discussions)
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    pdf_or_file_url TEXT,
    image_url TEXT,
    upvotes_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Community Comments (Answers, Clarifications)
CREATE TABLE IF NOT EXISTS public.community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    attachment_url TEXT,
    is_teacher_verified_answer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Community Upvotes
CREATE TABLE IF NOT EXISTS public.community_upvotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- 3. FOREIGN KEY & QUERY INDEXES

-- Chat Rooms
CREATE INDEX IF NOT EXISTS idx_fk_chat_rooms_institute ON public.chat_rooms(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_chat_rooms_batch ON public.chat_rooms(batch_id);
CREATE INDEX IF NOT EXISTS idx_fk_chat_rooms_teacher ON public.chat_rooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_fk_chat_rooms_student ON public.chat_rooms(student_id);

-- Chat Messages
CREATE INDEX IF NOT EXISTS idx_fk_chat_messages_room ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_fk_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON public.chat_messages(room_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_pinned ON public.chat_messages(room_id) WHERE is_pinned = TRUE;

-- Community Posts
CREATE INDEX IF NOT EXISTS idx_fk_community_posts_institute ON public.community_posts(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_community_posts_batch ON public.community_posts(batch_id);
CREATE INDEX IF NOT EXISTS idx_fk_community_posts_subject ON public.community_posts(subject_id);
CREATE INDEX IF NOT EXISTS idx_fk_community_posts_author ON public.community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON public.community_posts(institute_id, created_at DESC);

-- Community Comments
CREATE INDEX IF NOT EXISTS idx_fk_community_comments_institute ON public.community_comments(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_community_comments_post ON public.community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_fk_community_comments_author ON public.community_comments(author_id);

-- Community Upvotes
CREATE INDEX IF NOT EXISTS idx_fk_community_upvotes_post ON public.community_upvotes(post_id);
CREATE INDEX IF NOT EXISTS idx_fk_community_upvotes_user ON public.community_upvotes(user_id);

-- 4. REALTIME PUBLICATION SETUP
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'chat_rooms'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'community_posts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'community_comments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.community_comments;
    END IF;
END $$;


-- >>>>>>>>>>>>>>>>>>>> MIGRATION 0004_fees.sql >>>>>>>>>>>>>>>>>>>>
-- ==============================================================================
-- CANONICAL MIGRATION: 0004_fees.sql
-- Modules: Fee Plans, Student Fees (pending_amount, paid_amount, total_amount,
--          status in ('paid','partial','pending','overdue')),
--          Payments (gst_amount, razorpay_signature, notes),
--          Receipts, Notifications, Push Tokens & Foreign Key Indexes.
-- ==============================================================================

-- 1. FEE & PAYMENT TABLES

-- 1. Fee Plans (Academic Course / Term Packages)
CREATE TABLE IF NOT EXISTS public.fee_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    total_amount NUMERIC(10, 2),
    frequency VARCHAR(50) DEFAULT 'term' CHECK (frequency IN ('annual', 'term', 'monthly', 'one_time')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Student Fees (Student Ledger with pending_amount, paid_amount, total_amount)
CREATE TABLE IF NOT EXISTS public.student_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    fee_plan_id UUID REFERENCES public.fee_plans(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount > 0),
    paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    pending_amount NUMERIC(10, 2) NOT NULL CHECK (pending_amount >= 0),
    discount_amount NUMERIC(10, 2) DEFAULT 0.00,
    net_payable NUMERIC(10, 2),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'partial', 'pending', 'overdue')),
    due_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Payments (with gst_amount, razorpay_signature, notes)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    student_fee_id UUID NOT NULL REFERENCES public.student_fees(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_mode VARCHAR(50) DEFAULT 'razorpay' CHECK (payment_mode IN ('razorpay', 'upi', 'cash', 'bank_transfer', 'cheque', 'bank')),
    payment_method VARCHAR(50) DEFAULT 'razorpay',
    gst_amount NUMERIC(10, 2) DEFAULT 0.00 CHECK (gst_amount >= 0),
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    razorpay_signature TEXT,
    receipt_number VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'paid' CHECK (status IN ('paid', 'success', 'pending', 'failed', 'refunded')),
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    paid_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Receipts Ledger (GST Compliance & Audit Trail)
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL UNIQUE REFERENCES public.payments(id) ON DELETE CASCADE,
    receipt_number VARCHAR(100) NOT NULL UNIQUE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    taxable_amount NUMERIC(10, 2) NOT NULL CHECK (taxable_amount >= 0),
    gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00 CHECK (gst_rate >= 0),
    gst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (gst_amount >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount > 0),
    signed_hash TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. NOTIFICATIONS & PUSH TOKENS

-- 5. In-App Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_role VARCHAR(20) CHECK (recipient_role IN ('admin', 'teacher', 'student', 'parent', 'all')),
    title VARCHAR(255) NOT NULL,
    body TEXT,
    message TEXT,
    type VARCHAR(50) DEFAULT 'general',
    data JSONB DEFAULT '{}'::jsonb,
    deep_link_data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Push Tokens (Expo Push Device Registration)
CREATE TABLE IF NOT EXISTS public.push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    platform VARCHAR(20) DEFAULT 'expo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. FOREIGN KEY & COMPOSITE QUERY INDEXES

-- Fee Plans
CREATE INDEX IF NOT EXISTS idx_fk_fee_plans_institute ON public.fee_plans(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_fee_plans_batch ON public.fee_plans(batch_id);

-- Student Fees
CREATE INDEX IF NOT EXISTS idx_fk_student_fees_institute ON public.student_fees(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_student_fees_student ON public.student_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fk_student_fees_plan ON public.student_fees(fee_plan_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_status ON public.student_fees(status);
CREATE INDEX IF NOT EXISTS idx_composite_student_fees_overdue ON public.student_fees(institute_id, status, due_date);

-- Payments
CREATE INDEX IF NOT EXISTS idx_fk_payments_institute ON public.payments(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_payments_fee ON public.payments(student_fee_id);
CREATE INDEX IF NOT EXISTS idx_fk_payments_student ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fk_payments_recorded_by ON public.payments(recorded_by);
CREATE INDEX IF NOT EXISTS idx_payments_receipt ON public.payments(receipt_number);
CREATE INDEX IF NOT EXISTS idx_payments_student_paid ON public.payments(student_id, paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay ON public.payments(razorpay_payment_id);

-- Receipts
CREATE INDEX IF NOT EXISTS idx_fk_receipts_institute ON public.receipts(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_receipts_payment ON public.receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_fk_receipts_student ON public.receipts(student_id);
CREATE INDEX IF NOT EXISTS idx_receipts_number ON public.receipts(receipt_number);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_fk_notifications_institute ON public.notifications(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_fk_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON public.notifications(recipient_id, is_read, created_at DESC);

-- Push Tokens
CREATE INDEX IF NOT EXISTS idx_fk_push_tokens_user ON public.push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON public.push_tokens(token);

-- 4. ATTACH UPDATED_AT TRIGGERS
DROP TRIGGER IF EXISTS trigger_student_fees_updated_at ON public.student_fees;
CREATE TRIGGER trigger_student_fees_updated_at
BEFORE UPDATE ON public.student_fees
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_push_tokens_updated_at ON public.push_tokens;
CREATE TRIGGER trigger_push_tokens_updated_at
BEFORE UPDATE ON public.push_tokens
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- >>>>>>>>>>>>>>>>>>>> MIGRATION 0005_rls.sql >>>>>>>>>>>>>>>>>>>>
-- ==============================================================================
-- CANONICAL MIGRATION: 0005_rls.sql
-- Modules: Security Definer Helper Functions & Multi-Tenant RLS Policies.
-- Enforces: Leak-free student isolation, batch-scoped teacher access,
--           parent child-linking, and strict JWT role validation.
-- ==============================================================================

-- 1. SECURITY DEFINER HELPER FUNCTIONS

-- 1.1 Read role from JWT app_metadata with fallback to institute_members
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT COALESCE(
        current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role',
        (auth.jwt() -> 'app_metadata' ->> 'role'),
        (SELECT role::text FROM public.institute_members WHERE user_id = auth.uid() AND status = 'active' LIMIT 1),
        (SELECT default_role::text FROM public.profiles WHERE id = auth.uid()),
        'student'
    );
$$;

-- 1.2 Read institute_id from JWT app_metadata with fallback to institute_members
CREATE OR REPLACE FUNCTION public.auth_institute_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT COALESCE(
        NULLIF(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'institute_id', '')::uuid,
        NULLIF(auth.jwt() -> 'app_metadata' ->> 'institute_id', '')::uuid,
        (SELECT institute_id FROM public.institute_members WHERE user_id = auth.uid() AND status = 'active' LIMIT 1)
    );
$$;

-- 1.3 Check if user belongs to the target institute
CREATE OR REPLACE FUNCTION public.is_institute_member(target_inst_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT (
        public.auth_institute_id() = target_inst_id
        OR EXISTS (
            SELECT 1 FROM public.institute_members
            WHERE institute_id = target_inst_id
              AND user_id = auth.uid()
              AND status = 'active'
        )
    );
$$;

-- 1.4 Check if user is an admin of the target institute
CREATE OR REPLACE FUNCTION public.is_institute_admin(target_inst_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT (
        (public.auth_role() = 'admin' AND public.is_institute_member(target_inst_id))
        OR EXISTS (
            SELECT 1 FROM public.institutes
            WHERE id = target_inst_id AND owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.institute_members
            WHERE institute_id = target_inst_id
              AND user_id = auth.uid()
              AND role = 'admin'
              AND status = 'active'
        )
    );
$$;

-- 1.5 Check if user is a teacher assigned to the target batch
CREATE OR REPLACE FUNCTION public.is_teacher_of_batch(target_batch_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
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

-- 1.6 Check if user is a linked parent of the target student
CREATE OR REPLACE FUNCTION public.is_parent_of(target_student_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.parent_students ps
        JOIN public.parents p ON p.id = ps.parent_id
        WHERE ps.student_id = target_student_id
          AND p.user_id = auth.uid()
    );
$$;

-- 1.7 Check if student is enrolled in the target batch
CREATE OR REPLACE FUNCTION public.is_student_in_batch(target_batch_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.batch_students bs
        JOIN public.students s ON s.id = bs.student_id
        WHERE bs.batch_id = target_batch_id
          AND s.user_id = auth.uid()
    );
$$;

-- 2. ENABLE RLS ON ALL 31 TABLES
ALTER TABLE public.institutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institute_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- 3. EXPLICIT RLS POLICIES FOR EVERY TABLE

-- 3.1 Institutes
CREATE POLICY "institutes_select" ON public.institutes FOR SELECT TO authenticated USING (true);
CREATE POLICY "institutes_admin_manage" ON public.institutes FOR ALL TO authenticated
    USING (owner_id = auth.uid() OR public.is_institute_admin(id))
    WITH CHECK (owner_id = auth.uid() OR public.is_institute_admin(id));

-- 3.2 Profiles
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
    USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

-- 3.3 Institute Members
CREATE POLICY "institute_members_select" ON public.institute_members FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_institute_member(institute_id));
CREATE POLICY "institute_members_admin_manage" ON public.institute_members FOR ALL TO authenticated
    USING (public.is_institute_admin(institute_id))
    WITH CHECK (public.is_institute_admin(institute_id));

-- 3.4 Teachers
CREATE POLICY "teachers_select" ON public.teachers FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_institute_member(institute_id));
CREATE POLICY "teachers_manage" ON public.teachers FOR ALL TO authenticated
    USING (user_id = auth.uid() OR public.is_institute_admin(institute_id))
    WITH CHECK (user_id = auth.uid() OR public.is_institute_admin(institute_id));

-- 3.5 Students
-- Student reads/updates own row; teachers read students in their batches; admins read all in institute; parents read linked children.
CREATE POLICY "students_select" ON public.students FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR public.is_parent_of(id)
        OR public.is_institute_admin(institute_id)
        OR EXISTS (
            SELECT 1 FROM public.batch_students bs
            WHERE bs.student_id = students.id
              AND public.is_teacher_of_batch(bs.batch_id)
        )
    );
CREATE POLICY "students_update" ON public.students FOR UPDATE TO authenticated
    USING (user_id = auth.uid() OR public.is_institute_admin(institute_id))
    WITH CHECK (user_id = auth.uid() OR public.is_institute_admin(institute_id));
CREATE POLICY "students_insert" ON public.students FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() OR public.is_institute_admin(institute_id));
CREATE POLICY "students_delete" ON public.students FOR DELETE TO authenticated
    USING (public.is_institute_admin(institute_id));

-- 3.6 Parents
CREATE POLICY "parents_select" ON public.parents FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_institute_admin(institute_id));
CREATE POLICY "parents_manage" ON public.parents FOR ALL TO authenticated
    USING (user_id = auth.uid() OR public.is_institute_admin(institute_id))
    WITH CHECK (user_id = auth.uid() OR public.is_institute_admin(institute_id));

-- 3.7 Parent Students
CREATE POLICY "parent_students_select" ON public.parent_students FOR SELECT TO authenticated
    USING (
        public.is_parent_of(student_id)
        OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = parent_students.student_id AND s.user_id = auth.uid())
        OR public.is_institute_admin(institute_id)
    );
CREATE POLICY "parent_students_manage" ON public.parent_students FOR ALL TO authenticated
    USING (public.is_institute_admin(institute_id))
    WITH CHECK (public.is_institute_admin(institute_id));

-- 3.8 Subjects
CREATE POLICY "subjects_select" ON public.subjects FOR SELECT TO authenticated
    USING (public.is_institute_member(institute_id));
CREATE POLICY "subjects_admin_manage" ON public.subjects FOR ALL TO authenticated
    USING (public.is_institute_admin(institute_id))
    WITH CHECK (public.is_institute_admin(institute_id));

-- 3.9 Batches
CREATE POLICY "batches_select" ON public.batches FOR SELECT TO authenticated
    USING (public.is_institute_member(institute_id));
CREATE POLICY "batches_admin_manage" ON public.batches FOR ALL TO authenticated
    USING (public.is_institute_admin(institute_id) OR public.is_teacher_of_batch(id))
    WITH CHECK (public.is_institute_admin(institute_id));

-- 3.10 Batch Teachers
CREATE POLICY "batch_teachers_select" ON public.batch_teachers FOR SELECT TO authenticated
    USING (public.is_institute_member(institute_id));
CREATE POLICY "batch_teachers_admin_manage" ON public.batch_teachers FOR ALL TO authenticated
    USING (public.is_institute_admin(institute_id))
    WITH CHECK (public.is_institute_admin(institute_id));

-- 3.11 Batch Students
CREATE POLICY "batch_students_select" ON public.batch_students FOR SELECT TO authenticated
    USING (
        public.is_institute_admin(institute_id)
        OR public.is_teacher_of_batch(batch_id)
        OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = batch_students.student_id AND s.user_id = auth.uid())
        OR public.is_parent_of(student_id)
    );
CREATE POLICY "batch_students_admin_manage" ON public.batch_students FOR ALL TO authenticated
    USING (public.is_institute_admin(institute_id) OR public.is_teacher_of_batch(batch_id))
    WITH CHECK (public.is_institute_admin(institute_id) OR public.is_teacher_of_batch(batch_id));

-- 3.12 Join Requests
-- Student inserts and selects own; teacher/admin selects and updates status.
CREATE POLICY "join_requests_select" ON public.join_requests FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR (public.is_institute_member(institute_id) AND public.auth_role() IN ('admin', 'teacher'))
    );
CREATE POLICY "join_requests_insert" ON public.join_requests FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "join_requests_update" ON public.join_requests FOR UPDATE TO authenticated
    USING (public.is_institute_member(institute_id) AND public.auth_role() IN ('admin', 'teacher'))
    WITH CHECK (public.is_institute_member(institute_id) AND public.auth_role() IN ('admin', 'teacher'));
CREATE POLICY "join_requests_delete" ON public.join_requests FOR DELETE TO authenticated
    USING (public.is_institute_admin(institute_id));

-- 3.13 Attendance
-- Student reads only own rows; parent reads only linked children; teacher reads/writes only their batches; admin reads all.
CREATE POLICY "attendance_select" ON public.attendance FOR SELECT TO authenticated
    USING (
        public.is_institute_admin(institute_id)
        OR public.is_teacher_of_batch(batch_id)
        OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = attendance.student_id AND s.user_id = auth.uid())
        OR public.is_parent_of(student_id)
    );
CREATE POLICY "attendance_write" ON public.attendance FOR ALL TO authenticated
    USING (public.is_institute_admin(institute_id) OR public.is_teacher_of_batch(batch_id))
    WITH CHECK (public.is_institute_admin(institute_id) OR public.is_teacher_of_batch(batch_id));

-- 3.14 Attendance Audit Log
CREATE POLICY "audit_log_select" ON public.attendance_audit_log FOR SELECT TO authenticated
    USING (public.is_teacher_of_batch(batch_id));
CREATE POLICY "audit_log_insert" ON public.attendance_audit_log FOR INSERT TO authenticated
    WITH CHECK (public.is_teacher_of_batch(batch_id) AND changed_by = auth.uid());

-- 3.15 Lectures
CREATE POLICY "lectures_select" ON public.lectures FOR SELECT TO authenticated
    USING (public.is_institute_member(institute_id));
CREATE POLICY "lectures_write" ON public.lectures FOR ALL TO authenticated
    USING (public.is_institute_admin(institute_id) OR public.is_teacher_of_batch(batch_id))
    WITH CHECK (public.is_institute_admin(institute_id) OR public.is_teacher_of_batch(batch_id));

-- 3.16 Study Materials
-- Study-materials readable by batch members, writable by teachers/admins.
CREATE POLICY "study_materials_select" ON public.study_materials FOR SELECT TO authenticated
    USING (
        public.is_institute_admin(institute_id)
        OR (batch_id IS NULL AND public.is_institute_member(institute_id))
        OR (batch_id IS NOT NULL AND (public.is_teacher_of_batch(batch_id) OR public.is_student_in_batch(batch_id)))
    );
CREATE POLICY "study_materials_write" ON public.study_materials FOR ALL TO authenticated
    USING (
        public.is_institute_admin(institute_id)
        OR (batch_id IS NOT NULL AND public.is_teacher_of_batch(batch_id))
    )
    WITH CHECK (
        public.is_institute_admin(institute_id)
        OR (batch_id IS NOT NULL AND public.is_teacher_of_batch(batch_id))
    );

-- 3.17 Assignments
CREATE POLICY "assignments_select" ON public.assignments FOR SELECT TO authenticated
    USING (
        public.is_institute_admin(institute_id)
        OR public.is_teacher_of_batch(batch_id)
        OR public.is_student_in_batch(batch_id)
    );
CREATE POLICY "assignments_write" ON public.assignments FOR ALL TO authenticated
    USING (public.is_institute_admin(institute_id) OR public.is_teacher_of_batch(batch_id))
    WITH CHECK (public.is_institute_admin(institute_id) OR public.is_teacher_of_batch(batch_id));

-- 3.18 Submissions
-- Student inserts and selects own; teacher selects for their batches and updates score/feedback.
CREATE POLICY "submissions_select" ON public.submissions FOR SELECT TO authenticated
    USING (
        public.is_institute_admin(institute_id)
        OR EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = submissions.assignment_id AND public.is_teacher_of_batch(a.batch_id))
        OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = submissions.student_id AND s.user_id = auth.uid())
        OR public.is_parent_of(student_id)
    );
CREATE POLICY "submissions_insert" ON public.submissions FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.students s WHERE s.id = submissions.student_id AND s.user_id = auth.uid())
    );
CREATE POLICY "submissions_update" ON public.submissions FOR UPDATE TO authenticated
    USING (
        public.is_institute_admin(institute_id)
        OR EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = submissions.assignment_id AND public.is_teacher_of_batch(a.batch_id))
        OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = submissions.student_id AND s.user_id = auth.uid())
    )
    WITH CHECK (
        public.is_institute_admin(institute_id)
        OR EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = submissions.assignment_id AND public.is_teacher_of_batch(a.batch_id))
        OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = submissions.student_id AND s.user_id = auth.uid())
    );
CREATE POLICY "submissions_delete" ON public.submissions FOR DELETE TO authenticated
    USING (public.is_institute_admin(institute_id));

-- 3.19 Examinations
CREATE POLICY "examinations_select" ON public.examinations FOR SELECT TO authenticated
    USING (public.is_institute_member(institute_id));
CREATE POLICY "examinations_write" ON public.examinations FOR ALL TO authenticated
    USING (public.is_institute_admin(institute_id) OR public.is_teacher_of_batch(batch_id))
    WITH CHECK (public.is_institute_admin(institute_id) OR public.is_teacher_of_batch(batch_id));

-- 3.20 Results
-- Student reads only own rows; parent reads only linked children; teacher reads/writes only their batches; admin reads all.
CREATE POLICY "results_select" ON public.results FOR SELECT TO authenticated
    USING (
        public.is_institute_admin(institute_id)
        OR EXISTS (SELECT 1 FROM public.examinations e WHERE e.id = results.examination_id AND public.is_teacher_of_batch(e.batch_id))
        OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = results.student_id AND s.user_id = auth.uid())
        OR public.is_parent_of(student_id)
    );
CREATE POLICY "results_write" ON public.results FOR ALL TO authenticated
    USING (
        public.is_institute_admin(institute_id)
        OR EXISTS (SELECT 1 FROM public.examinations e WHERE e.id = results.examination_id AND public.is_teacher_of_batch(e.batch_id))
    )
    WITH CHECK (
        public.is_institute_admin(institute_id)
        OR EXISTS (SELECT 1 FROM public.examinations e WHERE e.id = results.examination_id AND public.is_teacher_of_batch(e.batch_id))
    );

-- 3.21 Chat Rooms
-- Only members of the batch/institute
CREATE POLICY "chat_rooms_select" ON public.chat_rooms FOR SELECT TO authenticated
    USING (
        public.is_institute_admin(institute_id)
        OR teacher_id = auth.uid()
        OR student_id = auth.uid()
        OR (batch_id IS NOT NULL AND (public.is_student_in_batch(batch_id) OR public.is_teacher_of_batch(batch_id)))
    );
CREATE POLICY "chat_rooms_insert" ON public.chat_rooms FOR INSERT TO authenticated
    WITH CHECK (
        public.is_institute_admin(institute_id)
        OR teacher_id = auth.uid()
        OR public.is_institute_member(institute_id)
    );
CREATE POLICY "chat_rooms_update" ON public.chat_rooms FOR UPDATE TO authenticated
    USING (teacher_id = auth.uid() OR public.is_institute_admin(institute_id));

-- 3.22 Chat Messages
CREATE POLICY "chat_messages_select" ON public.chat_messages FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_rooms r
            WHERE r.id = chat_messages.room_id
              AND (
                  r.teacher_id = auth.uid()
                  OR r.student_id = auth.uid()
                  OR public.is_institute_admin(r.institute_id)
                  OR (r.batch_id IS NOT NULL AND (public.is_student_in_batch(r.batch_id) OR public.is_teacher_of_batch(r.batch_id)))
              )
        )
    );
CREATE POLICY "chat_messages_insert" ON public.chat_messages FOR INSERT TO authenticated
    WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.chat_rooms r
            WHERE r.id = chat_messages.room_id
              AND (
                  r.teacher_id = auth.uid()
                  OR r.student_id = auth.uid()
                  OR public.is_institute_admin(r.institute_id)
                  OR (r.batch_id IS NOT NULL AND (public.is_student_in_batch(r.batch_id) OR public.is_teacher_of_batch(r.batch_id)))
              )
        )
    );
CREATE POLICY "chat_messages_update" ON public.chat_messages FOR UPDATE TO authenticated
    USING (
        sender_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.chat_rooms r WHERE r.id = chat_messages.room_id AND r.teacher_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.chat_rooms r WHERE r.id = chat_messages.room_id AND public.is_institute_admin(r.institute_id))
    );

-- 3.23 Community Posts
CREATE POLICY "community_posts_select" ON public.community_posts FOR SELECT TO authenticated
    USING (public.is_institute_member(institute_id));
CREATE POLICY "community_posts_insert" ON public.community_posts FOR INSERT TO authenticated
    WITH CHECK (author_id = auth.uid() AND public.is_institute_member(institute_id));
CREATE POLICY "community_posts_update" ON public.community_posts FOR UPDATE TO authenticated
    USING (author_id = auth.uid() OR public.is_institute_admin(institute_id));
CREATE POLICY "community_posts_delete" ON public.community_posts FOR DELETE TO authenticated
    USING (author_id = auth.uid() OR public.is_institute_admin(institute_id));

-- 3.24 Community Comments
CREATE POLICY "community_comments_select" ON public.community_comments FOR SELECT TO authenticated
    USING (public.is_institute_member(institute_id));
CREATE POLICY "community_comments_insert" ON public.community_comments FOR INSERT TO authenticated
    WITH CHECK (author_id = auth.uid() AND public.is_institute_member(institute_id));
CREATE POLICY "community_comments_update" ON public.community_comments FOR UPDATE TO authenticated
    USING (author_id = auth.uid() OR public.is_institute_admin(institute_id));
CREATE POLICY "community_comments_delete" ON public.community_comments FOR DELETE TO authenticated
    USING (author_id = auth.uid() OR public.is_institute_admin(institute_id));

-- 3.25 Community Upvotes
CREATE POLICY "community_upvotes_select" ON public.community_upvotes FOR SELECT TO authenticated
    USING (true);
CREATE POLICY "community_upvotes_insert" ON public.community_upvotes FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "community_upvotes_delete" ON public.community_upvotes FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- 3.26 Fee Plans
CREATE POLICY "fee_plans_select" ON public.fee_plans FOR SELECT TO authenticated
    USING (public.is_institute_member(institute_id));
CREATE POLICY "fee_plans_admin_manage" ON public.fee_plans FOR ALL TO authenticated
    USING (public.is_institute_admin(institute_id))
    WITH CHECK (public.is_institute_admin(institute_id));

-- 3.27 Student Fees
CREATE POLICY "student_fees_select" ON public.student_fees FOR SELECT TO authenticated
    USING (
        public.is_institute_admin(institute_id)
        OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_fees.student_id AND s.user_id = auth.uid())
        OR public.is_parent_of(student_id)
    );
CREATE POLICY "student_fees_admin_manage" ON public.student_fees FOR ALL TO authenticated
    USING (public.is_institute_admin(institute_id))
    WITH CHECK (public.is_institute_admin(institute_id));

-- 3.28 Payments
CREATE POLICY "payments_select" ON public.payments FOR SELECT TO authenticated
    USING (
        public.is_institute_admin(institute_id)
        OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = payments.student_id AND s.user_id = auth.uid())
        OR public.is_parent_of(student_id)
    );
CREATE POLICY "payments_insert" ON public.payments FOR INSERT TO authenticated
    WITH CHECK (
        public.is_institute_admin(institute_id)
        OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = payments.student_id AND s.user_id = auth.uid())
        OR public.is_parent_of(student_id)
    );
CREATE POLICY "payments_admin_manage" ON public.payments FOR UPDATE TO authenticated
    USING (public.is_institute_admin(institute_id));

-- 3.29 Receipts
CREATE POLICY "receipts_select" ON public.receipts FOR SELECT TO authenticated
    USING (
        public.is_institute_admin(institute_id)
        OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = receipts.student_id AND s.user_id = auth.uid())
        OR public.is_parent_of(student_id)
    );
CREATE POLICY "receipts_admin_manage" ON public.receipts FOR ALL TO authenticated
    USING (public.is_institute_admin(institute_id))
    WITH CHECK (public.is_institute_admin(institute_id));

-- 3.30 Notifications
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR recipient_id = auth.uid()
        OR recipient_role = 'all'
        OR recipient_role = public.auth_role()
    );
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT TO authenticated
    WITH CHECK (
        public.is_institute_admin(institute_id)
        OR public.auth_role() IN ('admin', 'teacher')
    );
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE TO authenticated
    USING (user_id = auth.uid() OR recipient_id = auth.uid());

-- 3.31 Push Tokens
CREATE POLICY "push_tokens_select" ON public.push_tokens FOR SELECT TO authenticated
    USING (user_id = auth.uid());
CREATE POLICY "push_tokens_insert" ON public.push_tokens FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "push_tokens_update" ON public.push_tokens FOR UPDATE TO authenticated
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "push_tokens_delete" ON public.push_tokens FOR DELETE TO authenticated
    USING (user_id = auth.uid());


-- >>>>>>>>>>>>>>>>>>>> MIGRATION 0006_storage.sql >>>>>>>>>>>>>>>>>>>>
-- ==============================================================================
-- CANONICAL MIGRATION: 0006_storage.sql
-- Modules: Storage Buckets (study-materials, student-submissions, avatars)
--          and Storage Object Access Policies.
-- ==============================================================================

-- 1. SETUP STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    (
        'avatars',
        'avatars',
        true,
        5242880, -- 5 MB
        ARRAY['image/png', 'image/jpeg', 'image/webp']
    ),
    (
        'institute-logos',
        'institute-logos',
        true,
        5242880, -- 5 MB
        ARRAY['image/png', 'image/jpeg', 'image/svg+xml']
    ),
    (
        'study-materials',
        'study-materials',
        false,
        104857600, -- 100 MB
        ARRAY['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    ),
    (
        'student-submissions',
        'student-submissions',
        false,
        52428800, -- 50 MB
        ARRAY['application/pdf', 'image/png', 'image/jpeg', 'application/zip']
    ),
    (
        'community-attachments',
        'community-attachments',
        false,
        52428800, -- 50 MB
        ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
    )
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. STORAGE POLICIES (storage.objects)

-- 2.1 Avatars (Public read, authenticated upload/update)
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_user_insert" ON storage.objects;
CREATE POLICY "avatars_user_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_user_update" ON storage.objects;
CREATE POLICY "avatars_user_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND owner = auth.uid())
WITH CHECK (bucket_id = 'avatars' AND owner = auth.uid());

-- 2.2 Study Materials
-- Readable by batch members and staff; writable by teachers and admins
DROP POLICY IF EXISTS "study_materials_read" ON storage.objects;
CREATE POLICY "study_materials_read"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'study-materials'
    AND (
        public.auth_role() IN ('admin', 'teacher')
        OR EXISTS (
            SELECT 1 FROM public.institute_members
            WHERE user_id = auth.uid() AND status = 'active'
        )
    )
);

DROP POLICY IF EXISTS "study_materials_write" ON storage.objects;
CREATE POLICY "study_materials_write"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'study-materials'
    AND public.auth_role() IN ('admin', 'teacher')
);

DROP POLICY IF EXISTS "study_materials_manage" ON storage.objects;
CREATE POLICY "study_materials_manage"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'study-materials'
    AND public.auth_role() IN ('admin', 'teacher')
);

-- 2.3 Student Submissions
-- Writable by student owner; readable by owner and teacher/admin
DROP POLICY IF EXISTS "student_submissions_insert" ON storage.objects;
CREATE POLICY "student_submissions_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'student-submissions'
    AND (auth.uid() IS NOT NULL)
);

DROP POLICY IF EXISTS "student_submissions_read" ON storage.objects;
CREATE POLICY "student_submissions_read"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'student-submissions'
    AND (
        owner = auth.uid()
        OR public.auth_role() IN ('admin', 'teacher')
    )
);

DROP POLICY IF EXISTS "student_submissions_update" ON storage.objects;
CREATE POLICY "student_submissions_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'student-submissions'
    AND (owner = auth.uid() OR public.auth_role() IN ('admin', 'teacher'))
);

-- 2.4 Community & Logo Attachments
DROP POLICY IF EXISTS "community_attachments_read" ON storage.objects;
CREATE POLICY "community_attachments_read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'community-attachments');

DROP POLICY IF EXISTS "community_attachments_insert" ON storage.objects;
CREATE POLICY "community_attachments_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'community-attachments');

DROP POLICY IF EXISTS "institute_logos_read" ON storage.objects;
CREATE POLICY "institute_logos_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'institute-logos');


-- >>>>>>>>>>>>>>>>>>>> MIGRATION 0007_secure_quiz_grading.sql >>>>>>>>>>>>>>>>>>>>
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
-- Evaluates student answers securely against master questions / answer keys without leaking answer keys.
DROP FUNCTION IF EXISTS public.submit_and_grade_quiz(UUID, UUID, JSONB);
CREATE OR REPLACE FUNCTION public.submit_and_grade_quiz(
    p_assignment_id UUID,
    p_student_id UUID,
    p_student_answers JSONB
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
    v_assignment_questions JSONB;
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

    -- 1. Verify caller owns student record or is admin (if authenticated)
    IF v_caller_uid IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = p_student_id AND (s.user_id = v_caller_uid OR public.auth_role() = 'admin')
        ) AND NOT EXISTS (
            SELECT 1 FROM auth.users u WHERE u.id = p_student_id
        ) THEN
            RAISE EXCEPTION 'Unauthorized: Caller is not the enrolled student';
        END IF;
    END IF;

    -- 2. Fetch assignment metadata and master questions
    SELECT institute_id, batch_id, total_marks, questions 
    INTO v_institute_id, v_batch_id, v_total_marks, v_assignment_questions
    FROM public.assignments
    WHERE id = p_assignment_id;

    IF v_institute_id IS NULL THEN
        RAISE EXCEPTION 'Assignment not found';
    END IF;

    -- 3. Fetch master questions from quiz_answer_keys or fallback to assignments.questions
    SELECT answer_keys INTO v_answer_keys
    FROM public.quiz_answer_keys
    WHERE assignment_id = p_assignment_id;

    IF v_answer_keys IS NULL OR jsonb_array_length(v_answer_keys) = 0 THEN
        v_answer_keys := v_assignment_questions;
    END IF;

    -- 4. Evaluate each question against p_student_answers
    v_total_marks := 0;
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_answer_keys)
    LOOP
        v_question_id := v_item ->> 'id';
        v_type := COALESCE(v_item ->> 'type', 'mcq');
        v_marks := COALESCE((v_item ->> 'marks')::numeric, 1.0);
        v_total_marks := v_total_marks + v_marks;
        v_student_ans := p_student_answers ->> v_question_id;
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

        -- Build detailed question review and explanations
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
        p_student_answers,
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

    -- 7. Return complete evaluated result payload with score and explanations
    RETURN jsonb_build_object(
        'submissionId', v_submission_id,
        'submission_id', v_submission_id,
        'score', v_score,
        'totalScore', v_score,
        'totalMarks', v_total_marks,
        'total_marks', v_total_marks,
        'percentage', v_percentage,
        'isPassed', v_is_passed,
        'is_passed', v_is_passed,
        'status', 'graded',
        'questions', v_detailed_results,
        'details', v_detailed_results,
        'explanations', v_detailed_results
    );
END;
$$;


-- >>>>>>>>>>>>>>>>>>>> MIGRATION 0008_fix_rls_recursion_and_scoping.sql >>>>>>>>>>>>>>>>>>>>
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


-- >>>>>>>>>>>>>>>>>>>> MIGRATION 0009_security_hardening_round1.sql >>>>>>>>>>>>>>>>>>>>
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


-- >>>>>>>>>>>>>>>>>>>> MIGRATION 0010_batch_schedule_and_results.sql >>>>>>>>>>>>>>>>>>>>
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


-- >>>>>>>>>>>>>>>>>>>> MIGRATION 0011_app_flows_and_state_machines.sql >>>>>>>>>>>>>>>>>>>>
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


-- >>>>>>>>>>>>>>>>>>>> MIGRATION 0012_ai_grading_and_quiz_generation.sql >>>>>>>>>>>>>>>>>>>>
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


-- >>>>>>>>>>>>>>>>>>>> MIGRATION HISTORY >>>>>>>>>>>>>>>>>>>>
CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (version text NOT NULL PRIMARY KEY, statements text[], name text);
INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('0001', 'core') ON CONFLICT (version) DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('0002', 'academic') ON CONFLICT (version) DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('0003', 'community_chat') ON CONFLICT (version) DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('0004', 'fees') ON CONFLICT (version) DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('0005', 'rls') ON CONFLICT (version) DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('0006', 'storage') ON CONFLICT (version) DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('0007', 'secure_quiz_grading') ON CONFLICT (version) DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('0008', 'fix_rls_recursion_and_scoping') ON CONFLICT (version) DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('0009', 'security_hardening_round1') ON CONFLICT (version) DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('0010', 'batch_schedule_and_results') ON CONFLICT (version) DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('0011', 'app_flows_and_state_machines') ON CONFLICT (version) DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('0012', 'ai_grading_and_quiz_generation') ON CONFLICT (version) DO NOTHING;

-- >>>>>>>>>>>>>>>>>>>> SEED DATA (dummy accounts) >>>>>>>>>>>>>>>>>>>>
-- ==============================================================================
-- ACADLY LOCAL DEVELOPMENT & TESTING SEED DATA (DEV-ONLY)
-- WARNING: THIS FILE IS STRICTLY FOR LOCAL DEV / INTEGRATION TESTING.
-- NEVER RUN THIS FILE IN A PRODUCTION DATABASE ENVIRONMENT!
-- ==============================================================================

-- Guard check: Abort if explicitly flagged as production
DO $$
BEGIN
    IF current_setting('app.environment', true) = 'production' THEN
        RAISE EXCEPTION 'CANNOT RUN DEV SEED DATA IN PRODUCTION ENVIRONMENT!';
    END IF;
END $$;

-- Define deterministic UUIDs for relational consistency
DO $$
DECLARE
    -- Institute
    v_inst_id UUID := '11111111-1111-1111-1111-111111111111';
    
    -- Users (auth.users and profiles)
    v_admin_id UUID   := '00000000-0000-0000-0000-000000000001';
    v_teach_1_id UUID := '00000000-0000-0000-0000-000000000002';
    v_teach_2_id UUID := '00000000-0000-0000-0000-000000000003';
    v_stud_1_id UUID  := '00000000-0000-0000-0000-000000000004';
    v_stud_2_id UUID  := '00000000-0000-0000-0000-000000000005';
    v_stud_3_id UUID  := '00000000-0000-0000-0000-000000000006';
    v_stud_4_id UUID  := '00000000-0000-0000-0000-000000000007';
    v_stud_5_id UUID  := '00000000-0000-0000-0000-000000000008';
    v_stud_6_id UUID  := '00000000-0000-0000-0000-000000000009';
    v_parent_1_id UUID := '00000000-0000-0000-0000-000000000010';
    v_parent_2_id UUID := '00000000-0000-0000-0000-000000000011';

    -- Sub-entities
    v_teacher_rec_1 UUID := '22222222-2222-2222-2222-222222222201';
    v_teacher_rec_2 UUID := '22222222-2222-2222-2222-222222222202';
    
    v_student_rec_1 UUID := '33333333-3333-3333-3333-333333333301';
    v_student_rec_2 UUID := '33333333-3333-3333-3333-333333333302';
    v_student_rec_3 UUID := '33333333-3333-3333-3333-333333333303';
    v_student_rec_4 UUID := '33333333-3333-3333-3333-333333333304';
    v_student_rec_5 UUID := '33333333-3333-3333-3333-333333333305';
    v_student_rec_6 UUID := '33333333-3333-3333-3333-333333333306';

    v_parent_rec_1 UUID := '44444444-4444-4444-4444-444444444401';
    v_parent_rec_2 UUID := '44444444-4444-4444-4444-444444444402';

    v_subject_1_id UUID := '55555555-5555-5555-5555-555555555511';
    v_subject_2_id UUID := '55555555-5555-5555-5555-555555555512';

    v_batch_1_id UUID := '55555555-5555-5555-5555-555555555501';
    v_batch_2_id UUID := '55555555-5555-5555-5555-555555555502';

    v_fee_plan_id UUID := '66666666-6666-6666-6666-666666666601';
    v_fee_record_1 UUID := '66666666-6666-6666-6666-666666666602';
    v_payment_1 UUID := '77777777-7777-7777-7777-777777777701';

    v_room_batch_id UUID := '88888888-8888-8888-8888-888888888801';
    v_room_doubt_id UUID := '88888888-8888-8888-8888-888888888802';

    v_assignment_id UUID := '99999999-9999-9999-9999-999999999901';
    v_post_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

    -- Password hash for: DevPass@2026!
    v_password_hash TEXT := crypt('DevPass@2026!', gen_salt('bf'));
BEGIN
    -- --------------------------------------------------------------------------
    -- 1. Create Institute
    -- --------------------------------------------------------------------------
    INSERT INTO public.institutes (id, name, code, center_code, city, campus_name, invite_code)
    VALUES (
        v_inst_id,
        'Apex IIT-JEE & Medical Academy',
        'APEX-KOTA',
        'APX-9021',
        'Kota',
        'Vigyan Nagar Campus',
        'APEX2026'
    ) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

    -- --------------------------------------------------------------------------
    -- 2. Create Users in auth.users and auth.identities
    -- --------------------------------------------------------------------------
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, phone_change, phone_change_token, email_change_token_current, reauthentication_token)
    VALUES
        (v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin.dev@acadly.com', v_password_hash, NOW(), json_build_object('provider','email','providers',json_build_array('email'),'role','admin','institute_id',v_inst_id), '{"full_name":"Director Rajesh Gupta","role":"admin"}', NOW(), NOW(), '', '', '', '', '', '', '', ''),
        (v_teach_1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teacher.joshi@acadly.com', v_password_hash, NOW(), json_build_object('provider','email','providers',json_build_array('email'),'role','teacher','institute_id',v_inst_id), '{"full_name":"Prof. Vikram Joshi","role":"teacher"}', NOW(), NOW(), '', '', '', '', '', '', '', ''),
        (v_teach_2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teacher.sen@acadly.com', v_password_hash, NOW(), json_build_object('provider','email','providers',json_build_array('email'),'role','teacher','institute_id',v_inst_id), '{"full_name":"Dr. Meera Sen","role":"teacher"}', NOW(), NOW(), '', '', '', '', '', '', '', ''),
        (v_stud_1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student.amelia@acadly.com', v_password_hash, NOW(), json_build_object('provider','email','providers',json_build_array('email'),'role','student','institute_id',v_inst_id), '{"full_name":"Amelia Sharma","role":"student"}', NOW(), NOW(), '', '', '', '', '', '', '', ''),
        (v_stud_2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student.kabir@acadly.com', v_password_hash, NOW(), json_build_object('provider','email','providers',json_build_array('email'),'role','student','institute_id',v_inst_id), '{"full_name":"Kabir Singhania","role":"student"}', NOW(), NOW(), '', '', '', '', '', '', '', ''),
        (v_stud_3_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student.zoya@acadly.com', v_password_hash, NOW(), json_build_object('provider','email','providers',json_build_array('email'),'role','student','institute_id',v_inst_id), '{"full_name":"Zoya Khan","role":"student"}', NOW(), NOW(), '', '', '', '', '', '', '', ''),
        (v_stud_4_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student.rohan@acadly.com', v_password_hash, NOW(), json_build_object('provider','email','providers',json_build_array('email'),'role','student','institute_id',v_inst_id), '{"full_name":"Rohan Verma","role":"student"}', NOW(), NOW(), '', '', '', '', '', '', '', ''),
        (v_stud_5_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student.aarav@acadly.com', v_password_hash, NOW(), json_build_object('provider','email','providers',json_build_array('email'),'role','student','institute_id',v_inst_id), '{"full_name":"Aarav Sharma","role":"student"}', NOW(), NOW(), '', '', '', '', '', '', '', ''),
        (v_stud_6_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student.ananya@acadly.com', v_password_hash, NOW(), json_build_object('provider','email','providers',json_build_array('email'),'role','student','institute_id',v_inst_id), '{"full_name":"Ananya Patel","role":"student"}', NOW(), NOW(), '', '', '', '', '', '', '', ''),
        (v_parent_1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'parent.sharma@acadly.com', v_password_hash, NOW(), json_build_object('provider','email','providers',json_build_array('email'),'role','parent','institute_id',v_inst_id), '{"full_name":"Rajesh Sharma","role":"parent"}', NOW(), NOW(), '', '', '', '', '', '', '', ''),
        (v_parent_2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'parent.singhania@acadly.com', v_password_hash, NOW(), json_build_object('provider','email','providers',json_build_array('email'),'role','parent','institute_id',v_inst_id), '{"full_name":"Sanjay Singhania","role":"parent"}', NOW(), NOW(), '', '', '', '', '', '', '', '')
    ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password, confirmation_token = EXCLUDED.confirmation_token, recovery_token = EXCLUDED.recovery_token, email_change_token_new = EXCLUDED.email_change_token_new, email_change = EXCLUDED.email_change;

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES
        (v_admin_id, v_admin_id, json_build_object('sub', v_admin_id, 'email', 'admin.dev@acadly.com'), 'email', v_admin_id::text, NOW(), NOW(), NOW()),
        (v_teach_1_id, v_teach_1_id, json_build_object('sub', v_teach_1_id, 'email', 'teacher.joshi@acadly.com'), 'email', v_teach_1_id::text, NOW(), NOW(), NOW()),
        (v_teach_2_id, v_teach_2_id, json_build_object('sub', v_teach_2_id, 'email', 'teacher.sen@acadly.com'), 'email', v_teach_2_id::text, NOW(), NOW(), NOW()),
        (v_stud_1_id, v_stud_1_id, json_build_object('sub', v_stud_1_id, 'email', 'student.amelia@acadly.com'), 'email', v_stud_1_id::text, NOW(), NOW(), NOW()),
        (v_stud_2_id, v_stud_2_id, json_build_object('sub', v_stud_2_id, 'email', 'student.kabir@acadly.com'), 'email', v_stud_2_id::text, NOW(), NOW(), NOW()),
        (v_stud_3_id, v_stud_3_id, json_build_object('sub', v_stud_3_id, 'email', 'student.zoya@acadly.com'), 'email', v_stud_3_id::text, NOW(), NOW(), NOW()),
        (v_stud_4_id, v_stud_4_id, json_build_object('sub', v_stud_4_id, 'email', 'student.rohan@acadly.com'), 'email', v_stud_4_id::text, NOW(), NOW(), NOW()),
        (v_stud_5_id, v_stud_5_id, json_build_object('sub', v_stud_5_id, 'email', 'student.aarav@acadly.com'), 'email', v_stud_5_id::text, NOW(), NOW(), NOW()),
        (v_stud_6_id, v_stud_6_id, json_build_object('sub', v_stud_6_id, 'email', 'student.ananya@acadly.com'), 'email', v_stud_6_id::text, NOW(), NOW(), NOW()),
        (v_parent_1_id, v_parent_1_id, json_build_object('sub', v_parent_1_id, 'email', 'parent.sharma@acadly.com'), 'email', v_parent_1_id::text, NOW(), NOW(), NOW()),
        (v_parent_2_id, v_parent_2_id, json_build_object('sub', v_parent_2_id, 'email', 'parent.singhania@acadly.com'), 'email', v_parent_2_id::text, NOW(), NOW(), NOW())
    ON CONFLICT (provider, provider_id) DO NOTHING;

    -- --------------------------------------------------------------------------
    -- 3. Profiles
    -- --------------------------------------------------------------------------
    INSERT INTO public.profiles (id, email, full_name, phone, default_role)
    VALUES
        (v_admin_id, 'admin.dev@acadly.com', 'Director Rajesh Gupta', '+91 98290 11001', 'admin'),
        (v_teach_1_id, 'teacher.joshi@acadly.com', 'Prof. Vikram Joshi', '+91 98290 22002', 'teacher'),
        (v_teach_2_id, 'teacher.sen@acadly.com', 'Dr. Meera Sen', '+91 98290 22003', 'teacher'),
        (v_stud_1_id, 'student.amelia@acadly.com', 'Amelia Sharma', '+91 98230 44551', 'student'),
        (v_stud_2_id, 'student.kabir@acadly.com', 'Kabir Singhania', '+91 98110 33442', 'student'),
        (v_stud_3_id, 'student.zoya@acadly.com', 'Zoya Khan', '+91 98900 22119', 'student'),
        (v_stud_4_id, 'student.rohan@acadly.com', 'Rohan Verma', '+91 98450 77112', 'student'),
        (v_stud_5_id, 'student.aarav@acadly.com', 'Aarav Sharma', '+91 98230 44552', 'student'),
        (v_stud_6_id, 'student.ananya@acadly.com', 'Ananya Patel', '+91 98770 99221', 'student'),
        (v_parent_1_id, 'parent.sharma@acadly.com', 'Rajesh Sharma', '+91 98230 44550', 'parent'),
        (v_parent_2_id, 'parent.singhania@acadly.com', 'Sanjay Singhania', '+91 98110 33440', 'parent')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

    -- --------------------------------------------------------------------------
    -- 4. Institute Members
    -- --------------------------------------------------------------------------
    INSERT INTO public.institute_members (institute_id, user_id, role, status)
    VALUES
        (v_inst_id, v_admin_id, 'admin', 'active'),
        (v_inst_id, v_teach_1_id, 'teacher', 'active'),
        (v_inst_id, v_teach_2_id, 'teacher', 'active'),
        (v_inst_id, v_stud_1_id, 'student', 'active'),
        (v_inst_id, v_stud_2_id, 'student', 'active'),
        (v_inst_id, v_stud_3_id, 'student', 'active'),
        (v_inst_id, v_stud_4_id, 'student', 'active'),
        (v_inst_id, v_stud_5_id, 'student', 'active'),
        (v_inst_id, v_stud_6_id, 'student', 'active'),
        (v_inst_id, v_parent_1_id, 'parent', 'active'),
        (v_inst_id, v_parent_2_id, 'parent', 'active')
    ON CONFLICT (institute_id, user_id, role) DO NOTHING;

    -- --------------------------------------------------------------------------
    -- 5. Role Entities (Teachers, Students, Parents, Parent-Students)
    -- --------------------------------------------------------------------------
    INSERT INTO public.teachers (id, institute_id, user_id, teacher_code, mode, qualification, specialization, specialization_subjects, experience_years, monthly_fee_rate, bio)
    VALUES
        (v_teacher_rec_1, v_inst_id, v_teach_1_id, 'JOSHI-MATH-89', 'solo', 'M.Sc Physics (IIT Bombay)', 'Mechanics', ARRAY['Physics', 'Mathematics', 'Calculus'], 12.0, 3500.00, 'Passionate about conceptual mechanics and Olympiad derivations.'),
        (v_teacher_rec_2, v_inst_id, v_teach_2_id, 'SEN-CHEM-26', 'coaching_faculty', 'Ph.D Organic Chemistry (IISc Bangalore)', 'Organic Chemistry', ARRAY['Organic Chemistry', 'Physical Chemistry'], 9.5, 3200.00, 'Specializing in reaction mechanisms and NEET high-yield prep.')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.students (id, institute_id, user_id, roll_number, admission_number, parent_link_code, class_grade, grade, target_exam, school_name, previous_percentage, guardian_name, guardian_phone, weak_topics)
    VALUES
        (v_student_rec_1, v_inst_id, v_stud_1_id, 'ROL-101', 'ADM-2026-088', 'STU-AMELIA-902', 'Class 12', 'Class 12', 'IIT-JEE Advanced 2026', 'Delhi Public School (R.K. Puram)', '96.4%', 'Rajesh Sharma', '+91 98230 44550', ARRAY['Rotational Dynamics', 'Wave Optics']),
        (v_student_rec_2, v_inst_id, v_stud_2_id, 'ROL-102', 'ADM-2026-089', 'STU-KABIR-118', 'Class 12', 'Class 12', 'IIT-JEE Advanced 2026', 'Modern School (Barakhamba)', '94.8%', 'Sanjay Singhania', '+91 98110 33440', ARRAY['Thermodynamics', 'Coordinate Geometry']),
        (v_student_rec_3, v_inst_id, v_stud_3_id, 'ROL-103', 'ADM-2026-090', 'STU-ZOYA-204', 'Class 12', 'Class 12', 'NEET UG 2026', 'St. Xavier High School', '95.2%', 'Farooq Khan', '+91 98900 22119', ARRAY['Electromagnetism']),
        (v_student_rec_4, v_inst_id, v_stud_4_id, 'ROL-104', 'ADM-2026-091', 'STU-ROHAN-305', 'Class 12', 'Class 12', 'IIT-JEE 2026', 'Sanskriti School', '92.6%', 'Anil Verma', '+91 98450 77112', ARRAY['Ionic Equilibrium']),
        (v_student_rec_5, v_inst_id, v_stud_5_id, 'ROL-105', 'ADM-2026-092', 'STU-AARAV-104', 'Class 11', 'Class 11', 'IIT-JEE Foundation', 'Delhi Public School', '97.0%', 'Rajesh Sharma', '+91 98230 44550', ARRAY['Calculus & Limits']),
        (v_student_rec_6, v_inst_id, v_stud_6_id, 'ROL-106', 'ADM-2026-093', 'STU-ANANYA-501', 'Class 11', 'Class 11', 'NEET UG Foundation', 'National Public School', '93.5%', 'Deepak Patel', '+91 98770 99221', ARRAY['Plant Physiology'])
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.parents (id, institute_id, user_id, phone, occupation)
    VALUES
        (v_parent_rec_1, v_inst_id, v_parent_1_id, '+91 98230 44550', 'Architect'),
        (v_parent_rec_2, v_inst_id, v_parent_2_id, '+91 98110 33440', 'Chartered Accountant')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.parent_students (institute_id, parent_id, student_id, relationship)
    VALUES
        (v_inst_id, v_parent_rec_1, v_student_rec_1, 'Daughter'), -- Rajesh -> Amelia
        (v_inst_id, v_parent_rec_1, v_student_rec_5, 'Son'),      -- Rajesh -> Aarav
        (v_inst_id, v_parent_rec_2, v_student_rec_2, 'Son')       -- Sanjay -> Kabir
    ON CONFLICT (parent_id, student_id) DO NOTHING;

    -- --------------------------------------------------------------------------
    -- 6. Subjects, Batches & Enrollments
    -- --------------------------------------------------------------------------
    INSERT INTO public.subjects (id, institute_id, name, code, color_hex)
    VALUES
        (v_subject_1_id, v_inst_id, 'Physics & Mathematics', 'PHY-MATH', '#ff7d6b'),
        (v_subject_2_id, v_inst_id, 'Chemistry & Biology', 'CHEM-BIO', '#38bdf8')
    ON CONFLICT (institute_id, code) DO NOTHING;

    INSERT INTO public.batches (id, institute_id, name, subject, subject_id, teacher_id, target_exam, room_number, start_time, end_time, status)
    VALUES
        (v_batch_1_id, v_inst_id, 'Class 12 • JEE Advanced (Morning)', 'Physics & Calculus', v_subject_1_id, v_teacher_rec_1, 'JEE Advanced', 'Hall A (Senior Wing)', '07:30 AM', '10:00 AM', 'in_progress'),
        (v_batch_2_id, v_inst_id, 'Class 11 • Physics & Calculus Mastery', 'Mechanics & Chemistry', v_subject_2_id, v_teacher_rec_2, 'Foundation', 'Einstein Hall 204', '04:30 PM', '07:00 PM', 'in_progress')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.batch_teachers (institute_id, batch_id, teacher_id, subject_id)
    VALUES
        (v_inst_id, v_batch_1_id, v_teacher_rec_1, v_subject_1_id),
        (v_inst_id, v_batch_2_id, v_teacher_rec_2, v_subject_2_id)
    ON CONFLICT (batch_id, teacher_id) DO NOTHING;

    INSERT INTO public.batch_students (institute_id, batch_id, student_id, status)
    VALUES
        (v_inst_id, v_batch_1_id, v_student_rec_1, 'enrolled'),
        (v_inst_id, v_batch_1_id, v_student_rec_2, 'enrolled'),
        (v_inst_id, v_batch_1_id, v_student_rec_3, 'enrolled'),
        (v_inst_id, v_batch_1_id, v_student_rec_4, 'enrolled'),
        (v_inst_id, v_batch_2_id, v_student_rec_5, 'enrolled'),
        (v_inst_id, v_batch_2_id, v_student_rec_6, 'enrolled')
    ON CONFLICT (batch_id, student_id) DO NOTHING;

    -- --------------------------------------------------------------------------
    -- 7. Attendance
    -- --------------------------------------------------------------------------
    INSERT INTO public.attendance (institute_id, batch_id, student_id, date, status, marked_by)
    VALUES
        (v_inst_id, v_batch_1_id, v_student_rec_1, CURRENT_DATE, 'P', v_teach_1_id),
        (v_inst_id, v_batch_1_id, v_student_rec_2, CURRENT_DATE, 'A', v_teach_1_id),
        (v_inst_id, v_batch_1_id, v_student_rec_3, CURRENT_DATE, 'P', v_teach_1_id),
        (v_inst_id, v_batch_1_id, v_student_rec_4, CURRENT_DATE, 'P', v_teach_1_id),
        (v_inst_id, v_batch_2_id, v_student_rec_5, CURRENT_DATE, 'P', v_teach_2_id),
        (v_inst_id, v_batch_2_id, v_student_rec_6, CURRENT_DATE, 'P', v_teach_2_id)
    ON CONFLICT (batch_id, student_id, date) DO NOTHING;

    -- --------------------------------------------------------------------------
    -- 8. Assignments & Submissions
    -- --------------------------------------------------------------------------
    INSERT INTO public.assignments (id, institute_id, batch_id, teacher_id, title, subject, instructions, description, type, questions, due_date, max_marks, total_marks)
    VALUES (
        v_assignment_id,
        v_inst_id,
        v_batch_1_id,
        v_teacher_rec_1,
        'Rotational Dynamics & Torque DPP #14',
        'Physics',
        'Solve problems 1-15 on rigid body planar motion and center of mass torque derivations.',
        'Comprehensive physics practice on rotation.',
        'file',
        '[{"id":"q1","prompt":"Derive moment of inertia of a solid cylinder","marks":5}]'::jsonb,
        NOW() + INTERVAL '2 days',
        25.00,
        25.00
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.submissions (institute_id, assignment_id, student_id, status, marks_obtained, score, feedback, submitted_at, graded_at)
    VALUES
        (v_inst_id, v_assignment_id, v_student_rec_1, 'graded', 24.00, 24.00, 'Flawless step-by-step vector derivation on problem 4.', NOW() - INTERVAL '1 day', NOW()),
        (v_inst_id, v_assignment_id, v_student_rec_2, 'submitted', NULL, NULL, NULL, NOW() - INTERVAL '2 hours', NULL)
    ON CONFLICT (assignment_id, student_id) DO NOTHING;

    -- --------------------------------------------------------------------------
    -- 9. Fees, Payments & GST Receipts
    -- --------------------------------------------------------------------------
    INSERT INTO public.fee_plans (id, institute_id, name, amount, total_amount, frequency, description)
    VALUES (
        v_fee_plan_id,
        v_inst_id,
        'Class 12 JEE Advanced Dropper Program',
        125000.00,
        125000.00,
        'annual',
        'Full year comprehensive tuition, test series, mentorship, and library access.'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.student_fees (id, institute_id, student_id, fee_plan_id, title, total_amount, paid_amount, pending_amount, discount_amount, net_payable, status, due_date)
    VALUES (
        v_fee_record_1,
        v_inst_id,
        v_student_rec_1,
        v_fee_plan_id,
        'Term 2 Tuition & Lab Fee',
        47200.00,
        47200.00,
        0.00,
        0.00,
        47200.00,
        'paid',
        CURRENT_DATE + 12
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.payments (id, institute_id, student_fee_id, student_id, amount, payment_mode, payment_method, gst_amount, razorpay_order_id, razorpay_payment_id, receipt_number, status, notes)
    VALUES (
        v_payment_1,
        v_inst_id,
        v_fee_record_1,
        v_student_rec_1,
        47200.00,
        'razorpay',
        'razorpay',
        7200.00,
        'order_N8s9vQ2kL1',
        'pay_M9k2P1x8Q0',
        'APX-REC-2026-9021',
        'paid',
        'Full payment for Term 2'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.receipts (institute_id, payment_id, receipt_number, student_id, taxable_amount, gst_rate, gst_amount, total_amount, signed_hash)
    VALUES (
        v_inst_id,
        v_payment_1,
        'APX-REC-2026-9021',
        v_student_rec_1,
        40000.00,
        18.00,
        7200.00,
        47200.00,
        'sha256:d8a2f4c01e6b8a2e5d9f0a2e4b7c9f1e8a2b5d4c3e2f1a0b9c8d7e6f5a4b3c2'
    ) ON CONFLICT (payment_id) DO NOTHING;

    -- --------------------------------------------------------------------------
    -- 10. Chat Rooms & Messages
    -- --------------------------------------------------------------------------
    INSERT INTO public.chat_rooms (id, institute_id, batch_id, type, teacher_id, name)
    VALUES (
        v_room_batch_id,
        v_inst_id,
        v_batch_1_id,
        'batch_group',
        v_teach_1_id,
        'Class 12 • JEE Advanced (Morning)'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.chat_rooms (id, institute_id, batch_id, type, teacher_id, student_id, name)
    VALUES (
        v_room_doubt_id,
        v_inst_id,
        v_batch_1_id,
        'direct_doubt',
        v_teach_1_id,
        v_stud_2_id,
        'Doubt Room: Kabir Singhania'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.chat_messages (room_id, sender_id, sender_role, message_text, is_pinned, created_at)
    VALUES
        (v_room_batch_id, v_teach_1_id, 'teacher', 'Class starts tomorrow morning at 07:30 AM sharp. Please review DPP #14 solutions beforehand.', TRUE, NOW() - INTERVAL '3 hours'),
        (v_room_batch_id, v_stud_1_id, 'student', 'Sir, in question 3 of the formula sheet, should we use moment of inertia about the center of mass or the hinge point?', FALSE, NOW() - INTERVAL '1 hour'),
        (v_room_batch_id, v_teach_1_id, 'teacher', 'Always use parallel axis theorem if the rotation axis is displaced from the COM.', FALSE, NOW() - INTERVAL '45 mins'),
        (v_room_doubt_id, v_stud_2_id, 'student', 'Prof. Joshi, can you help me understand step 2 in the angular momentum conservation problem?', FALSE, NOW() - INTERVAL '30 mins'),
        (v_room_doubt_id, v_teach_1_id, 'teacher', 'Since external torque about the fixed point is zero, total angular momentum L = I*omega remains strictly constant.', FALSE, NOW() - INTERVAL '15 mins');

    -- --------------------------------------------------------------------------
    -- 11. Community Discussions
    -- --------------------------------------------------------------------------
    INSERT INTO public.community_posts (id, institute_id, author_id, title, content, upvotes_count)
    VALUES (
        v_post_id,
        v_inst_id,
        v_stud_1_id,
        'Why is electric field inside a hollow spherical conductor strictly zero?',
        'In Gauss law we take a Gaussian sphere inside radius R. Since enclosed charge q=0, flux is 0. But how does charge on the outer shell cancel out the field at EVERY non-central point?',
        18
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.community_comments (institute_id, post_id, author_id, comment_text, is_teacher_verified_answer)
    VALUES (
        v_inst_id,
        v_post_id,
        v_teach_1_id,
        'By inverse-square law, a larger patch of surface charge further away subtends the exact same solid angle as a smaller, closer patch. Their electric fields cancel vectorially everywhere inside.',
        TRUE
    );

    -- --------------------------------------------------------------------------
    -- 12. Study Materials & Video Lectures
    -- --------------------------------------------------------------------------
    INSERT INTO public.study_materials (institute_id, batch_id, uploaded_by, title, subject, category, file_url, file_size_bytes)
    VALUES (
        v_inst_id,
        v_batch_1_id,
        v_teach_1_id,
        'Rotational Dynamics & Inertia Mastery Sheet',
        'Physics',
        'formula_sheet',
        'https://cwxuwaljqrqdogsyqhwc.supabase.co/storage/v1/object/public/study_materials/rotational_dynamics_mastery.pdf',
        2450000
    );

    INSERT INTO public.lectures (institute_id, batch_id, uploaded_by, faculty_name, title, subject, provider, video_id_or_url, duration_minutes)
    VALUES (
        v_inst_id,
        v_batch_1_id,
        v_teach_1_id,
        'Prof. Vikram Joshi',
        'Advanced Mechanics: Angular Momentum & Gyroscopic Precession',
        'Physics',
        'youtube',
        'dQw4w9WgXcQ',
        75
    );

    -- --------------------------------------------------------------------------
    -- 13. Notifications
    -- --------------------------------------------------------------------------
    INSERT INTO public.notifications (institute_id, user_id, recipient_id, recipient_role, title, message, body, type)
    VALUES
        (v_inst_id, v_stud_1_id, v_stud_1_id, 'student', 'Homework Graded', 'Prof. Vikram Joshi scored your DPP #14: 24/25 with feedback.', 'Prof. Vikram Joshi scored your DPP #14: 24/25 with feedback.', 'assignment'),
        (v_inst_id, v_parent_1_id, v_parent_1_id, 'parent', 'Attendance Check-in', 'Amelia Sharma checked in for Class 12 JEE Advanced at 07:28 AM.', 'Amelia Sharma checked in for Class 12 JEE Advanced at 07:28 AM.', 'attendance'),
        (v_inst_id, v_parent_1_id, v_parent_1_id, 'parent', 'Fee Receipt Generated', 'Official GST invoice APX-REC-2026-9021 available for download.', 'Official GST invoice APX-REC-2026-9021 available for download.', 'fee');

    -- --------------------------------------------------------------------------
    -- 14. Batch Schedule
    -- --------------------------------------------------------------------------
    INSERT INTO public.batch_schedule (
        id, institute_id, batch_id, weekday, start_time, end_time, subject_id, subject_name, teacher_id, teacher_name, room, tag, is_live
    ) VALUES
        ('77777777-7777-7777-7777-777777777701', v_inst_id, v_batch_1_id, 'Mon', '16:30', '18:00', v_subject_1_id, 'Physics', v_teacher_rec_1, 'Prof. Vikram Joshi', 'Lecture Hall A', 'Live Stream', true),
        ('77777777-7777-7777-7777-777777777702', v_inst_id, v_batch_1_id, 'Tue', '10:30', '12:00', v_subject_1_id, 'Physics Lab', v_teacher_rec_1, 'Prof. Vikram Joshi', 'B2, Room 158', 'Lab Session', false),
        ('77777777-7777-7777-7777-777777777703', v_inst_id, v_batch_1_id, 'Wed', '16:30', '18:00', v_subject_2_id, 'Mathematics', v_teacher_rec_1, 'Dr. Ramanujan', 'Room 204', 'Live Stream', true),
        ('77777777-7777-7777-7777-777777777704', v_inst_id, v_batch_1_id, 'Thu', '11:00', '12:30', v_subject_1_id, 'Chemistry', v_teacher_rec_1, 'Dr. Sen', 'Chem Lab 1', 'Classroom', false),
        ('77777777-7777-7777-7777-777777777705', v_inst_id, v_batch_1_id, 'Fri', '16:30', '18:00', v_subject_1_id, 'Physics', v_teacher_rec_1, 'Prof. Vikram Joshi', 'Main Auditorium', 'Live Stream', true),
        ('77777777-7777-7777-7777-777777777706', v_inst_id, v_batch_1_id, 'Sat', '09:00', '12:00', v_subject_2_id, 'All Subjects Test', v_teacher_rec_1, 'Exam Controller', 'Examination Centre', 'Proctored Test', false),
        ('77777777-7777-7777-7777-777777777707', v_inst_id, v_batch_1_id, 'Sun', '11:00', '13:00', v_subject_1_id, 'Mentorship', v_teacher_rec_1, 'Senior Faculty Panel', 'Seminar Room 3', 'Doubt Clinic', false)
    ON CONFLICT (id) DO NOTHING;

    -- --------------------------------------------------------------------------
    -- 15. Examinations & Results
    -- --------------------------------------------------------------------------
    INSERT INTO public.examinations (
        id, institute_id, batch_id, subject_id, title, exam_date, max_marks, passing_marks, batch_average_marks, batch_highest_marks, syllabus, is_published
    ) VALUES
        ('88888888-8888-8888-8888-888888888801', v_inst_id, v_batch_1_id, v_subject_1_id, 'Term 1 Physics & Calculus Comprehensive', CURRENT_DATE - INTERVAL '5 days', 100.00, 40.00, 78.50, 96.00, 'Newtonian Mechanics, Thermodynamics, Integration', true),
        ('88888888-8888-8888-8888-888888888802', v_inst_id, v_batch_1_id, v_subject_1_id, 'Rotational Mechanics Unit Test', CURRENT_DATE - INTERVAL '14 days', 50.00, 20.00, 41.20, 48.00, 'Moment of Inertia, Angular Momentum', true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.results (
        id, institute_id, examination_id, student_id, marks_obtained, percentage, batch_rank, grade, is_absent, remarks, recorded_by
    ) VALUES
        ('99999999-9999-9999-9999-888888888801', v_inst_id, '88888888-8888-8888-8888-888888888801', v_student_rec_1, 92.50, 92.50, 1, 'A+', false, 'Outstanding conceptual clarity in rotational dynamics.', v_teach_1_id),
        ('99999999-9999-9999-9999-888888888802', v_inst_id, '88888888-8888-8888-8888-888888888801', v_student_rec_2, 74.00, 74.00, 3, 'B+', false, 'Good effort, revise calculus integration techniques.', v_teach_1_id),
        ('99999999-9999-9999-9999-888888888803', v_inst_id, '88888888-8888-8888-8888-888888888802', v_student_rec_1, 46.00, 92.00, 1, 'A+', false, 'Excellent angular momentum problem-solving.', v_teach_1_id)
    ON CONFLICT (id) DO NOTHING;

END $$;


COMMIT;
