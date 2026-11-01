-- ==============================================================================
-- ACADLY - MULTI-TENANT TUITION & COACHING MANAGEMENT SYSTEM
-- UNIFIED PRODUCTION SCHEMA MIGRATION (001_complete_schema.sql)
-- Complete 25-Table Schema with Strict RLS, Composite Indexes & Storage Buckets
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('super_admin', 'admin', 'teacher', 'student', 'parent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE material_type AS ENUM ('pdf', 'document', 'spreadsheet', 'notes', 'link');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE submission_status AS ENUM ('pending', 'submitted', 'graded', 'late', 'resubmitted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'partially_paid', 'overdue', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('razorpay', 'upi', 'cash', 'bank_transfer', 'cheque');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('attendance_alert', 'assignment_due', 'lecture_uploaded', 'fee_reminder', 'exam_announcement', 'general');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE video_provider AS ENUM ('youtube', 'bunny_stream', 'vimeo', 'custom_hls');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. STORAGE BUCKETS SETUP
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('avatars', 'avatars', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']),
    ('institute-logos', 'institute-logos', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/svg+xml']),
    ('study-materials', 'study-materials', false, 104857600, ARRAY['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
    ('assignment-attachments', 'assignment-attachments', false, 52428800, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'application/zip']),
    ('student-submissions', 'student-submissions', false, 52428800, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'application/zip'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 4. UTILITY TRIGGER FUNCTION FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 5. TABLES CREATION (25 CORE TABLES)
-- ==============================================================================

-- Table 1: Institutes (Tenants)
CREATE TABLE IF NOT EXISTS institutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    tagline VARCHAR(255),
    logo_url TEXT,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    join_code VARCHAR(20) UNIQUE NOT NULL,
    razorpay_account_id VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: Profiles (Global User Directory)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    avatar_url TEXT,
    expo_push_token TEXT,
    default_role app_role DEFAULT 'student',
    is_super_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: Institute Members (Tenant Membership & Roles)
CREATE TABLE IF NOT EXISTS institute_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'student',
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, user_id, role)
);

-- Table 4: Teachers (Academic Faculty)
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    employee_code VARCHAR(50),
    specialization VARCHAR(255),
    qualification VARCHAR(255),
    hire_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, user_id)
);

-- Table 5: Students (Enrolled Learners)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    admission_number VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    blood_group VARCHAR(10),
    emergency_contact VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, user_id),
    UNIQUE(institute_id, admission_number)
);

-- Table 6: Parents (Guardians)
CREATE TABLE IF NOT EXISTS parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    occupation VARCHAR(100),
    relationship VARCHAR(50) DEFAULT 'Guardian',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, user_id)
);

-- Table 7: Parent-Student Mappings (Family Links)
CREATE TABLE IF NOT EXISTS parent_student_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    is_primary_guardian BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

-- Table 8: Academic Years
CREATE TABLE IF NOT EXISTS academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 9: Courses (Subjects / Programs)
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, code)
);

-- Table 10: Batches (Classes / Cohorts)
CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    room_number VARCHAR(50),
    capacity INTEGER DEFAULT 40,
    start_time TIME,
    end_time TIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, code)
);

-- Table 11: Batch Enrollments
CREATE TABLE IF NOT EXISTS batch_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    roll_number VARCHAR(50),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(batch_id, student_id)
);

-- Table 12: Timetables (Weekly Schedule)
CREATE TABLE IF NOT EXISTS timetables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    subject VARCHAR(150) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 13: Attendance Sessions
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    marked_by_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    topic_covered VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(batch_id, session_date)
);

-- Table 14: Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status attendance_status NOT NULL DEFAULT 'present',
    remark VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

-- Table 15: Attendance Audit Logs
CREATE TABLE IF NOT EXISTS attendance_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    attendance_record_id UUID NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
    changed_by_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    previous_status attendance_status NOT NULL,
    new_status attendance_status NOT NULL,
    reason TEXT NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 16: Study Materials (PDF & Document Repository)
