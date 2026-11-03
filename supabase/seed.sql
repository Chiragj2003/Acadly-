-- ==============================================================================
-- ACADLY LOCAL DEVELOPMENT & TESTING SEED DATA (DEV-ONLY)
-- WARNING: THIS FILE IS STRICTLY FOR LOCAL DEV / INTEGRATION TESTING.
-- NEVER RUN THIS FILE IN A PRODUCTION DATABASE ENVIRONMENT!
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    
    -- Helper insertion for auth.users
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES
        (v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin.dev@acadly.com', v_password_hash, NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Director Rajesh Gupta","role":"admin"}', NOW(), NOW()),
        (v_teach_1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teacher.joshi@acadly.com', v_password_hash, NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Prof. Vikram Joshi","role":"teacher"}', NOW(), NOW()),
        (v_teach_2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teacher.sen@acadly.com', v_password_hash, NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Meera Sen","role":"teacher"}', NOW(), NOW()),
        (v_stud_1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student.amelia@acadly.com', v_password_hash, NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Amelia Sharma","role":"student"}', NOW(), NOW()),
        (v_stud_2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student.kabir@acadly.com', v_password_hash, NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Kabir Singhania","role":"student"}', NOW(), NOW()),
        (v_stud_3_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student.zoya@acadly.com', v_password_hash, NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Zoya Khan","role":"student"}', NOW(), NOW()),
        (v_stud_4_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student.rohan@acadly.com', v_password_hash, NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Rohan Verma","role":"student"}', NOW(), NOW()),
        (v_stud_5_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student.aarav@acadly.com', v_password_hash, NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Aarav Sharma","role":"student"}', NOW(), NOW()),
        (v_stud_6_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student.ananya@acadly.com', v_password_hash, NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ananya Patel","role":"student"}', NOW(), NOW()),
        (v_parent_1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'parent.sharma@acadly.com', v_password_hash, NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Rajesh Sharma","role":"parent"}', NOW(), NOW()),
        (v_parent_2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'parent.singhania@acadly.com', v_password_hash, NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sanjay Singhania","role":"parent"}', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

    -- Helper insertion for auth.identities
    INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES
        (v_admin_id, v_admin_id, json_build_object('sub', v_admin_id, 'email', 'admin.dev@acadly.com'), 'email', NOW(), NOW(), NOW()),
        (v_teach_1_id, v_teach_1_id, json_build_object('sub', v_teach_1_id, 'email', 'teacher.joshi@acadly.com'), 'email', NOW(), NOW(), NOW()),
        (v_teach_2_id, v_teach_2_id, json_build_object('sub', v_teach_2_id, 'email', 'teacher.sen@acadly.com'), 'email', NOW(), NOW(), NOW()),
        (v_stud_1_id, v_stud_1_id, json_build_object('sub', v_stud_1_id, 'email', 'student.amelia@acadly.com'), 'email', NOW(), NOW(), NOW()),
        (v_stud_2_id, v_stud_2_id, json_build_object('sub', v_stud_2_id, 'email', 'student.kabir@acadly.com'), 'email', NOW(), NOW(), NOW()),
        (v_stud_3_id, v_stud_3_id, json_build_object('sub', v_stud_3_id, 'email', 'student.zoya@acadly.com'), 'email', NOW(), NOW(), NOW()),
        (v_stud_4_id, v_stud_4_id, json_build_object('sub', v_stud_4_id, 'email', 'student.rohan@acadly.com'), 'email', NOW(), NOW(), NOW()),
        (v_stud_5_id, v_stud_5_id, json_build_object('sub', v_stud_5_id, 'email', 'student.aarav@acadly.com'), 'email', NOW(), NOW(), NOW()),
        (v_stud_6_id, v_stud_6_id, json_build_object('sub', v_stud_6_id, 'email', 'student.ananya@acadly.com'), 'email', NOW(), NOW(), NOW()),
        (v_parent_1_id, v_parent_1_id, json_build_object('sub', v_parent_1_id, 'email', 'parent.sharma@acadly.com'), 'email', NOW(), NOW(), NOW()),
        (v_parent_2_id, v_parent_2_id, json_build_object('sub', v_parent_2_id, 'email', 'parent.singhania@acadly.com'), 'email', NOW(), NOW(), NOW())
    ON CONFLICT (provider, identity_id) DO NOTHING;

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

    -- Institute Members
    INSERT INTO public.institute_members (institute_id, user_id, role)
    VALUES
        (v_inst_id, v_admin_id, 'admin'),
        (v_inst_id, v_teach_1_id, 'teacher'),
        (v_inst_id, v_teach_2_id, 'teacher'),
        (v_inst_id, v_stud_1_id, 'student'),
        (v_inst_id, v_stud_2_id, 'student'),
        (v_inst_id, v_stud_3_id, 'student'),
        (v_inst_id, v_stud_4_id, 'student'),
        (v_inst_id, v_stud_5_id, 'student'),
        (v_inst_id, v_stud_6_id, 'student'),
        (v_inst_id, v_parent_1_id, 'parent'),
        (v_inst_id, v_parent_2_id, 'parent')
    ON CONFLICT (institute_id, user_id) DO NOTHING;

    -- --------------------------------------------------------------------------
    -- 4. Role Specific Entities (Teachers, Students, Parents)
    -- --------------------------------------------------------------------------
    
    -- Teachers
    INSERT INTO public.teachers (id, institute_id, user_id, teacher_code, mode, qualification, specialization_subjects, experience_years, monthly_fee_rate, bio)
    VALUES
        (v_teacher_rec_1, v_inst_id, v_teach_1_id, 'JOSHI-MATH-89', 'solo', 'M.Sc Physics (IIT Bombay)', ARRAY['Physics', 'Mathematics', 'Calculus'], 12.0, 3500.00, 'Passionate about conceptual mechanics and Olympiad derivations.'),
        (v_teacher_rec_2, v_inst_id, v_teach_2_id, 'SEN-CHEM-26', 'coaching_faculty', 'Ph.D Organic Chemistry (IISc Bangalore)', ARRAY['Organic Chemistry', 'Physical Chemistry'], 9.5, 3200.00, 'Specializing in reaction mechanisms and NEET high-yield prep.')
    ON CONFLICT (id) DO NOTHING;

    -- Students
    INSERT INTO public.students (id, institute_id, user_id, admission_number, parent_link_code, grade, target_exam, school_name, previous_percentage, guardian_name, guardian_phone, weak_topics)
    VALUES
        (v_student_rec_1, v_inst_id, v_stud_1_id, 'ADM-2026-088', 'STU-AMELIA-902', 'Class 12', 'IIT-JEE Advanced 2026', 'Delhi Public School (R.K. Puram)', '96.4%', 'Rajesh Sharma', '+91 98230 44550', ARRAY['Rotational Dynamics', 'Wave Optics']),
        (v_student_rec_2, v_inst_id, v_stud_2_id, 'ADM-2026-089', 'STU-KABIR-118', 'Class 12', 'IIT-JEE Advanced 2026', 'Modern School (Barakhamba)', '94.8%', 'Sanjay Singhania', '+91 98110 33440', ARRAY['Thermodynamics', 'Coordinate Geometry']),
        (v_student_rec_3, v_inst_id, v_stud_3_id, 'ADM-2026-090', 'STU-ZOYA-204', 'Class 12', 'NEET UG 2026', 'St. Xavier High School', '95.2%', 'Farooq Khan', '+91 98900 22119', ARRAY['Electromagnetism']),
        (v_student_rec_4, v_inst_id, v_stud_4_id, 'ADM-2026-091', 'STU-ROHAN-305', 'Class 12', 'IIT-JEE 2026', 'Sanskriti School', '92.6%', 'Anil Verma', '+91 98450 77112', ARRAY['Ionic Equilibrium']),
        (v_student_rec_5, v_inst_id, v_stud_5_id, 'ADM-2026-092', 'STU-AARAV-104', 'Class 11', 'IIT-JEE Foundation', 'Delhi Public School', '97.0%', 'Rajesh Sharma', '+91 98230 44550', ARRAY['Calculus & Limits']),
        (v_student_rec_6, v_inst_id, v_stud_6_id, 'ADM-2026-093', 'STU-ANANYA-501', 'Class 11', 'NEET UG Foundation', 'National Public School', '93.5%', 'Deepak Patel', '+91 98770 99221', ARRAY['Plant Physiology'])
    ON CONFLICT (id) DO NOTHING;

    -- Parents
    INSERT INTO public.parents (id, institute_id, user_id, phone)
    VALUES
        (v_parent_rec_1, v_inst_id, v_parent_1_id, '+91 98230 44550'),
        (v_parent_rec_2, v_inst_id, v_parent_2_id, '+91 98110 33440')
    ON CONFLICT (id) DO NOTHING;

    -- Parent-Student Links
    INSERT INTO public.parent_students (institute_id, parent_id, student_id)
    VALUES
        (v_inst_id, v_parent_rec_1, v_student_rec_1), -- Rajesh Sharma -> Amelia Sharma
        (v_inst_id, v_parent_rec_1, v_student_rec_5), -- Rajesh Sharma -> Aarav Sharma
        (v_inst_id, v_parent_rec_2, v_student_rec_2)  -- Sanjay Singhania -> Kabir Singhania
    ON CONFLICT (parent_id, student_id) DO NOTHING;

    -- --------------------------------------------------------------------------
    -- 5. Batches & Enrollments
    -- --------------------------------------------------------------------------
    INSERT INTO public.batches (id, institute_id, name, subject, target_exam, room_number, start_time, end_time, status)
    VALUES
        (v_batch_1_id, v_inst_id, 'Class 12 • JEE Advanced (Morning)', 'Physics & Calculus', 'JEE Advanced', 'Hall A (Senior Wing)', '07:30 AM', '10:00 AM', 'in_progress'),
        (v_batch_2_id, v_inst_id, 'Class 11 • Physics & Calculus Mastery', 'Mechanics & Chemistry', 'Foundation', 'Einstein Hall 204', '04:30 PM', '07:00 PM', 'in_progress')
    ON CONFLICT (id) DO NOTHING;

    -- Batch Teachers
    INSERT INTO public.batch_teachers (institute_id, batch_id, teacher_id)
    VALUES
        (v_inst_id, v_batch_1_id, v_teacher_rec_1),
        (v_inst_id, v_batch_2_id, v_teacher_rec_2)
    ON CONFLICT (batch_id, teacher_id) DO NOTHING;

    -- Batch Enrollments
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
    -- 6. Attendance Sample Records
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
    -- 7. Homework & Submissions
    -- --------------------------------------------------------------------------
    INSERT INTO public.assignments (id, institute_id, batch_id, teacher_id, title, subject, description, due_date, max_marks)
    VALUES (
        v_assignment_id,
        v_inst_id,
        v_batch_1_id,
        v_teacher_rec_1,
        'Rotational Dynamics & Torque DPP #14',
        'Physics',
        'Solve problems 1-15 on rigid body planar motion and center of mass torque derivations.',
        NOW() + INTERVAL '2 days',
        25
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.submissions (institute_id, assignment_id, student_id, status, marks_obtained, feedback, submitted_at, graded_at)
    VALUES
        (v_inst_id, v_assignment_id, v_student_rec_1, 'graded', 24.00, 'Flawless step-by-step vector derivation on problem 4.', NOW() - INTERVAL '1 day', NOW()),
        (v_inst_id, v_assignment_id, v_student_rec_2, 'submitted', NULL, NULL, NOW() - INTERVAL '2 hours', NULL)
    ON CONFLICT (assignment_id, student_id) DO NOTHING;

    -- --------------------------------------------------------------------------
    -- 8. Fees, Payments & GST Receipts
    -- --------------------------------------------------------------------------
    INSERT INTO public.fee_plans (id, institute_id, name, amount, frequency, description)
    VALUES (
        v_fee_plan_id,
        v_inst_id,
        'Class 12 JEE Advanced Dropper Program',
        125000.00,
        'annual',
        'Full year comprehensive tuition, test series, mentorship, and library access.'
    ) ON CONFLICT (id) DO NOTHING;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_fees') THEN
        INSERT INTO public.student_fees (id, institute_id, student_id, fee_plan_id, gross_amount, scholarship_amount, net_payable, due_date, status)
        VALUES (
            v_fee_record_1,
            v_inst_id,
            v_student_rec_1,
            v_fee_plan_id,
            45000.00,
            5000.00,
            47200.00,
            CURRENT_DATE + 12,
            'paid'
        ) ON CONFLICT (id) DO NOTHING;
    END IF;

    INSERT INTO public.payments (id, institute_id, student_fee_id, student_id, amount_paid, payment_mode, razorpay_order_id, razorpay_payment_id, status)
    VALUES (
        v_payment_1,
        v_inst_id,
        v_fee_record_1,
        v_student_rec_1,
        47200.00,
        'razorpay',
        'order_N8s9vQ2kL1',
        'pay_M9k2P1x8Q0',
        'success'
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
    -- 9. Real-Time Chat Rooms & Messages
    -- --------------------------------------------------------------------------
    INSERT INTO public.chat_rooms (id, institute_id, batch_id, type, teacher_id, title)
    VALUES (
        v_room_batch_id,
        v_inst_id,
        v_batch_1_id,
        'batch_group',
        v_teacher_rec_1,
        'Class 12 • JEE Advanced (Morning)'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.chat_rooms (id, institute_id, batch_id, type, teacher_id, student_id, title)
    VALUES (
        v_room_doubt_id,
        v_inst_id,
        v_batch_1_id,
        'direct',
        v_teacher_rec_1,
        v_student_rec_2,
        'Doubt Room: Kabir Singhania'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.chat_messages (room_id, sender_id, sender_role, text, is_pinned, created_at)
    VALUES
        (v_room_batch_id, v_teach_1_id, 'teacher', 'Class starts tomorrow morning at 07:30 AM sharp. Please review DPP #14 solutions beforehand.', TRUE, NOW() - INTERVAL '3 hours'),
        (v_room_batch_id, v_stud_1_id, 'student', 'Sir, in question 3 of the formula sheet, should we use moment of inertia about the center of mass or the hinge point?', FALSE, NOW() - INTERVAL '1 hour'),
        (v_room_batch_id, v_teach_1_id, 'teacher', 'Always use parallel axis theorem if the rotation axis is displaced from the COM.', FALSE, NOW() - INTERVAL '45 mins'),
        (v_room_doubt_id, v_stud_2_id, 'student', 'Prof. Joshi, can you help me understand step 2 in the angular momentum conservation problem?', FALSE, NOW() - INTERVAL '30 mins'),
        (v_room_doubt_id, v_teach_1_id, 'teacher', 'Since external torque about the fixed point is zero, total angular momentum L = I*omega remains strictly constant.', FALSE, NOW() - INTERVAL '15 mins');

    -- --------------------------------------------------------------------------
    -- 10. Community Discussion Feed
    -- --------------------------------------------------------------------------
    INSERT INTO public.community_posts (id, institute_id, author_id, subject, title, content, upvotes)
    VALUES (
        v_post_id,
        v_inst_id,
        v_stud_1_id,
        'Physics',
        'Why is electric field inside a hollow spherical conductor strictly zero?',
        'In Gauss law we take a Gaussian sphere inside radius R. Since enclosed charge q=0, flux is 0. But how does charge on the outer shell cancel out the field at EVERY non-central point?',
        18
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.community_comments (institute_id, post_id, author_id, text, is_teacher_verified)
    VALUES (
        v_inst_id,
        v_post_id,
        v_teach_1_id,
        'By inverse-square law, a larger patch of surface charge further away subtends the exact same solid angle as a smaller, closer patch. Their electric fields cancel vectorially everywhere inside.',
        TRUE
    );

    -- --------------------------------------------------------------------------
    -- 11. Study Materials & Video Lectures
    -- --------------------------------------------------------------------------
    INSERT INTO public.study_materials (institute_id, batch_id, uploader_id, title, subject, category, file_url, file_name, file_size_bytes)
    VALUES (
        v_inst_id,
        v_batch_1_id,
        v_teach_1_id,
        'Rotational Dynamics & Inertia Mastery Sheet',
        'Physics',
        'Formula Sheet',
        'https://cwxuwaljqrqdogsyqhwc.supabase.co/storage/v1/object/public/study_materials/rotational_dynamics_mastery.pdf',
        'Rotational_Dynamics_Mastery.pdf',
        2450000
    );

    INSERT INTO public.lectures (institute_id, batch_id, teacher_id, title, subject, chapter, youtube_video_id, duration_minutes)
    VALUES (
        v_inst_id,
        v_batch_1_id,
        v_teacher_rec_1,
        'Advanced Mechanics: Angular Momentum & Gyroscopic Precession',
        'Physics',
        'Rotational Dynamics',
        'dQw4w9WgXcQ',
        75
    );

    -- --------------------------------------------------------------------------
    -- 12. Join Requests & In-App Notifications
    -- --------------------------------------------------------------------------
    INSERT INTO public.join_requests (institute_id, student_name, grade, board, target_exam, school, previous_percentage, guardian_name, guardian_phone, code_used, status)
    VALUES (
        v_inst_id,
        'Aarav Sharma',
        'Class 11',
        'CBSE',
        'IIT-JEE 2026',
        'Delhi Public School',
        '97.0%',
        'Rajesh Sharma',
        '+91 98230 44550',
        'JOSHI-MATH-89',
        'pending'
    );

    INSERT INTO public.notifications (institute_id, recipient_user_id, title, message, type)
    VALUES
        (v_inst_id, v_stud_1_id, 'Homework Graded', 'Prof. Vikram Joshi scored your DPP #14: 24/25 with feedback.', 'homework'),
        (v_inst_id, v_parent_1_id, 'Attendance Check-in', 'Amelia Sharma checked in for Class 12 JEE Advanced at 07:28 AM.', 'attendance'),
        (v_inst_id, v_parent_1_id, 'Fee Receipt Generated', 'Official GST invoice APX-REC-2026-9021 available for download.', 'fee');

END $$;
