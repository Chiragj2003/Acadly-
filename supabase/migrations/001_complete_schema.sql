-- ==============================================================================
-- ACADLY - PRODUCTION MULTI-TENANT ENGINE & 28-TABLE POSTGRESQL SCHEMA
-- Supports Multi-Teacher Coaching Centers & Solo Individual Tuition Teachers
-- Migration: 001_complete_schema.sql
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
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
    CREATE TYPE attendance_status_enum AS ENUM ('present', 'absent', 'late', 'excused');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE video_provider_enum AS ENUM ('youtube', 'bunny');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE material_category_enum AS ENUM ('notes', 'formula_sheet', 'pyq', 'book', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE submission_status_enum AS ENUM ('submitted', 'late', 'graded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE fee_status_enum AS ENUM ('pending', 'partial', 'paid');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_enum AS ENUM ('razorpay', 'cash', 'upi_manual', 'bank');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. STORAGE BUCKETS SETUP
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('avatars', 'avatars', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']),
    ('institute-logos', 'institute-logos', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/svg+xml']),
    ('study-materials', 'study-materials', false, 104857600, ARRAY['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
    ('community-attachments', 'community-attachments', false, 52428800, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp']),
    ('assignment-attachments', 'assignment-attachments', false, 52428800, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'application/zip']),
    ('student-submissions', 'student-submissions', false, 52428800, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'application/zip'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ==============================================================================
-- 4. 28 CORE PRODUCTION TABLES
-- ==============================================================================

-- 1. Institutes / Workspaces (Coaching Centers & Solo Teachers)
CREATE TABLE IF NOT EXISTS institutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    account_type account_type_enum NOT NULL DEFAULT 'coaching_center',
    invite_code VARCHAR(50) UNIQUE NOT NULL,
    logo_url TEXT,
    banner_url TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles (Global User Directory)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    expo_push_token TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Institute Members (Multi-Tenant Memberships & Roles)
CREATE TABLE IF NOT EXISTS institute_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role app_role_enum NOT NULL DEFAULT 'student',
    verification_status verification_status_enum NOT NULL DEFAULT 'verified',
    verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, user_id, role)
);

-- 4. Teachers (Extended Faculty Profile)
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    teacher_code VARCHAR(50) UNIQUE NOT NULL,
    qualification VARCHAR(255),
    specialization_subjects TEXT[] DEFAULT '{}',
    experience_years NUMERIC(4, 1) DEFAULT 0.0,
    bio TEXT,
    achievements TEXT,
    demo_video_url TEXT,
    joining_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, user_id)
);

-- 5. Students (Extended Student Bio & Academic Profile)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    roll_number VARCHAR(50),
    grade_or_class VARCHAR(50) NOT NULL,
    board VARCHAR(50) DEFAULT 'CBSE',
    stream_or_target_exam VARCHAR(100),
    school_or_college VARCHAR(255),
    medium VARCHAR(50) DEFAULT 'English',
    dob DATE,
    blood_group VARCHAR(10),
    address TEXT,
    previous_percentage NUMERIC(5, 2),
    weak_subjects TEXT[] DEFAULT '{}',
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(50),
    admission_date DATE DEFAULT CURRENT_DATE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, user_id)
);

-- 6. Parents
CREATE TABLE IF NOT EXISTS parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    occupation VARCHAR(100),
    alternate_phone VARCHAR(50),
    relationship_type VARCHAR(50) DEFAULT 'Guardian',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, user_id)
);

-- 7. Parent Students (Child Links)
CREATE TABLE IF NOT EXISTS parent_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    relationship VARCHAR(50) DEFAULT 'Child',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

-- 8. Join Requests (Teacher Code Student Verification Queue)
CREATE TABLE IF NOT EXISTS join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    requested_role app_role_enum NOT NULL DEFAULT 'student',
    code_used VARCHAR(50) NOT NULL,
    student_extra_details_json JSONB DEFAULT '{}'::jsonb,
    status verification_status_enum NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Subjects
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL,
    color_hex VARCHAR(20) DEFAULT '#ff7d6b',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, code)
);

-- 10. Batches
CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    academic_year VARCHAR(50) DEFAULT '2026-2027',
    start_date DATE,
    end_date DATE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Batch Schedules
CREATE TABLE IF NOT EXISTS batch_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_or_link VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Batch Teachers
CREATE TABLE IF NOT EXISTS batch_teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(batch_id, teacher_id)
);

-- 13. Batch Students (Enrollments)
CREATE TABLE IF NOT EXISTS batch_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active',
    UNIQUE(batch_id, student_id)
);

-- 14. Attendance
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status attendance_status_enum NOT NULL DEFAULT 'present',
    marked_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    remarks TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(batch_id, student_id, date)
);

-- 15. Lectures
CREATE TABLE IF NOT EXISTS lectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_provider video_provider_enum NOT NULL DEFAULT 'youtube',
    provider_video_id VARCHAR(100) NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    thumbnail_url TEXT,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Lecture Doubts
CREATE TABLE IF NOT EXISTS lecture_doubts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    parent_doubt_id UUID REFERENCES lecture_doubts(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Study Materials (PDF Repository)
CREATE TABLE IF NOT EXISTS study_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    category material_category_enum NOT NULL DEFAULT 'notes',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_size VARCHAR(50),
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Community Posts (Student & Teacher Peer Discussions)
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    pdf_or_file_url TEXT,
    image_url TEXT,
    upvotes_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Community Comments
CREATE TABLE IF NOT EXISTS community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    attachment_url TEXT,
    is_teacher_verified_answer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Community Upvotes
CREATE TABLE IF NOT EXISTS community_upvotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- 21. Assignments
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    instructions TEXT NOT NULL,
    attachment_url TEXT,
    max_marks NUMERIC(5, 2) DEFAULT 100.00,
    due_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Submissions
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    student_notes TEXT,
    status submission_status_enum NOT NULL DEFAULT 'submitted',
    marks_obtained NUMERIC(5, 2),
    feedback TEXT,
    graded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    graded_at TIMESTAMPTZ,
    UNIQUE(assignment_id, student_id)
);

