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
