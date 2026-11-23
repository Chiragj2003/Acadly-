-- =============================================================================
-- ACADLY DEMO DATA  (dev / demo projects only)
-- Run AFTER supabase/hosted_setup.sql:
--   Supabase Dashboard -> SQL Editor -> New query -> paste this whole file -> Run
-- Safe to run more than once (fixed ids + ON CONFLICT DO NOTHING).
--
-- What it does
--   1. Fixes schema gaps the app relies on (join requests / approvals failed without them)
--   2. Adds the student_roster_stats view: real attendance %, latest rank, fee status
--   3. Fills ~2 months of realistic data for the demo institute:
--      attendance, weekly tests + ranked results, homework + graded submissions,
--      monthly fees + payments, announcements, notifications, doubts, and
--      2 pending join requests for the "Verify students" screen
-- =============================================================================
BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Schema fixes
-- -----------------------------------------------------------------------------
-- The app inserts these on join requests and approve_join_request() reads them.
ALTER TABLE public.join_requests ADD COLUMN IF NOT EXISTS student_details JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.join_requests ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.join_requests ADD COLUMN IF NOT EXISTS teacher_code VARCHAR(50);
ALTER TABLE public.join_requests ADD COLUMN IF NOT EXISTS target_type VARCHAR(30);
ALTER TABLE public.join_requests ALTER COLUMN code_used DROP NOT NULL;
-- approve_join_request() reads batches.grade and sets students.updated_at.
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS grade VARCHAR(50);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- -----------------------------------------------------------------------------
-- 2. Roster stats view (security_invoker: callers only see rows their RLS allows)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.student_roster_stats WITH (security_invoker = true) AS
SELECT
  s.id AS student_id,
  s.institute_id,
  (SELECT b.name
     FROM public.batch_students bs JOIN public.batches b ON b.id = bs.batch_id
    WHERE bs.student_id = s.id AND bs.status = 'enrolled'
    ORDER BY bs.enrolled_at LIMIT 1) AS batch_name,
  (SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE a.status IN ('P', 'L', 'E', 'present', 'late', 'excused'))
                / NULLIF(COUNT(*), 0))::INT
     FROM public.attendance a WHERE a.student_id = s.id) AS attendance_pct,
  (SELECT r.batch_rank
     FROM public.results r JOIN public.examinations e ON e.id = r.examination_id
    WHERE r.student_id = s.id AND NOT r.is_absent
    ORDER BY e.exam_date DESC LIMIT 1) AS latest_rank,
  (SELECT ROUND(AVG(r.percentage))::INT
     FROM public.results r WHERE r.student_id = s.id AND NOT r.is_absent) AS avg_percentage,
  (SELECT CASE WHEN COUNT(*) = 0 THEN NULL
               WHEN BOOL_OR(sf.pending_amount > 0) THEN 'due'
               ELSE 'paid' END
     FROM public.student_fees sf WHERE sf.student_id = s.id) AS fee_status,
  (SELECT COALESCE(SUM(sf.pending_amount), 0)
     FROM public.student_fees sf WHERE sf.student_id = s.id) AS fee_due_amount
FROM public.students s;