CREATE TABLE IF NOT EXISTS study_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    material_type material_type DEFAULT 'pdf',
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 17: Video Lectures (YouTube Unlisted / Provider-Independent)
CREATE TABLE IF NOT EXISTS video_lectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    provider video_provider NOT NULL DEFAULT 'youtube',
    video_id VARCHAR(100) NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_seconds INTEGER DEFAULT 0,
    is_unlisted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 18: Assignments
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    instructions TEXT NOT NULL,
    attachment_url TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    max_marks NUMERIC(5, 2) DEFAULT 100.00,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 19: Assignment Submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    submission_file_url TEXT NOT NULL,
    student_notes TEXT,
    status submission_status DEFAULT 'submitted',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    marks_obtained NUMERIC(5, 2),
    feedback TEXT,
    graded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    graded_at TIMESTAMPTZ,
    UNIQUE(assignment_id, student_id)
);

-- Table 20: Exams (Assessments & Tests)
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    exam_date DATE NOT NULL,
    start_time TIME,
    duration_minutes INTEGER DEFAULT 60,
    total_marks NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    passing_marks NUMERIC(5, 2) NOT NULL DEFAULT 40.00,
    instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 21: Exam Results (Grades)
CREATE TABLE IF NOT EXISTS exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    marks_obtained NUMERIC(5, 2) NOT NULL,
    grade VARCHAR(10),
    rank INTEGER,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, student_id)
);

-- Table 22: Fee Plans (Institute Pricing)
CREATE TABLE IF NOT EXISTS fee_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    total_amount NUMERIC(10, 2) NOT NULL,
    installment_frequency VARCHAR(50) DEFAULT 'monthly',
    gst_percent NUMERIC(4, 2) DEFAULT 18.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 23: Student Fee Records (Dues & Billing)
