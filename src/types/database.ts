// ==============================================================================
// ACADLY - COMPLETE DATABASE TYPE DEFINITIONS
// Canonical typing aligned with 0001_core -> 0006_storage migration schema.
// ==============================================================================

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type MemberStatus = 'active' | 'suspended' | 'pending';
export type AssignmentType = 'file' | 'quiz';
export type FeeStatus = 'paid' | 'partial' | 'pending' | 'overdue';
export type PaymentMode = 'razorpay' | 'upi' | 'cash' | 'bank_transfer' | 'cheque' | 'bank';
export type PaymentStatus = 'paid' | 'success' | 'pending' | 'failed' | 'refunded';

// ------------------------------------------------------------------------------
// Core Entities (0001_core.sql)
// ------------------------------------------------------------------------------

export interface Institute {
  id: string;
  name: string;
  code: string;
  center_code: string;
  invite_code?: string;
  account_type?: 'coaching_center' | 'individual_teacher';
  city: string;
  campus_name?: string;
  tagline?: string;
  slug?: string;
  join_code?: string;
  address?: string;
  state?: string;
  pincode?: string;
  is_active?: boolean;
  contact_email?: string;
  contact_phone?: string;
  logo_url?: string;
  banner_url?: string;
  phone?: string;
  email?: string;
  owner_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  avatar_url?: string;
  default_role: UserRole;
  expo_push_token?: string;
  is_deleted?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface InstituteMember {
  id: string;
  institute_id: string;
  user_id: string;
  role: UserRole;
  status: MemberStatus;
  verification_status?: VerificationStatus;
  verified_by?: string;
  verified_at?: string;
  joined_at?: string;
  created_at: string;
  institute?: Institute;
  profile?: Profile;
}

export interface Teacher {
  id: string;
  institute_id: string;
  user_id: string;
  teacher_code: string;
  mode?: 'solo' | 'coaching_faculty';
  qualification: string;
  specialization: string;
  specialization_subjects?: string[];
  employee_code?: string;
  experience_years?: number;
  monthly_fee_rate?: number;
  bio?: string;
  achievements?: string;
  demo_video_url?: string;
  joining_date?: string;
  created_at: string;
  profile?: Profile;
}

export interface Student {
  id: string;
  institute_id: string;
  user_id: string;
  roll_number: string;
  admission_number?: string;
  parent_link_code: string;
  class_grade: string;
  grade?: string;
  board?: string;
  target_exam: string;
  school_or_college?: string;
  school_name?: string;
  medium?: string;
  dob?: string;
  blood_group?: string;
  address?: string;
  guardian_name?: string;
  guardian_phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  previous_percentage?: string;
  weak_topics?: string[];
  weak_subjects?: string[];
  admission_date?: string;
  is_archived?: boolean;
  parent_id?: string;
  created_at: string;
  profile?: Profile;
}

export interface Parent {
  id: string;
  institute_id: string;
  user_id: string;
  phone?: string;
  occupation?: string;
  alternate_phone?: string;
  relationship_type?: string;
  created_at: string;
  profile?: Profile;
  students?: Student[];
}

export interface ParentStudent {
  id: string;
  institute_id: string;
  parent_id: string;
  student_id: string;
  relationship: string;
  created_at: string;
}

export interface Subject {
  id: string;
  institute_id: string;
  name: string;
  code: string;
  color_hex?: string;
  description?: string;
  created_at: string;
}

export interface Batch {
  id: string;
  institute_id: string;
  name: string;
  subject: string;
  subject_id?: string;
  teacher_id?: string;
  target_exam: string;
  room_number: string;
  start_time: string;
  end_time: string;
  status: 'in_progress' | 'upcoming' | 'completed' | 'archived';
  academic_year?: string;
  start_date?: string;
  end_date?: string;
  is_archived?: boolean;
  student_count: number;
  present_count?: number;
  assigned_teacher_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface BatchTeacher {
  id: string;
  institute_id: string;
  batch_id: string;
  teacher_id: string;
  subject_id?: string;
  created_at: string;
}

export interface BatchStudent {
  id: string;
  institute_id: string;
  batch_id: string;
  student_id: string;
  status: string;
  enrolled_at: string;
}

export interface JoinRequest {
  id: string;
  institute_id: string;
  teacher_id?: string;
  user_id: string;
  requested_role: UserRole;
  code_used: string;
  student_extra_details_json?: Record<string, any>;
  status: VerificationStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

// ------------------------------------------------------------------------------
// Academic Entities (0002_academic.sql)
// ------------------------------------------------------------------------------

export interface AttendanceRecord {
  id: string;
  institute_id: string;
  batch_id: string;
  student_id: string;
  student_name?: string;
  roll_number: string;
  date: string;
  status: 'P' | 'A' | 'L' | 'E';
  remarks?: string;
  marked_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface AttendanceAuditLog {
  id: string;
  attendance_id?: string;
  batch_id: string;
  student_id: string;
  previous_status: string;
  new_status: string;
  changed_by: string;
  reason: string;
  changed_at: string;
}

export interface Lecture {
  id: string;
  institute_id: string;
  batch_id: string;
  subject_id?: string;
  uploaded_by?: string;
  title: string;
  description?: string;
  subject: string;
  provider: 'youtube' | 'direct' | 'bunny';
  video_id_or_url: string;
  duration_minutes: number;
  duration_formatted?: string;
  duration_seconds?: number;
  thumbnail_url?: string;
  faculty_name: string;
  lecture_number?: number;
  is_live?: boolean;
  is_published?: boolean;
  created_at: string;
}

export interface StudyMaterial {
  id: string;
  institute_id: string;
  batch_id?: string;
  subject_id?: string;
  uploaded_by: string;
  category?: 'notes' | 'formula_sheet' | 'pyq' | 'book' | 'dpp' | 'other' | string;
  title: string;
  subject: string;
  description?: string;
  file_url: string;
  file_type: 'pdf' | 'doc' | 'sheet' | string;
  file_size?: string;
  file_size_formatted?: string;
  file_size_bytes?: number;
  download_count?: number;
  page_count?: number;
  created_at: string;
}

export interface AssignmentQuestion {
  id: string;
  prompt: string;
  options?: string[];
  correct_answer?: string;
  marks: number;
}

export interface Assignment {
  id: string;
  institute_id: string;
  batch_id: string;
  teacher_id?: string;
  subject_id?: string;
  created_by?: string;
  title: string;
  subject: string;
  instructions: string;
  description?: string;
  type?: AssignmentType;
  questions?: AssignmentQuestion[] | Record<string, any>;
  question_paper_url?: string;
  due_date: string;
  due_label: string;
  due_date_formatted?: string;
  total_marks: number;
  max_marks?: number;
  question_count: number;
  attachment_url?: string;
  assigned_by_name?: string;
  created_at: string;
  submission_status?: 'pending' | 'submitted' | 'graded';
  status?: 'pending' | 'submitted' | 'graded';
  submission_count?: number;
  total_students?: number;
}

export interface Submission {
  id: string;
  institute_id?: string;
  assignment_id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  submission_text?: string;
  answers?: Record<string, any>;
  score?: number;
  file_url?: string;
  file_name?: string;
  status: 'submitted' | 'graded' | 'late' | 'resubmit';
  marks_obtained?: number;
  feedback?: string;
  graded_by?: string;
  submitted_at: string;
  submitted_at_formatted?: string;
  graded_at?: string;
}

export interface Examination {
  id: string;
  institute_id: string;
  batch_id: string;
  subject_id?: string;
  title: string;
  exam_date: string;
  max_marks: number;
  passing_marks: number;
  batch_average_marks?: number;
  batch_highest_marks?: number;
  syllabus?: string;
  is_published?: boolean;
  created_at: string;
}

export interface ExamResult {
  id: string;
  institute_id: string;
  examination_id: string;
  student_id: string;
  marks_obtained: number;
  percentage: number;
  batch_rank?: number;
  grade?: string;
  is_absent: boolean;
  remarks?: string;
  recorded_by?: string;
  created_at: string;
}

// ------------------------------------------------------------------------------
// Community & Chat Entities (0003_community_chat.sql)
// ------------------------------------------------------------------------------

export interface ChatRoom {
  id: string;
  institute_id: string;
  batch_id?: string;
  type: 'batch_group' | 'direct_doubt';
  teacher_id: string;
  student_id?: string;
  name: string;
  last_message_text?: string;
  last_message_at?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_role: UserRole;
  message_text?: string;
  attachment_url?: string;
  attachment_type?: 'pdf' | 'image' | 'file';
  attachment_name?: string;
  is_pinned: boolean;
  is_read: boolean;
  created_at: string;
}

export interface CommunityPost {
  id: string;
  institute_id: string;
  batch_id?: string;
  subject_id?: string;
  author_id: string;
  title: string;
  content: string;
  pdf_or_file_url?: string;
  image_url?: string;
  upvotes_count: number;
  is_pinned: boolean;
  is_resolved: boolean;
  created_at: string;
}

export interface CommunityComment {
  id: string;
  institute_id: string;
  post_id: string;
  author_id: string;
  comment_text: string;
  attachment_url?: string;
  is_teacher_verified_answer: boolean;
  created_at: string;
}

export interface CommunityUpvote {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

// ------------------------------------------------------------------------------
// Fees, Payments & Notifications (0004_fees.sql)
// ------------------------------------------------------------------------------

export interface FeePlan {
  id: string;
  institute_id: string;
  batch_id?: string;
  name: string;
  amount: number;
  total_amount?: number;
  frequency: 'annual' | 'term' | 'monthly' | 'one_time';
  description?: string;
  created_at: string;
}

export interface StudentFee {
  id: string;
  institute_id: string;
  student_id: string;
  fee_plan_id?: string;
  student_name?: string;
  roll_number?: string;
  title: string;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  discount_amount?: number;
  net_payable?: number;
  status: FeeStatus;
  due_date: string;
  due_label?: string;
  created_at: string;
  updated_at?: string;
}

export interface PaymentRecord {
  id: string;
  institute_id: string;
  student_fee_id: string;
  student_id: string;
  student_name?: string;
  amount: number;
  payment_mode: PaymentMode;
  payment_method?: string;
  gst_amount?: number;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  receipt_number: string;
  status: PaymentStatus;
  notes?: string;
  recorded_by?: string;
  paid_at: string;
  created_at?: string;
}

export interface Receipt {
  id: string;
  institute_id: string;
  payment_id: string;
  receipt_number: string;
  student_id: string;
  taxable_amount: number;
  gst_rate: number;
  gst_amount: number;
  total_amount: number;
  signed_hash?: string;
  generated_at: string;
}

export interface InAppNotification {
  id: string;
  institute_id: string;
  user_id?: string;
  recipient_id?: string;
  recipient_role?: UserRole | 'all';
  title: string;
  message: string;
  body?: string;
  type: 'attendance' | 'fee' | 'lecture' | 'assignment' | 'broadcast' | 'fee_reminder' | 'general' | string;
  data?: Record<string, any>;
  deep_link_data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform?: string;
  created_at: string;
  updated_at?: string;
}

export interface AnalyticsSummary {
  enrolled_students: number;
  faculty_count: number;
  active_batches: number;
  today_attendance_rate: number;
  present_count: number;
  absent_count: number;
  total_collected_amount: number;
  total_pending_dues: number;
  overdue_students_count: number;
}

export interface Student360Profile {
  id: string;
  name: string;
  rollNumber: string;
  grade: string;
  board: string;
  school: string;
  targetExam: string;
  batchName: string;
  parentLinkCode: string;
  guardianName: string;
  guardianPhone: string;
  address: string;
  bloodGroup: string;
  previousPercentage: string;
  weakSubjects: string[];
  overallAttendance: number;
  feeStatus: string;
  rank: number;
  percentile: number;
  teacherRemarks: string[];
}
