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
