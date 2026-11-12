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
