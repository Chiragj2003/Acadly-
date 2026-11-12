-- ==============================================================================
-- ACADLY - PHASE 2 DATABASE SCHEMA & MULTI-TENANT ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Institutes Table
CREATE TABLE IF NOT EXISTS public.institutes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    center_code VARCHAR(20) UNIQUE NOT NULL,
    city VARCHAR(100) NOT NULL,
    campus_name VARCHAR(100) DEFAULT 'Main Campus',
    logo_url TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for instant lookup by join code
CREATE INDEX IF NOT EXISTS idx_institutes_center_code ON public.institutes(center_code);

-- 3. Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    default_role VARCHAR(20) DEFAULT 'student' CHECK (default_role IN ('admin', 'teacher', 'student', 'parent')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Institute Members Table (Tenant Membership & Role Mapping)
CREATE TABLE IF NOT EXISTS public.institute_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'parent')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_members_user ON public.institute_members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_institute ON public.institute_members(institute_id);

-- 5. Teachers Table
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    employee_code VARCHAR(50),
    qualification VARCHAR(100),
    specialization VARCHAR(100),
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, user_id)
);

-- 6. Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    roll_number VARCHAR(50) NOT NULL,
    class_grade VARCHAR(50) NOT NULL,
    target_exam VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, user_id)
);

-- 7. Parents Table
CREATE TABLE IF NOT EXISTS public.parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    occupation VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, user_id)
);

-- 8. Parent-Student Mapping Table
CREATE TABLE IF NOT EXISTS public.parent_students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    relationship VARCHAR(50) DEFAULT 'Guardian',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

-- 9. Batches Table
CREATE TABLE IF NOT EXISTS public.batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    target_exam VARCHAR(100),
    room_number VARCHAR(50),
    start_time TIME,
    end_time TIME,
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('in_progress', 'upcoming', 'completed', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Batch Teachers & Batch Students Mappings
CREATE TABLE IF NOT EXISTS public.batch_teachers (
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    PRIMARY KEY(batch_id, teacher_id)
);

CREATE TABLE IF NOT EXISTS public.batch_students (
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY(batch_id, student_id)
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.institutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institute_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_students ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read and update their own profile
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Institutes: Members can view their institute
CREATE POLICY "Members can view their institute"
    ON public.institutes FOR SELECT
    USING (
        id IN (
            SELECT institute_id FROM public.institute_members
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Admins can update their institute details
CREATE POLICY "Admins can update their institute"
    ON public.institutes FOR UPDATE
    USING (
        id IN (
            SELECT institute_id FROM public.institute_members
            WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
        )
    );

-- Batches: Members can view batches within their institute
CREATE POLICY "Members can view institute batches"
    ON public.batches FOR SELECT
    USING (
        institute_id IN (
            SELECT institute_id FROM public.institute_members
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Batches: Only Admins and assigned Teachers can insert/update batches
CREATE POLICY "Admins can manage batches"
    ON public.batches FOR ALL
    USING (
        institute_id IN (
            SELECT institute_id FROM public.institute_members
            WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
        )
    );

-- Automatic Profile Creation Trigger on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, default_role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', 'New Member'),
        COALESCE(new.raw_user_meta_data->>'default_role', 'student')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