GRANT SELECT ON public.student_roster_stats TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. Demo data
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_inst   UUID := '11111111-1111-1111-1111-111111111111';
  v_admin  UUID := '00000000-0000-0000-0000-000000000001';
  v_joshi  UUID := '00000000-0000-0000-0000-000000000002';
  v_amelia UUID := '00000000-0000-0000-0000-000000000004';
  v_kabir  UUID := '00000000-0000-0000-0000-000000000005';
  v_zoya   UUID := '00000000-0000-0000-0000-000000000006';
  v_parent UUID := '00000000-0000-0000-0000-000000000010';
  v_app1   UUID := '00000000-0000-0000-0000-000000000012';
  v_app2   UUID := '00000000-0000-0000-0000-000000000013';
  v_pw     TEXT := crypt('DevPass@2026!', gen_salt('bf'));

  v_phy UUID; v_chem UUID; v_math UUID; v_bio UUID;
  v_subjects UUID[]; v_titles TEXT[];
  b RECORD; st RECORD;
  d DATE;
  n INT; m INT; k INT;
  v_rate INT; v_ability INT; v_marks NUMERIC; v_absent BOOLEAN;
  v_exam UUID; v_asg UUID; v_fee UUID; v_post UUID;
  v_month DATE; v_paid BOOLEAN; v_author UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.institutes WHERE id = v_inst) THEN
    RAISE EXCEPTION 'Demo institute not found. Run supabase/hosted_setup.sql first.';
  END IF;

  -- Subjects (one per real subject so progress charts group properly)
  INSERT INTO public.subjects (institute_id, name, code, color_hex) VALUES
    (v_inst, 'Physics',     'PHY',  '#C9DCF4'),
    (v_inst, 'Chemistry',   'CHEM', '#CDEBD7'),
    (v_inst, 'Mathematics', 'MATH', '#F6C6DD'),
    (v_inst, 'Biology',     'BIO',  '#F9D7BF')
  ON CONFLICT (institute_id, code) DO NOTHING;
  SELECT id INTO v_phy  FROM public.subjects WHERE institute_id = v_inst AND code = 'PHY';
  SELECT id INTO v_chem FROM public.subjects WHERE institute_id = v_inst AND code = 'CHEM';
  SELECT id INTO v_math FROM public.subjects WHERE institute_id = v_inst AND code = 'MATH';
  SELECT id INTO v_bio  FROM public.subjects WHERE institute_id = v_inst AND code = 'BIO';

  UPDATE public.batches SET grade = CASE WHEN name ILIKE '%11%' THEN 'Class 11' ELSE 'Class 12' END
   WHERE institute_id = v_inst AND grade IS NULL;

  FOR b IN
    SELECT bt.id, bt.teacher_id, bt.target_exam, COALESCE(t.user_id, v_admin) AS teacher_user
      FROM public.batches bt LEFT JOIN public.teachers t ON t.id = bt.teacher_id
     WHERE bt.institute_id = v_inst
  LOOP
    v_subjects := ARRAY[v_phy, v_chem, CASE WHEN COALESCE(b.target_exam, '') ILIKE '%JEE%' THEN v_math ELSE v_bio END];
    v_titles   := ARRAY['Physics', 'Chemistry', CASE WHEN COALESCE(b.target_exam, '') ILIKE '%JEE%' THEN 'Mathematics' ELSE 'Biology' END];

    -- Attendance: last 60 days, Monday to Saturday. Each student has a steady rate (68-95%).
    FOR st IN SELECT bs.student_id FROM public.batch_students bs WHERE bs.batch_id = b.id AND bs.status = 'enrolled' LOOP
      v_rate := 68 + abs(hashtext('rate' || st.student_id::text)) % 28;
      FOR d IN
        SELECT g::date FROM generate_series(CURRENT_DATE - 60, CURRENT_DATE - 1, INTERVAL '1 day') g
         WHERE EXTRACT(ISODOW FROM g) < 7
      LOOP
        INSERT INTO public.attendance (institute_id, batch_id, student_id, date, status, marked_by)
        VALUES (
          v_inst, b.id, st.student_id, d,
          CASE WHEN abs(hashtext(st.student_id::text || d::text)) % 100 < v_rate THEN 'P'
               WHEN abs(hashtext(d::text || st.student_id::text)) % 3 = 0 THEN 'L'
               ELSE 'A' END,
          b.teacher_user)
        ON CONFLICT (batch_id, student_id, date) DO NOTHING;
      END LOOP;
    END LOOP;

    -- Weekly tests: 9 over the last ~3 months, rotating subjects, with results for everyone.
    FOR n IN 1..9 LOOP
      v_exam := md5('acadly-demo-exam-' || b.id || '-' || n)::uuid;
      INSERT INTO public.examinations (id, institute_id, batch_id, subject_id, title, exam_date, max_marks, passing_marks, syllabus, is_published)
      VALUES (v_exam, v_inst, b.id, v_subjects[(n - 1) % 3 + 1],
              v_titles[(n - 1) % 3 + 1] || ' weekly test ' || ((n - 1) / 3 + 1),
              CURRENT_DATE - (90 - n * 9), 100, 33, NULL, TRUE)
      ON CONFLICT (id) DO NOTHING;

      FOR st IN SELECT bs.student_id FROM public.batch_students bs WHERE bs.batch_id = b.id AND bs.status = 'enrolled' LOOP
        v_ability := 52 + abs(hashtext('ability' || st.student_id::text)) % 38;            -- 52..89
        v_absent  := abs(hashtext('absent' || v_exam::text || st.student_id::text)) % 25 = 0;
        v_marks   := CASE WHEN v_absent THEN 0 ELSE
                       LEAST(98, GREATEST(18, v_ability + n - 5 + abs(hashtext(v_exam::text || st.student_id::text)) % 21 - 10)) END;
        INSERT INTO public.results (institute_id, examination_id, student_id, marks_obtained, percentage, is_absent, grade, remarks, recorded_by)
        VALUES (v_inst, v_exam, st.student_id, v_marks, v_marks, v_absent,
                CASE WHEN v_absent THEN 'AB' WHEN v_marks >= 90 THEN 'A+' WHEN v_marks >= 80 THEN 'A'
                     WHEN v_marks >= 70 THEN 'B+' WHEN v_marks >= 60 THEN 'B' WHEN v_marks >= 45 THEN 'C' ELSE 'D' END,
                CASE WHEN v_absent THEN 'Absent' WHEN v_marks >= 85 THEN 'Excellent work.'
                     WHEN v_marks < 50 THEN 'Revise this chapter and retry the DPP.' ELSE NULL END,
                b.teacher_user)
        ON CONFLICT (examination_id, student_id) DO NOTHING;
      END LOOP;
    END LOOP;

    -- Homework: 6 DPPs. 4 past due (3 graded, 1 waiting to be graded), 2 upcoming.
    FOR n IN 1..6 LOOP
      v_asg := md5('acadly-demo-asg-' || b.id || '-' || n)::uuid;
      INSERT INTO public.assignments (id, institute_id, batch_id, teacher_id, subject_id, created_by, title, subject, instructions, type, due_date, max_marks, total_marks)
      VALUES (v_asg, v_inst, b.id, b.teacher_id, v_subjects[(n - 1) % 3 + 1], b.teacher_user,
              'DPP ' || n || ' - ' || v_titles[(n - 1) % 3 + 1],
              v_titles[(n - 1) % 3 + 1],
              'Solve all questions. Show your working for full marks.',
              'file', NOW() + ((n * 5 - 22) || ' days')::interval, 20, 20)
      ON CONFLICT (id) DO NOTHING;

      IF n <= 4 THEN
        FOR st IN SELECT bs.student_id FROM public.batch_students bs WHERE bs.batch_id = b.id AND bs.status = 'enrolled' LOOP
          CONTINUE WHEN abs(hashtext('submit' || v_asg::text || st.student_id::text)) % 10 >= 8;  -- ~80% submit
          v_marks := 9 + abs(hashtext('dpp' || v_asg::text || st.student_id::text)) % 12;          -- 9..20
          INSERT INTO public.submissions (institute_id, assignment_id, student_id, submission_text, status, marks_obtained, score, feedback, graded_by, submitted_at, graded_at)
          VALUES (v_inst, v_asg, st.student_id, 'Solutions attached.',
                  CASE WHEN n <= 3 THEN 'graded' ELSE 'submitted' END,
                  CASE WHEN n <= 3 THEN v_marks END,
                  CASE WHEN n <= 3 THEN v_marks END,
                  CASE WHEN n <= 3 AND v_marks >= 17 THEN 'Neat and complete.'
                       WHEN n <= 3 AND v_marks < 12 THEN 'Check your units in Q3 and Q5.' END,
                  CASE WHEN n <= 3 THEN b.teacher_user END,
                  NOW() + ((n * 5 - 23) || ' days')::interval,
                  CASE WHEN n <= 3 THEN NOW() + ((n * 5 - 21) || ' days')::interval END)
          ON CONFLICT (assignment_id, student_id) DO NOTHING;
        END LOOP;
      END IF;
    END LOOP;

    -- Announcements
    INSERT INTO public.announcements (id, institute_id, batch_id, author_id, title, content, priority, created_at) VALUES
      (md5('acadly-demo-ann-' || b.id || '-1')::uuid, v_inst, b.id, b.teacher_user,
       'Test on Saturday', 'Weekly test this Saturday at 9:00 AM. Syllabus: last two chapters.', 'high', NOW() - INTERVAL '1 day'),
      (md5('acadly-demo-ann-' || b.id || '-2')::uuid, v_inst, b.id, b.teacher_user,
       'Extra doubt class', 'Doubt class on Sunday 11 AM in Seminar Room 3. Bring your DPP questions.', 'normal', NOW() - INTERVAL '3 days'),
      (md5('acadly-demo-ann-' || b.id || '-3')::uuid, v_inst, b.id, b.teacher_user,
       'Notes uploaded', 'Formula sheet for this chapter is in the Library tab.', 'normal', NOW() - INTERVAL '6 days')
    ON CONFLICT (id) DO NOTHING;
  END LOOP;

  -- Ranks per test (1 = highest marks); absent students are not ranked.
  UPDATE public.results r SET batch_rank = x.rnk
    FROM (SELECT r2.id, RANK() OVER (PARTITION BY r2.examination_id ORDER BY r2.marks_obtained DESC) AS rnk
            FROM public.results r2 WHERE r2.institute_id = v_inst AND NOT r2.is_absent) x
   WHERE r.id = x.id;

  -- Fees: monthly tuition for the last 3 months. Older months are paid; about a third
  -- of students still owe this month.
  INSERT INTO public.fee_plans (id, institute_id, name, amount, total_amount, frequency, description)
  VALUES (md5('acadly-demo-plan-monthly')::uuid, v_inst, 'Monthly tuition', 3500, 3500, 'monthly', 'Classes, weekly tests and doubt sessions')
  ON CONFLICT (id) DO NOTHING;

  FOR st IN SELECT s.id FROM public.students s WHERE s.institute_id = v_inst AND NOT s.is_archived LOOP
    FOR m IN 0..2 LOOP
      v_month := (date_trunc('month', CURRENT_DATE) - (m || ' months')::interval)::date;
      v_fee   := md5('acadly-demo-fee-' || st.id || '-' || m)::uuid;
      v_paid  := m > 0 OR abs(hashtext('fee' || st.id::text)) % 3 <> 0;
      INSERT INTO public.student_fees (id, institute_id, student_id, fee_plan_id, title, total_amount, paid_amount, pending_amount, discount_amount, net_payable, status, due_date)
      VALUES (v_fee, v_inst, st.id, md5('acadly-demo-plan-monthly')::uuid,
              'Tuition - ' || to_char(v_month, 'Mon YYYY'), 3500,
              CASE WHEN v_paid THEN 3500 ELSE 0 END,
              CASE WHEN v_paid THEN 0 ELSE 3500 END, 0, 3500,
              CASE WHEN v_paid THEN 'paid' WHEN v_month + 9 < CURRENT_DATE THEN 'overdue' ELSE 'pending' END,
              v_month + 9)
      ON CONFLICT (id) DO NOTHING;
      IF v_paid THEN
        INSERT INTO public.payments (institute_id, student_fee_id, student_id, amount, payment_mode, payment_method, receipt_number, status, notes, paid_at)
        VALUES (v_inst, v_fee, st.id, 3500, 'upi', 'upi',
                'APX-' || upper(substr(md5('rcpt' || v_fee::text), 1, 10)), 'paid',
                'Monthly tuition', v_month + 4 + abs(hashtext('day' || v_fee::text)) % 5)
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;

  -- Doubts board
  FOR k IN 1..3 LOOP
    v_post := md5('acadly-demo-post-' || k)::uuid;
    INSERT INTO public.community_posts (id, institute_id, subject_id, author_id, title, content, upvotes_count, is_resolved, created_at)
    VALUES (v_post, v_inst,
            (ARRAY[v_chem, v_math, v_phy])[k],
            (ARRAY[v_kabir, v_zoya, v_amelia])[k],
            (ARRAY['Why is SN1 faster for tertiary carbocations?',
                   'How do I know when to use integration by parts?',
                   'Is friction always opposite to motion?'])[k],
            (ARRAY['In the last class we saw tertiary halides go SN1 easily. Is it only because of carbocation stability or also steric hindrance?',
                   'I keep picking the wrong u and dv. Is there a rule to choose them quickly in exams?',
                   'For a block on an accelerating truck, friction seems to act forward. Does that break the rule?'])[k],
            (ARRAY[7, 12, 9])[k], k <> 2, NOW() - (k * 2 || ' days')::interval)
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
  INSERT INTO public.community_comments (institute_id, post_id, author_id, comment_text, is_teacher_verified_answer)
  SELECT v_inst, md5('acadly-demo-post-1')::uuid, v_joshi,
         'Both, but stability wins: a tertiary carbocation is stabilised by hyperconjugation, and the crowded carbon also blocks a backside SN2 attack.', TRUE
   WHERE NOT EXISTS (SELECT 1 FROM public.community_comments WHERE post_id = md5('acadly-demo-post-1')::uuid);
  INSERT INTO public.community_comments (institute_id, post_id, author_id, comment_text, is_teacher_verified_answer)
  SELECT v_inst, md5('acadly-demo-post-3')::uuid, v_joshi,
         'Friction opposes relative motion between the surfaces, not motion itself. The block tends to slip backwards relative to the truck, so friction acts forward.', TRUE
   WHERE NOT EXISTS (SELECT 1 FROM public.community_comments WHERE post_id = md5('acadly-demo-post-3')::uuid);

  -- Notifications for each role
  INSERT INTO public.notifications (id, institute_id, user_id, recipient_id, recipient_role, title, message, body, type, created_at) VALUES
    (md5('acadly-demo-n1')::uuid, v_inst, v_amelia, v_amelia, 'student', 'New DPP posted', 'DPP 5 is due in 3 days.', 'DPP 5 is due in 3 days.', 'assignment', NOW() - INTERVAL '2 hours'),
    (md5('acadly-demo-n2')::uuid, v_inst, v_amelia, v_amelia, 'student', 'Test results are out', 'Your latest weekly test has been marked.', 'Your latest weekly test has been marked.', 'result', NOW() - INTERVAL '1 day'),
    (md5('acadly-demo-n3')::uuid, v_inst, v_parent, v_parent, 'parent', 'Fee reminder', 'This month''s tuition is due on the 10th.', 'This month''s tuition is due on the 10th.', 'fee', NOW() - INTERVAL '5 hours'),
    (md5('acadly-demo-n4')::uuid, v_inst, v_joshi, v_joshi, 'teacher', 'Submissions waiting', 'Students submitted DPP 4. Grade them from Publish.', 'Students submitted DPP 4. Grade them from Publish.', 'assignment', NOW() - INTERVAL '3 hours'),
    (md5('acadly-demo-n5')::uuid, v_inst, v_admin, v_admin, 'admin', 'New join requests', '2 students asked to join. Review them in Verify students.', '2 students asked to join. Review them in Verify students.', 'admission', NOW() - INTERVAL '1 hour')
  ON CONFLICT (id) DO NOTHING;

  -- Two applicants waiting for approval (sign-in password is the same demo password)
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
                          created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change,
                          phone_change, phone_change_token, email_change_token_current, reauthentication_token)
  VALUES
    (v_app1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'applicant.priya@acadly.com', v_pw, NOW(),
     '{"provider":"email","providers":["email"],"role":"student"}', '{"full_name":"Priya Nair"}', NOW(), NOW(), '', '', '', '', '', '', '', ''),
    (v_app2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'applicant.dev@acadly.com', v_pw, NOW(),
     '{"provider":"email","providers":["email"],"role":"student"}', '{"full_name":"Dev Malhotra"}', NOW(), NOW(), '', '', '', '', '', '', '', '')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at) VALUES
    (v_app1, v_app1, json_build_object('sub', v_app1, 'email', 'applicant.priya@acadly.com'), 'email', v_app1::text, NOW(), NOW(), NOW()),
    (v_app2, v_app2, json_build_object('sub', v_app2, 'email', 'applicant.dev@acadly.com'), 'email', v_app2::text, NOW(), NOW(), NOW())
  ON CONFLICT (provider, provider_id) DO NOTHING;
  -- The auth trigger creates profiles; make sure they exist even if it is disabled.
  INSERT INTO public.profiles (id, email, full_name, default_role) VALUES
    (v_app1, 'applicant.priya@acadly.com', 'Priya Nair', 'student'),
    (v_app2, 'applicant.dev@acadly.com', 'Dev Malhotra', 'student')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.join_requests (id, institute_id, teacher_id, user_id, requested_role, code_used, teacher_code, target_type, student_details, status, applied_at, created_at)
  VALUES
    (md5('acadly-demo-jr-1')::uuid, v_inst, '22222222-2222-2222-2222-222222222201', v_app1, 'student', 'APEX2026', 'APEX2026', 'institute',
     jsonb_build_object('fullName', 'Priya Nair', 'grade', 'Class 12', 'board', 'CBSE', 'targetExam', 'JEE Main 2027',
                        'school', 'Kendriya Vidyalaya No. 2', 'previousPercentage', '88%', 'guardianPhone', '+91 98290 55102',
                        'weakSubjects', jsonb_build_array('Organic Chemistry')),
     'pending', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours'),
    (md5('acadly-demo-jr-2')::uuid, v_inst, '22222222-2222-2222-2222-222222222201', v_app2, 'student', 'APEX2026', 'APEX2026', 'institute',
     jsonb_build_object('fullName', 'Dev Malhotra', 'grade', 'Class 11', 'board', 'ICSE', 'targetExam', 'NEET 2028',
                        'school', 'St. Paul''s School', 'previousPercentage', '91%', 'guardianPhone', '+91 98290 55188',
                        'weakSubjects', jsonb_build_array('Rotational Motion', 'Calculus')),
     'pending', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Acadly demo data loaded.';
END $$;

COMMIT;

-- Quick check (optional): run this on its own afterwards
-- SELECT p.full_name, v.batch_name, v.attendance_pct, v.latest_rank, v.avg_percentage, v.fee_status
--   FROM public.student_roster_stats v JOIN public.students s ON s.id = v.student_id
--   JOIN public.profiles p ON p.id = s.user_id ORDER BY v.latest_rank NULLS LAST;