-- 23. Examinations
CREATE TABLE IF NOT EXISTS examinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
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

-- 24. Results (Grades & Rank)
CREATE TABLE IF NOT EXISTS results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    examination_id UUID NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    marks_obtained NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    batch_rank INTEGER DEFAULT 1,
    grade VARCHAR(10),
    is_absent BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(examination_id, student_id)
);

-- 25. Fee Plans
CREATE TABLE IF NOT EXISTS fee_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    due_date DATE,
    installments_allowed INTEGER DEFAULT 1,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 26. Student Fee Records
CREATE TABLE IF NOT EXISTS student_fee_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    fee_plan_id UUID NOT NULL REFERENCES fee_plans(id) ON DELETE RESTRICT,
    total_amount NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0.00,
    net_payable NUMERIC(10, 2) NOT NULL,
    amount_paid NUMERIC(10, 2) DEFAULT 0.00,
    status fee_status_enum NOT NULL DEFAULT 'pending',
    due_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 27. Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    student_fee_record_id UUID NOT NULL REFERENCES student_fee_records(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method payment_method_enum NOT NULL DEFAULT 'razorpay',
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100) UNIQUE,
    receipt_number VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'paid',
    recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    paid_at TIMESTAMPTZ DEFAULT NOW()
);

-- 28. Announcements & Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general',
    deep_link_data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. AUTO-CALCULATION TRIGGERS (EXAM RANKS, BATCH AVERAGE & TOPPER)
-- ==============================================================================

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
    FROM results
    WHERE examination_id = target_exam_id AND is_absent = FALSE;

    UPDATE examinations
    SET 
        batch_average_marks = avg_marks,
        batch_highest_marks = high_marks
    WHERE id = target_exam_id;

    -- 2. Automatically compute dense ranks across the batch
    WITH RankedResults AS (
        SELECT id, DENSE_RANK() OVER (ORDER BY marks_obtained DESC) as computed_rank
        FROM results
        WHERE examination_id = target_exam_id AND is_absent = FALSE
    )
    UPDATE results r
    SET batch_rank = rr.computed_rank
    FROM RankedResults rr
    WHERE r.id = rr.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recalculate_exam_metrics ON results;
CREATE TRIGGER trigger_recalculate_exam_metrics
AFTER INSERT OR UPDATE OF marks_obtained, is_absent OR DELETE ON results
FOR EACH ROW EXECUTE FUNCTION recalculate_exam_metrics_and_ranks();

-- ==============================================================================
-- 6. SECURITY DEFINER HELPER FUNCTIONS & RLS
-- ==============================================================================

CREATE OR REPLACE FUNCTION is_institute_member(target_inst_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT EXISTS (
        SELECT 1 FROM institute_members
        WHERE institute_id = target_inst_id AND user_id = auth.uid() AND is_active = TRUE
    );
$$;

CREATE OR REPLACE FUNCTION is_institute_staff(target_inst_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT EXISTS (
        SELECT 1 FROM institute_members
        WHERE institute_id = target_inst_id AND user_id = auth.uid() 
          AND role IN ('admin', 'teacher') AND is_active = TRUE
    );
$$;

-- Enable RLS across all 28 tables
ALTER TABLE institutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE institute_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_doubts ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_fee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Core RLS Policies
CREATE POLICY "institutes_read" ON institutes FOR SELECT TO authenticated USING (true);
CREATE POLICY "institutes_admin" ON institutes FOR ALL TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "profiles_read" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "join_requests_user" ON join_requests FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_institute_staff(institute_id));
CREATE POLICY "join_requests_insert" ON join_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "join_requests_staff_manage" ON join_requests FOR UPDATE TO authenticated USING (is_institute_staff(institute_id));

CREATE POLICY "community_posts_read" ON community_posts FOR SELECT TO authenticated USING (is_institute_member(institute_id));
CREATE POLICY "community_posts_insert" ON community_posts FOR INSERT TO authenticated WITH CHECK (is_institute_member(institute_id) AND author_id = auth.uid());

CREATE POLICY "community_comments_read" ON community_comments FOR SELECT TO authenticated USING (is_institute_member(institute_id));
CREATE POLICY "community_comments_insert" ON community_comments FOR INSERT TO authenticated WITH CHECK (is_institute_member(institute_id) AND author_id = auth.uid());

CREATE POLICY "results_read" ON results FOR SELECT TO authenticated USING (is_institute_member(institute_id));
CREATE POLICY "results_staff_write" ON results FOR ALL TO authenticated USING (is_institute_staff(institute_id));

CREATE POLICY "attendance_read" ON attendance FOR SELECT TO authenticated USING (is_institute_member(institute_id));
CREATE POLICY "attendance_staff_write" ON attendance FOR ALL TO authenticated USING (is_institute_staff(institute_id));

CREATE POLICY "materials_read" ON study_materials FOR SELECT TO authenticated USING (is_institute_member(institute_id));
CREATE POLICY "materials_staff_write" ON study_materials FOR ALL TO authenticated USING (is_institute_staff(institute_id));