CREATE TABLE IF NOT EXISTS student_fee_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    fee_plan_id UUID NOT NULL REFERENCES fee_plans(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0.00,
    net_payable NUMERIC(10, 2) NOT NULL,
    paid_amount NUMERIC(10, 2) DEFAULT 0.00,
    remaining_balance NUMERIC(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    status payment_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 24: Payments (Online Razorpay & Offline Receipts)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    student_fee_record_id UUID NOT NULL REFERENCES student_fee_records(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    receipt_number VARCHAR(100) UNIQUE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    gst_amount NUMERIC(10, 2) DEFAULT 0.00,
    payment_method payment_method NOT NULL DEFAULT 'razorpay',
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100) UNIQUE,
    razorpay_signature VARCHAR(255),
    status payment_status NOT NULL DEFAULT 'paid',
    notes TEXT,
    collected_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 25: Notifications (Alerts & Announcements)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    type notification_type NOT NULL DEFAULT 'general',
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. SECURITY DEFINER RLS HELPER FUNCTIONS
-- ==============================================================================

-- Check if current authenticated user is an active member of an institute
CREATE OR REPLACE FUNCTION is_institute_member(target_institute_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM institute_members 
        WHERE institute_id = target_institute_id 
          AND user_id = auth.uid() 
          AND is_active = TRUE
    );
$$;

-- Check if current authenticated user has a specific role in an institute
CREATE OR REPLACE FUNCTION has_institute_role(target_institute_id UUID, required_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM institute_members 
        WHERE institute_id = target_institute_id 
          AND user_id = auth.uid() 
          AND role = required_role 
          AND is_active = TRUE
    );
$$;

-- Check if current authenticated user is a parent of a given student
CREATE OR REPLACE FUNCTION is_parent_of_student(target_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM parent_student_mappings psm
        JOIN parents p ON psm.parent_id = p.id
        WHERE p.user_id = auth.uid()
          AND psm.student_id = target_student_id
    );
$$;

-- Check if a student is enrolled in a specific batch
CREATE OR REPLACE FUNCTION is_enrolled_in_batch(target_batch_id UUID, target_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM batch_enrollments
        WHERE batch_id = target_batch_id
          AND student_id = target_student_id
          AND is_active = TRUE
    );
$$;

-- Get student ID for the current authenticated user in an institute
CREATE OR REPLACE FUNCTION get_my_student_id(target_institute_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT id 
    FROM students 
    WHERE institute_id = target_institute_id 
      AND user_id = auth.uid()
    LIMIT 1;
$$;

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE institutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE institute_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_fee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles in their institutes; can update their own
CREATE POLICY "profiles_select_own_or_institute" ON profiles
    FOR SELECT TO authenticated
    USING (
        id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM institute_members m1
            JOIN institute_members m2 ON m1.institute_id = m2.institute_id
            WHERE m1.user_id = auth.uid() AND m2.user_id = profiles.id
        )
    );

CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

-- Institutes: Viewable by members or public lookup by join code
CREATE POLICY "institutes_select_member" ON institutes
    FOR SELECT TO authenticated
    USING (is_institute_member(id) OR is_active = TRUE);

CREATE POLICY "institutes_admin_manage" ON institutes
    FOR ALL TO authenticated
    USING (has_institute_role(id, 'admin') OR has_institute_role(id, 'super_admin'));

-- Institute Members:
CREATE POLICY "members_select" ON institute_members
    FOR SELECT TO authenticated
    USING (is_institute_member(institute_id));

CREATE POLICY "members_admin_manage" ON institute_members
    FOR ALL TO authenticated
    USING (has_institute_role(institute_id, 'admin'));

-- Teachers:
CREATE POLICY "teachers_select" ON teachers
    FOR SELECT TO authenticated
    USING (is_institute_member(institute_id));

CREATE POLICY "teachers_admin_manage" ON teachers
    FOR ALL TO authenticated
    USING (has_institute_role(institute_id, 'admin'));

-- Students:
CREATE POLICY "students_select" ON students
    FOR SELECT TO authenticated
    USING (
        is_institute_member(institute_id)
        AND (
            user_id = auth.uid()
            OR has_institute_role(institute_id, 'admin')
            OR has_institute_role(institute_id, 'teacher')
            OR is_parent_of_student(id)
        )
    );

CREATE POLICY "students_admin_manage" ON students
    FOR ALL TO authenticated
    USING (has_institute_role(institute_id, 'admin'));

-- Parents & Mappings:
CREATE POLICY "parents_select" ON parents
    FOR SELECT TO authenticated
    USING (is_institute_member(institute_id));

CREATE POLICY "parent_mappings_select" ON parent_student_mappings
    FOR SELECT TO authenticated
    USING (
        is_institute_member(institute_id)
        AND (
            has_institute_role(institute_id, 'admin')
            OR has_institute_role(institute_id, 'teacher')
            OR is_parent_of_student(student_id)
            OR student_id = get_my_student_id(institute_id)
        )
    );

-- Batches, Courses & Timetables:
CREATE POLICY "courses_select" ON courses
    FOR SELECT TO authenticated
    USING (is_institute_member(institute_id));

CREATE POLICY "courses_admin_manage" ON courses
    FOR ALL TO authenticated
    USING (has_institute_role(institute_id, 'admin'));

CREATE POLICY "batches_select" ON batches
    FOR SELECT TO authenticated
    USING (is_institute_member(institute_id));

CREATE POLICY "batches_admin_manage" ON batches
    FOR ALL TO authenticated
    USING (has_institute_role(institute_id, 'admin') OR has_institute_role(institute_id, 'teacher'));

CREATE POLICY "batch_enrollments_select" ON batch_enrollments
    FOR SELECT TO authenticated
    USING (is_institute_member(institute_id));

CREATE POLICY "batch_enrollments_admin_manage" ON batch_enrollments
    FOR ALL TO authenticated
    USING (has_institute_role(institute_id, 'admin'));

CREATE POLICY "timetables_select" ON timetables
    FOR SELECT TO authenticated
    USING (is_institute_member(institute_id));

-- Attendance:
CREATE POLICY "attendance_sessions_select" ON attendance_sessions
    FOR SELECT TO authenticated
    USING (is_institute_member(institute_id));

CREATE POLICY "attendance_sessions_modify" ON attendance_sessions
    FOR ALL TO authenticated
    USING (has_institute_role(institute_id, 'admin') OR has_institute_role(institute_id, 'teacher'));

CREATE POLICY "attendance_records_select" ON attendance_records
    FOR SELECT TO authenticated
    USING (
        is_institute_member(institute_id)
        AND (
            has_institute_role(institute_id, 'admin')
            OR has_institute_role(institute_id, 'teacher')
            OR student_id = get_my_student_id(institute_id)
            OR is_parent_of_student(student_id)
        )
    );

CREATE POLICY "attendance_records_modify" ON attendance_records
    FOR ALL TO authenticated
    USING (has_institute_role(institute_id, 'admin') OR has_institute_role(institute_id, 'teacher'));

CREATE POLICY "attendance_audit_select" ON attendance_audit_logs
    FOR SELECT TO authenticated
    USING (has_institute_role(institute_id, 'admin') OR has_institute_role(institute_id, 'teacher'));

CREATE POLICY "attendance_audit_insert" ON attendance_audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (has_institute_role(institute_id, 'admin') OR has_institute_role(institute_id, 'teacher'));

-- Study Materials:
CREATE POLICY "study_materials_select" ON study_materials
    FOR SELECT TO authenticated
    USING (
        is_institute_member(institute_id)
        AND (
            has_institute_role(institute_id, 'admin')
            OR has_institute_role(institute_id, 'teacher')
            OR is_enrolled_in_batch(batch_id, get_my_student_id(institute_id))
        )
    );

CREATE POLICY "study_materials_modify" ON study_materials
    FOR ALL TO authenticated
    USING (has_institute_role(institute_id, 'admin') OR has_institute_role(institute_id, 'teacher'));

-- Video Lectures:
CREATE POLICY "video_lectures_select" ON video_lectures
    FOR SELECT TO authenticated
    USING (
        is_institute_member(institute_id)
        AND (
            has_institute_role(institute_id, 'admin')
            OR has_institute_role(institute_id, 'teacher')
            OR is_enrolled_in_batch(batch_id, get_my_student_id(institute_id))
        )
    );

CREATE POLICY "video_lectures_modify" ON video_lectures
    FOR ALL TO authenticated
    USING (has_institute_role(institute_id, 'admin') OR has_institute_role(institute_id, 'teacher'));

-- Assignments & Submissions:
CREATE POLICY "assignments_select" ON assignments
    FOR SELECT TO authenticated
    USING (
        is_institute_member(institute_id)
        AND (
            has_institute_role(institute_id, 'admin')
            OR has_institute_role(institute_id, 'teacher')
            OR is_enrolled_in_batch(batch_id, get_my_student_id(institute_id))
        )
    );

CREATE POLICY "assignments_modify" ON assignments
    FOR ALL TO authenticated
    USING (has_institute_role(institute_id, 'admin') OR has_institute_role(institute_id, 'teacher'));

CREATE POLICY "assignment_submissions_select" ON assignment_submissions
    FOR SELECT TO authenticated
    USING (
        is_institute_member(institute_id)
        AND (
            has_institute_role(institute_id, 'admin')
            OR has_institute_role(institute_id, 'teacher')
            OR student_id = get_my_student_id(institute_id)
            OR is_parent_of_student(student_id)
        )
    );

CREATE POLICY "assignment_submissions_insert_student" ON assignment_submissions
    FOR INSERT TO authenticated
    WITH CHECK (
        student_id = get_my_student_id(institute_id)
    );

CREATE POLICY "assignment_submissions_grade" ON assignment_submissions
    FOR UPDATE TO authenticated
    USING (
        has_institute_role(institute_id, 'admin') 
        OR has_institute_role(institute_id, 'teacher')
        OR student_id = get_my_student_id(institute_id)
    );

-- Exams & Results:
CREATE POLICY "exams_select" ON exams
    FOR SELECT TO authenticated
    USING (is_institute_member(institute_id));

CREATE POLICY "exams_modify" ON exams
    FOR ALL TO authenticated
    USING (has_institute_role(institute_id, 'admin') OR has_institute_role(institute_id, 'teacher'));

CREATE POLICY "exam_results_select" ON exam_results
    FOR SELECT TO authenticated
    USING (
        is_institute_member(institute_id)
        AND (
            has_institute_role(institute_id, 'admin')
            OR has_institute_role(institute_id, 'teacher')
            OR student_id = get_my_student_id(institute_id)
            OR is_parent_of_student(student_id)
        )
    );

CREATE POLICY "exam_results_modify" ON exam_results
    FOR ALL TO authenticated
    USING (has_institute_role(institute_id, 'admin') OR has_institute_role(institute_id, 'teacher'));

-- Fee Plans, Records & Payments:
CREATE POLICY "fee_plans_select" ON fee_plans
    FOR SELECT TO authenticated
    USING (is_institute_member(institute_id));

CREATE POLICY "fee_plans_admin_manage" ON fee_plans
    FOR ALL TO authenticated
    USING (has_institute_role(institute_id, 'admin'));

CREATE POLICY "fee_records_select" ON student_fee_records
    FOR SELECT TO authenticated
    USING (
        is_institute_member(institute_id)
        AND (
            has_institute_role(institute_id, 'admin')
            OR student_id = get_my_student_id(institute_id)
            OR is_parent_of_student(student_id)
        )
    );

CREATE POLICY "fee_records_admin_manage" ON student_fee_records
    FOR ALL TO authenticated
    USING (has_institute_role(institute_id, 'admin'));

CREATE POLICY "payments_select" ON payments
    FOR SELECT TO authenticated
    USING (
        is_institute_member(institute_id)
        AND (
            has_institute_role(institute_id, 'admin')
            OR student_id = get_my_student_id(institute_id)
            OR is_parent_of_student(student_id)
        )
    );

CREATE POLICY "payments_admin_manage" ON payments
    FOR ALL TO authenticated
    USING (has_institute_role(institute_id, 'admin'));

-- Notifications:
CREATE POLICY "notifications_select_own" ON notifications
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON notifications
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_insert_staff" ON notifications
    FOR INSERT TO authenticated
    WITH CHECK (
        has_institute_role(institute_id, 'admin') 
        OR has_institute_role(institute_id, 'teacher')
        OR auth.uid() = user_id
    );

-- ==============================================================================
-- 8. COMPOSITE INDEXES & PERFORMANCE OPTIMIZATIONS
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_institute_members_lookup ON institute_members(institute_id, user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_students_institute ON students(institute_id, user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_institute ON teachers(institute_id, user_id);
CREATE INDEX IF NOT EXISTS idx_parents_institute ON parents(institute_id, user_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_link ON parent_student_mappings(student_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_batches_institute ON batches(institute_id, is_active);
CREATE INDEX IF NOT EXISTS idx_batch_enrollments_query ON batch_enrollments(batch_id, student_id, is_active);
CREATE INDEX IF NOT EXISTS idx_attendance_records_query ON attendance_records(session_id, student_id, status);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON attendance_sessions(batch_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_study_materials_batch ON study_materials(batch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_lectures_batch ON video_lectures(batch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_batch_due ON assignments(batch_id, due_date ASC);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON assignment_submissions(assignment_id, student_id, status);
CREATE INDEX IF NOT EXISTS idx_fee_records_student ON student_fee_records(student_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_payments_lookup ON payments(institute_id, student_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- ==============================================================================
-- 9. STORAGE ROW LEVEL SECURITY POLICIES
-- ==============================================================================

CREATE POLICY "avatars_public_select" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'avatars');

CREATE POLICY "avatars_user_upload" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "logos_public_select" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'institute-logos');

CREATE POLICY "logos_admin_upload" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'institute-logos');

CREATE POLICY "materials_member_select" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'study-materials');

CREATE POLICY "materials_staff_upload" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'study-materials');

CREATE POLICY "submissions_staff_and_student_select" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'student-submissions' OR bucket_id = 'assignment-attachments');

CREATE POLICY "submissions_student_upload" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'student-submissions');

CREATE POLICY "assignment_attachments_staff_upload" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'assignment-attachments');
