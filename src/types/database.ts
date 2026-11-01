export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export interface Institute {
  id: string;
  name: string;
  code: string;
  center_code: string;
  city: string;
  campus_name: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  avatar_url?: string;
  default_role: UserRole;
  created_at: string;
}

export interface InstituteMember {
  id: string;
  institute_id: string;
  user_id: string;
  role: UserRole;
  status: 'active' | 'suspended' | 'pending';
  created_at: string;
  institute?: Institute;
  profile?: Profile;
}

export interface Teacher {
  id: string;
  institute_id: string;
  user_id: string;
  qualification: string;
  specialization: string;
  employee_code: string;
  bio?: string;
  profile?: Profile;
}

export interface Student {
  id: string;
  institute_id: string;
  user_id: string;
  roll_number: string;
  class_grade: string;
  target_exam: string;
  parent_id?: string;
  profile?: Profile;
}

export interface Parent {
  id: string;
  institute_id: string;
  user_id: string;
  occupation?: string;
  profile?: Profile;
  students?: Student[];
}

export interface Batch {
  id: string;
  institute_id: string;
  name: string;
  subject: string;
  target_exam: string;
  room_number: string;
  start_time: string;
  end_time: string;
  status: 'in_progress' | 'upcoming' | 'completed' | 'archived';
  student_count: number;
  present_count?: number;
  assigned_teacher_name?: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  institute_id: string;
  batch_id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  date: string;
  status: 'P' | 'A' | 'L' | 'E';
  remarks?: string;
  marked_by?: string;
  created_at: string;
}

export interface StudyMaterial {
  id: string;
  institute_id: string;
  batch_id?: string;
  title: string;
  subject: string;
  description?: string;
  file_url: string;
  file_type: 'pdf' | 'doc' | 'sheet';
  file_size_formatted: string;
  page_count?: number;
  uploaded_by: string;
  created_at: string;
}

export interface Lecture {
  id: string;
  institute_id: string;
  batch_id: string;
  title: string;
  subject: string;
  provider: 'youtube' | 'direct' | 'bunny';
  video_id_or_url: string;
  duration_minutes: number;
  duration_formatted: string;
  thumbnail_url?: string;
  faculty_name: string;
  lecture_number?: number;
  is_live?: boolean;
  created_at: string;
}

export interface Assignment {
  id: string;
  institute_id: string;
  batch_id: string;
  title: string;
  subject: string;
  instructions: string;
  due_date: string;
  due_label: string;
  total_marks: number;
  question_count: number;
  attachment_url?: string;
  created_by: string;
  created_at: string;
  submission_status?: 'pending' | 'submitted' | 'graded';
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  submission_text?: string;
  file_url?: string;
  status: 'submitted' | 'graded' | 'late';
  marks_obtained?: number;
  feedback?: string;
  submitted_at: string;
}
