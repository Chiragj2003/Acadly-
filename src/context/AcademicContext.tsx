import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import {
  type AttendanceRecord,
  type StudyMaterial,
  type Lecture,
  type Assignment,
  type Submission,
} from '@/types/database';

export interface StudentExtraDetails {
  fullName: string;
  grade: string;
  board: string;
  targetExam: string;
  school: string;
  previousPercentage: string;
  weakSubjects: string[];
  guardianName: string;
  guardianPhone: string;
  bloodGroup: string;
  address?: string;
}

export interface JoinRequest {
  id: string;
  studentDetails: StudentExtraDetails;
  codeUsed: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  matchedTargetName: string;
  matchedType: 'individual_teacher' | 'coaching_center';
  assignedBatch?: string;
  assignedFeePlan?: string;
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

export interface EnrolledTeacherItem {
  id: string;
  name: string;
  subject: string;
  teacherCode: string;
  instituteName?: string;
  batchName: string;
  schedule: string;
  attendanceRate: number;
}

export interface CommunityComment {
  id: string;
  author: string;
  role: 'student' | 'teacher';
  text: string;
  createdAt: string;
  isTeacherVerified: boolean;
}

export interface CommunityPost {
  id: string;
  author: string;
  role: 'student' | 'teacher';
  avatarEmoji: string;
  timeAgo: string;
  subject: string;
  title: string;
  content: string;
  upvotes: number;
  hasTeacherAnswer: boolean;
  teacherName?: string;
  teacherVerifiedText?: string;
  attachmentName?: string;
  attachmentUri?: string;
  comments: CommunityComment[];
}

export interface PDFMaterialItem {
  id: string;
  subject: string;
  emoji: string;
  title: string;
  subtitle: string;
  category: 'notes' | 'formula_sheet' | 'pyq' | 'dpp';
  author: string;
  fileSizeBytes: string;
  downloadUrl?: string;
  createdAt: string;
}

export interface TeacherProfile {
  fullName: string;
  qualification: string;
  specializationSubjects: string[];
  experienceYears: number;
  bio: string;
  achievements: string;
  monthlyFeeRate: number;
  teacherCode: string;
}

export interface CoachingProfile {
  name: string;
  city: string;
  subjectsOffered: string[];
  directorName: string;
  phone: string;
  inviteCode: string;
}

export interface AcademicContextType {
  // Attendance
  attendanceRecords: AttendanceRecord[];
  markAttendance: (studentId: string, status: 'P' | 'A' | 'L', remarks?: string) => Promise<void>;
  correctAttendance: (recordId: string, newStatus: 'P' | 'A' | 'L', reason: string) => Promise<void>;
  markBatchAllPresent: (batchId: string) => Promise<void>;

  // Study Materials & PDFs
  materials: StudyMaterial[];
  pdfMaterials: PDFMaterialItem[];
  uploadMaterial: (data: Omit<StudyMaterial, 'id' | 'institute_id' | 'created_at'>) => Promise<void>;
  uploadPDFMaterial: (title: string, subject: string, category: 'notes' | 'formula_sheet' | 'pyq' | 'dpp', fileName: string, fileSizeBytes?: string) => Promise<void>;
  downloadMaterial: (id: string) => Promise<void>;

  // Video Lectures
  lectures: Lecture[];
  activeLecture: Lecture | null;
  openPlayer: (lecture: Lecture) => void;
  closePlayer: () => void;
  addLecture: (data: Omit<Lecture, 'id' | 'institute_id' | 'created_at'>) => Promise<void>;
  offlineLectureIds: string[];
  toggleOfflineDownload: (lectureId: string) => void;

  // Multi-Teacher Support for Students
  enrolledTeachers: EnrolledTeacherItem[];
  activeTeacherId: string;
  switchActiveTeacher: (teacherId: string) => void;
  addEnrolledTeacher: (teacher: EnrolledTeacherItem) => void;

  // Teacher Dual Mode (Solo Tutor vs Coaching Faculty)
  teacherMode: 'solo' | 'coaching_faculty';
  setTeacherMode: (mode: 'solo' | 'coaching_faculty') => void;
  linkedCoachingCode?: string;
  linkToCoachingCenter: (code: string) => Promise<{ success: boolean; instituteName?: string; error?: string }>;

  // Assignments & Homework
  assignments: Assignment[];
  submissions: Submission[];
  createAssignment: (data: Omit<Assignment, 'id' | 'institute_id' | 'created_at'>) => Promise<void>;
  submitAssignment: (assignmentId: string, text: string, fileName?: string, fileUri?: string) => Promise<void>;
  gradeSubmission: (submissionId: string, marks: number, feedback: string) => Promise<void>;

  // Teacher Code & Join Requests Gate
  joinRequests: JoinRequest[];
  studentJoinStatus: 'none' | 'pending' | 'approved' | 'rejected';
  activeJoinRequest: JoinRequest | null;
  submitJoinRequest: (details: StudentExtraDetails, code: string) => Promise<{ success: boolean; targetName: string; error?: string }>;
  approveJoinRequest: (requestId: string, batchId: string, feePlan: string) => Promise<void>;
  rejectJoinRequest: (requestId: string, reason?: string) => Promise<void>;
  simulateTeacherApproval: () => Promise<void>;

  // 360 Student Profiles
  studentsRoster: Student360Profile[];
  getStudentById: (studentId: string) => Student360Profile | undefined;
  updateStudentRemarks: (studentId: string, remark: string) => void;
  updateStudentFeeStatus: (studentId: string, status: string) => void;

  // Comparison & Assessment Benchmarking
  comparisonChartData: {
    testName: string;
    studentScore: number;
    batchAvg: number;
    batchTopper: number;
    maxScore: number;
  }[];
  recordTestMarks: (
    testName: string,
    subject: string,
    maxScore: number,
    marks: { studentId: string; score: number }[]
  ) => Promise<void>;

  // Community Feed
  communityPosts: CommunityPost[];
  addCommunityPost: (title: string, content: string, subject: string, attachmentName?: string, attachmentUri?: string) => Promise<void>;
  upvoteCommunityPost: (postId: string) => void;
  addCommunityComment: (postId: string, text: string, isTeacherVerified?: boolean) => void;
  verifyCommunityComment: (postId: string, commentId: string) => void;

  // Teacher & Coaching Profiles
  teacherProfile: TeacherProfile;
  setTeacherProfile: React.Dispatch<React.SetStateAction<TeacherProfile>>;
  coachingProfile: CoachingProfile;
  setCoachingProfile: React.Dispatch<React.SetStateAction<CoachingProfile>>;
}

const DEFAULT_TEACHER_PROFILE: TeacherProfile = {
  fullName: 'Prof. Vikram Joshi',
  qualification: 'M.Sc Physics (IIT Bombay), 12+ Yrs Exp',
  specializationSubjects: ['Physics', 'Calculus', 'Mechanics'],
  experienceYears: 12.5,
  bio: 'Passionate about turning complex physics equations into beautiful intuitive stories.',
  achievements: 'Mentored 40+ AIR Top 500 students in JEE Advanced.',
  monthlyFeeRate: 3500,
  teacherCode: 'JOSHI-MATH-89',
};

const DEFAULT_COACHING_PROFILE: CoachingProfile = {
  name: 'Apex Institute',
  city: 'Kota & Delhi Central',
  subjectsOffered: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  directorName: 'Director Sharma',
  phone: '+91 98230 11223',
  inviteCode: 'APEX2026',
};

const INITIAL_STUDENTS_ROSTER: Student360Profile[] = [
  {
    id: 'stud-amelia',
    name: 'Amelia Sharma',
    rollNumber: '#01',
    grade: 'Class 12 Science',
    board: 'CBSE',
    school: 'Delhi Public School (R.K. Puram)',
    targetExam: 'IIT-JEE 2026',
    batchName: 'Class 12 • JEE Advanced (Morning)',
    parentLinkCode: 'STU-AMELIA-902',
    guardianName: 'Rajesh Sharma (Father)',
    guardianPhone: '+91 98230 44551',
    address: 'Flat 402, Lotus Towers, Pune, Maharashtra',
    bloodGroup: 'B+',
    previousPercentage: '96.2% in Class 10',
    weakSubjects: ['Rotational Mechanics', 'Ionic Equilibrium'],
    overallAttendance: 96.4,
    feeStatus: 'Paid Full (₹45,000)',
    rank: 1,
    percentile: 98.8,
    teacherRemarks: ['Exceptionally strong in calculus.', 'Active class contributor & doubt helper.'],
  },
  {
    id: 'stud-kabir',
    name: 'Kabir Singhania',
    rollNumber: '#02',
    grade: 'Class 11 Science',
    board: 'CBSE',
    school: 'The Mother International',
    targetExam: 'IIT-JEE 2026',
    batchName: 'Class 12 • JEE Advanced (Morning)',
    parentLinkCode: 'STU-KABIR-118',
    guardianName: 'Rajesh Singhania (Father)',
    guardianPhone: '+91 98110 33442',
    address: 'B-14 Green Park, New Delhi',
    bloodGroup: 'O+',
    previousPercentage: '94.2% in Class 10',
    weakSubjects: ['Organic Chemistry', 'Vectors'],
    overallAttendance: 92.1,
    feeStatus: 'Paid Full (₹45,000)',
    rank: 5,
    percentile: 91.2,
    teacherRemarks: ['Very active in doubt sessions.', 'Consistent homework solver.'],
  },
  {
    id: 'stud-zoya',
    name: 'Zoya Khan',
    rollNumber: '#03',
    grade: 'Class 12 Pre-Medical',
    board: 'ICSE',
    school: 'St. Xavier High School',
    targetExam: 'NEET Medical 2026',
    batchName: 'NEET-UG • Target 680+ Batch',
    parentLinkCode: 'STU-ZOYA-124',
    guardianName: 'Dr. Farooq Khan (Father)',
    guardianPhone: '+91 98900 22119',
    address: '77 Hill Road, Bandra, Mumbai',
    bloodGroup: 'A+',
    previousPercentage: '97.4% in Class 10',
    weakSubjects: ['Physics Numerical Problems'],
    overallAttendance: 98.0,
    feeStatus: 'Paid Full (₹40,000)',
    rank: 2,
    percentile: 98.5,
    teacherRemarks: ['Remarkable conceptual clarity in Botany & Organic Chemistry.'],
  },
  {
    id: 'stud-aarav',
    name: 'Aarav Mehta',
    rollNumber: '#04',
    grade: 'Class 12 Science',
    board: 'CBSE',
    school: 'Modern High School (Vasant Vihar)',
    targetExam: 'IIT-JEE 2026',
    batchName: 'Class 12 • JEE Advanced (Morning)',
    parentLinkCode: 'STU-AARAV-104',
    guardianName: 'Vikram Mehta (Father)',
    guardianPhone: '+91 98200 55123',
    address: 'C-24 Defence Colony, New Delhi',
    bloodGroup: 'B+',
    previousPercentage: '91.0% in Class 10',
    weakSubjects: ['Thermodynamics', 'Probability'],
    overallAttendance: 88.5,
    feeStatus: 'Paid Full (₹45,000)',
    rank: 8,
    percentile: 87.0,
    teacherRemarks: ['Needs targeted practice on speed in numerical calculations.'],
  },
  {
    id: 'stud-ananya',
    name: 'Ananya Deshmukh',
    rollNumber: '#05',
    grade: 'Class 12 Science',
    board: 'State Board (HSC)',
    school: 'Fergusson Junior College',
    targetExam: 'IIT-JEE & MHT-CET',
    batchName: 'Class 12 • JEE Advanced (Morning)',
    parentLinkCode: 'STU-ANANYA-205',
    guardianName: 'Dr. Sanjay Deshmukh',
    guardianPhone: '+91 98220 99881',
    address: 'Prabhat Road, Pune, Maharashtra',
    bloodGroup: 'O-',
    previousPercentage: '95.6% in Class 10',
    weakSubjects: ['Complex Numbers'],
    overallAttendance: 94.7,
    feeStatus: 'Paid Full (₹45,000)',
    rank: 4,
    percentile: 93.4,
    teacherRemarks: ['Consistently top unit test scores in Coordinate Geometry.'],
  },
  {
    id: 'stud-rohan',
    name: 'Rohan Kulkarni',
    rollNumber: '#06',
    grade: 'Class 11 Science',
    board: 'CBSE',
    school: 'DAV Public School',
    targetExam: 'IIT-JEE 2026',
    batchName: 'Class 11 Foundation Batch',
    parentLinkCode: 'STU-ROHAN-306',
    guardianName: 'Sunita Kulkarni (Mother)',
    guardianPhone: '+91 98231 44502',
    address: 'Kothrud, Pune, Maharashtra',
    bloodGroup: 'AB+',
    previousPercentage: '86.4% in Class 10',
    weakSubjects: ['Newtonian Mechanics', 'Stoichiometry'],
    overallAttendance: 85.0,
    feeStatus: 'Pending Fee (₹3,500)',
    rank: 12,
    percentile: 82.1,
    teacherRemarks: ['Shows sincere curiosity, requires extra guidance on problem decomposition.'],
  },
  {
    id: 'stud-diya',
    name: 'Diya Patel',
    rollNumber: '#07',
    grade: 'Class 12 Pre-Medical',
    board: 'CBSE',
    school: 'The Heritage School',
    targetExam: 'NEET Medical 2026',
    batchName: 'NEET-UG • Target 680+ Batch',
    parentLinkCode: 'STU-DIYA-407',
    guardianName: 'Bhavin Patel (Father)',
    guardianPhone: '+91 98790 12345',
    address: 'Bodakdev, Ahmedabad, Gujarat',
    bloodGroup: 'A-',
    previousPercentage: '96.8% in Class 10',
    weakSubjects: ['Ray Optics'],
    overallAttendance: 97.2,
    feeStatus: 'Paid Full (₹40,000)',
    rank: 3,
    percentile: 96.1,
    teacherRemarks: ['Outstanding recall in Organic Synthesis & Cell Biology.'],
  },
  {
    id: 'stud-ishaan',
    name: 'Ishaan Verma',
    rollNumber: '#08',
    grade: 'Class 11 Science',
    board: 'CBSE',
    school: 'Amity International School',
    targetExam: 'IIT-JEE 2026',
    batchName: 'Class 11 Foundation Batch',
    parentLinkCode: 'STU-ISHAAN-508',
    guardianName: 'Manish Verma (Father)',
    guardianPhone: '+91 98101 23456',
    address: 'Sector 44, Noida, UP',
    bloodGroup: 'B+',
    previousPercentage: '92.0% in Class 10',
    weakSubjects: ['Permutations & Combinations'],
    overallAttendance: 91.0,
    feeStatus: 'Pending Fee (₹1,500)',
    rank: 7,
    percentile: 89.5,
    teacherRemarks: ['Strong numerical instincts, needs regular DPP submission discipline.'],
  },
];

const INITIAL_JOIN_REQUESTS: JoinRequest[] = [
  {
    id: 'req-kabir-01',
    studentDetails: {
      fullName: 'Kabir Singhania',
      grade: 'Class 11 Science',
      board: 'CBSE',
      targetExam: 'IIT-JEE 2026',
      school: 'Delhi Public School',
      previousPercentage: '94.2% in Class 10',
      weakSubjects: ['Organic Chemistry', 'Rotational Mechanics'],
      guardianName: 'Rajesh Singhania',
      guardianPhone: '+91 98110 33442',
      bloodGroup: 'O+',
      address: 'B-14 Green Park, New Delhi',
    },
    codeUsed: 'JOSHI-MATH-89',
    status: 'pending',
    appliedAt: '25 mins ago',
    matchedTargetName: 'Prof. Vikram Joshi (Physics & Math Tuition)',
    matchedType: 'individual_teacher',
  },
  {
    id: 'req-zoya-02',
    studentDetails: {
      fullName: 'Zoya Khan',
      grade: 'Class 11 Science',
      board: 'ICSE',
      targetExam: 'NEET Medical 2026',
      school: 'St. Xavier High School',
      previousPercentage: '91.8% in Class 10',
      weakSubjects: ['Physics Numerical Problems'],
      guardianName: 'Dr. Farooq Khan',
      guardianPhone: '+91 98900 22119',
      bloodGroup: 'A+',
      address: '77 Hill Road, Mumbai',
    },
    codeUsed: 'APEX2026',
    status: 'pending',
    appliedAt: '1 hour ago',
    matchedTargetName: 'Apex Institute (Medical & JEE)',
    matchedType: 'coaching_center',
  },
];

const INITIAL_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    author: 'Amelia Sharma',
    role: 'student',
    avatarEmoji: '🌸',
    timeAgo: '2h ago',
    subject: 'Physics',
    title: 'Why is electric field inside a hollow spherical conductor strictly zero?',
    content: 'In Gauss law we take a Gaussian sphere inside radius R. Since enclosed charge q=0, flux is 0. But how does charge on the outer shell cancel out the field at EVERY non-central point?',
    upvotes: 18,
    hasTeacherAnswer: true,
    teacherName: 'Prof. Vikram Joshi (Faculty)',
    teacherVerifiedText: 'Great conceptual doubt! By inverse-square law, a larger patch of surface charge further away subtends the exact same solid angle as a smaller, closer patch. Their fields cancel vectorially everywhere inside!',
    attachmentName: 'Gauss_Law_Spherical_Derivation.pdf',
    comments: [
      {
        id: 'c1',
        author: 'Prof. Vikram Joshi',
        role: 'teacher',
        text: 'Review chapter 2 page 48 in your formula sheet for the solid angle diagram.',
        createdAt: '1h ago',
        isTeacherVerified: true,
      },
      {
        id: 'c2',
        author: 'Kabir Singhania',
        role: 'student',
        text: 'That solid angle explanation finally made it click for me too! Thanks sir.',
        createdAt: '45m ago',
        isTeacherVerified: false,
      },
    ],
  },
  {
    id: 'post-2',
    author: 'Kabir Singhania',
    role: 'student',
    avatarEmoji: '🚀',
    timeAgo: '4h ago',
    subject: 'Mathematics',
    title: 'Quick trick for evaluating limits with [1^infinity] indeterminate form?',
    content: 'Whenever limit as x->a of [f(x)]^g(x) gives 1^inf, can we directly write e^lim [g(x) * (f(x) - 1)]?',
    upvotes: 12,
    hasTeacherAnswer: true,
    teacherName: 'Prof. Meera Sen (Maths Faculty)',
    teacherVerifiedText: 'Yes! That standard exponential identity holds whenever f(x) -> 1 and g(x) -> ∞. Always verify both conditions before applying.',
    comments: [
      {
        id: 'c3',
        author: 'Prof. Meera Sen',
        role: 'teacher',
        text: 'Be careful when g(x) oscillates or when limit does not exist.',
        createdAt: '3h ago',
        isTeacherVerified: true,
      },
    ],
  },
];

const INITIAL_PDF_MATERIALS: PDFMaterialItem[] = [
  {
    id: 'pdf-01',
    subject: 'Physics',
    emoji: '⚡',
    title: 'Kinematics & Rotational Mechanics Formula Sheet',
    subtitle: 'High-Yield Equations, Vector Shortcuts & Dimensional Checks',
    category: 'formula_sheet',
    author: 'Prof. Vikram Joshi (IIT Bombay)',
    fileSizeBytes: '3.4 MB PDF',
    createdAt: 'Today',
  },
  {
    id: 'pdf-02',
    subject: 'Mathematics',
    emoji: '📐',
    title: 'Calculus DPP #04: Definite Integrals & Areas',
    subtitle: '20 Daily Practice Questions with King’s Property Hints',
    category: 'dpp',
    author: 'Prof. Meera Sen (Maths Faculty)',
    fileSizeBytes: '2.8 MB PDF',
    createdAt: 'Yesterday',
  },
  {
    id: 'pdf-03',
    subject: 'Chemistry',
    emoji: '🧪',
    title: 'Organic Reaction Mechanisms: Aldehydes & Ketones',
    subtitle: 'Color reaction chart: Tollens, Fehling, & Aldol Condensation',
    category: 'notes',
    author: 'Dr. Rohan Kulkarni',
    fileSizeBytes: '1.9 MB PDF',
    createdAt: '2 days ago',
  },
  {
    id: 'pdf-04',
    subject: 'Biology',
    emoji: '🌿',
    title: 'Neural Control & Synaptic Transmission (PYQ)',
    subtitle: '10-Year Solved Questions with Color-Coded Axon Diagrams',
    category: 'pyq',
    author: 'Dr. Ananya Ray',
    fileSizeBytes: '4.2 MB PDF',
    createdAt: '3 days ago',
  },
  {
    id: 'pdf-05',
    subject: 'Physics',
    emoji: '🔬',
    title: 'Modern Physics & Photoelectric Effect Cheat Sheet',
    subtitle: 'Einstein equation, stopping potential & de Broglie wavelengths',
    category: 'formula_sheet',
    author: 'Prof. Vikram Joshi',
    fileSizeBytes: '2.1 MB PDF',
    createdAt: '4 days ago',
  },
  {
    id: 'pdf-06',
    subject: 'Mathematics',
    emoji: '📊',
    title: 'Coordinate Geometry: Conic Sections Fast Track',
    subtitle: 'Parabola, Ellipse & Hyperbola focal properties & tangents',
    category: 'notes',
    author: 'Dr. S. Ramanujan',
    fileSizeBytes: '3.1 MB PDF',
    createdAt: '5 days ago',
  },
];

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-01',
    institute_id: 'inst-01',
    batch_id: 'batch-01',
    student_id: 'stud-amelia',
    student_name: 'Amelia Sharma',
    roll_number: '#01',
    date: new Date().toISOString().split('T')[0],
    status: 'P',
    remarks: 'Present & Active contributor',
    created_at: new Date().toISOString(),
  },
  {
    id: 'att-02',
    institute_id: 'inst-01',
    batch_id: 'batch-01',
    student_id: 'stud-kabir',
    student_name: 'Kabir Singhania',
    roll_number: '#02',
    date: new Date().toISOString().split('T')[0],
    status: 'P',
    remarks: 'On time, notebook submitted',
    created_at: new Date().toISOString(),
  },
  {
    id: 'att-03',
    institute_id: 'inst-01',
    batch_id: 'batch-01',
    student_id: 'stud-zoya',
    student_name: 'Zoya Khan',
    roll_number: '#03',
    date: new Date().toISOString().split('T')[0],
    status: 'P',
    remarks: 'Full score in pop quiz',
    created_at: new Date().toISOString(),
  },
  {
    id: 'att-04',
    institute_id: 'inst-01',
    batch_id: 'batch-01',
    student_id: 'stud-aarav',
    student_name: 'Aarav Mehta',
    roll_number: '#04',
    date: new Date().toISOString().split('T')[0],
    status: 'L',
    remarks: 'Arrived 10 mins late (Traffic)',
    created_at: new Date().toISOString(),
  },
  {
    id: 'att-05',
    institute_id: 'inst-01',
    batch_id: 'batch-01',
    student_id: 'stud-ananya',
    student_name: 'Ananya Deshmukh',
    roll_number: '#05',
    date: new Date().toISOString().split('T')[0],
    status: 'P',
    remarks: 'Excellent questions asked',
    created_at: new Date().toISOString(),
  },
  {
    id: 'att-06',
    institute_id: 'inst-01',
    batch_id: 'batch-01',
    student_id: 'stud-rohan',
    student_name: 'Rohan Kulkarni',
    roll_number: '#06',
    date: new Date().toISOString().split('T')[0],
    status: 'A',
    remarks: 'Prior medical leave granted',
    created_at: new Date().toISOString(),
  },
  {
    id: 'att-07',
    institute_id: 'inst-01',
    batch_id: 'batch-01',
    student_id: 'stud-diya',
    student_name: 'Diya Patel',
    roll_number: '#07',
    date: new Date().toISOString().split('T')[0],
    status: 'P',
    remarks: 'Completed all numerical derivations',
    created_at: new Date().toISOString(),
  },
  {
    id: 'att-08',
    institute_id: 'inst-01',
    batch_id: 'batch-01',
    student_id: 'stud-ishaan',
    student_name: 'Ishaan Verma',
    roll_number: '#08',
    date: new Date().toISOString().split('T')[0],
    status: 'P',
    remarks: 'On time, active participant',
    created_at: new Date().toISOString(),
  },
];

const INITIAL_LECTURES: Lecture[] = [
  {
    id: 'lec-01',
    institute_id: 'inst-01',
    batch_id: 'batch-01',
    title: 'Electromagnetism & Circuit Flow Masterclass',
    description: 'Comprehensive derivation of Biot-Savart Law and Ampere circuital law with numerical problem solving.',
    subject: 'Physics',
    provider: 'youtube',
    video_id_or_url: 'dQw4w9WgXcQ',
    duration_minutes: 75,
    duration_formatted: '1h 15m',
    faculty_name: 'Prof. Vikram Joshi',
    thumbnail_url: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800',
    is_live: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'lec-02',
    institute_id: 'inst-01',
    batch_id: 'batch-01',
    title: 'Calculus: Integration by Parts & Partial Fractions',
    description: 'Special integration tricks and symmetry properties for IIT-JEE Advanced and Olympiad problems.',
    subject: 'Mathematics',
    provider: 'youtube',
    video_id_or_url: 'dQw4w9WgXcQ',
    duration_minutes: 60,
    duration_formatted: '1h 00m',
    faculty_name: 'Prof. Meera Sen',
    thumbnail_url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800',
    is_live: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'lec-03',
    institute_id: 'inst-01',
    batch_id: 'batch-01',
    title: 'Organic Chemistry: Aldol & Cannizzaro Mechanisms',
    description: 'Carbonyl condensation, cross-aldol pathways, and stereochemistry breakdown.',
    subject: 'Chemistry',
    provider: 'youtube',
    video_id_or_url: 'dQw4w9WgXcQ',
    duration_minutes: 50,
    duration_formatted: '50m',
    faculty_name: 'Dr. Rohan Kulkarni',
    thumbnail_url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800',
    is_live: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'lec-04',
    institute_id: 'inst-01',
    batch_id: 'batch-01',
    title: 'Human Physiology: Synaptic Potentials & Reflex Arc',
    description: 'Resting membrane potential, Na+/K+ ATPase, and Action Potential propagation steps.',
    subject: 'Biology',
    provider: 'youtube',
    video_id_or_url: 'dQw4w9WgXcQ',
    duration_minutes: 65,
    duration_formatted: '1h 05m',
    faculty_name: 'Dr. Ananya Ray',
    thumbnail_url: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800',
    is_live: false,
    created_at: new Date().toISOString(),
  },
];

const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg-01',
    institute_id: 'inst-01',
    batch_id: 'batch-01',
    title: 'Daily Practice Problem (DPP) #14: Gauss Law',
    subject: 'Physics',
    instructions: 'Solve all 15 MCQs and upload high-resolution photos or PDF of your working notes.',
    due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
    due_label: 'Tomorrow, 11:59 PM',
    due_date_formatted: 'Tomorrow, 11:59 PM',
    total_marks: 60,
    max_marks: 60,
    question_count: 15,
    created_by: 'faculty-01',
    assigned_by_name: 'Prof. Vikram Joshi',
    status: 'pending',
    submission_count: 24,
    total_students: 28,
    created_at: new Date().toISOString(),
  },
  {
    id: 'asg-02',
    institute_id: 'inst-01',
    batch_id: 'batch-01',
    title: 'Calculus Assignment 03: Definite Integrals',
    subject: 'Mathematics',
    instructions: 'Apply King property and Leibnitz rule for differentiation under integral sign.',
    due_date: new Date(Date.now() + 86400000 * 3).toISOString(),
    due_label: 'In 3 days',
    due_date_formatted: 'In 3 days',
    total_marks: 40,
    max_marks: 40,
    question_count: 10,
    created_by: 'faculty-02',
    assigned_by_name: 'Prof. Meera Sen',
    status: 'pending',
    submission_count: 18,
    total_students: 28,
    created_at: new Date().toISOString(),
  },
  {
    id: 'asg-03',
    institute_id: 'inst-01',
    batch_id: 'batch-01',
    title: 'Unit Test 04: Rotational Mechanics (Graded)',
    subject: 'Physics',
    instructions: 'Timed assessment on Moment of Inertia, Angular Momentum Conservation, and Rolling.',
    due_date: new Date(Date.now() - 86400000 * 1).toISOString(),
    due_label: 'Graded Yesterday',
    due_date_formatted: 'Graded Yesterday',
    total_marks: 100,
    max_marks: 100,
    question_count: 25,
    created_by: 'faculty-01',
    assigned_by_name: 'Prof. Vikram Joshi',
    status: 'graded',
    submission_count: 28,
    total_students: 28,
    created_at: new Date().toISOString(),
  },
];

const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-01',
    assignment_id: 'asg-01',
    student_id: 'stud-amelia',
    student_name: 'Amelia Sharma',
    roll_number: '#01',
    file_url: 'https://example.com/dpp14_amelia_solution.pdf',
    file_name: 'Amelia_DPP14_Solutions.pdf',
    submitted_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    submitted_at_formatted: '4 hrs ago',
    submission_text: 'Solved all 15 questions with Gauss law derivations attached.',
    status: 'submitted',
    marks_obtained: undefined,
    feedback: undefined,
  },
  {
    id: 'sub-02',
    assignment_id: 'asg-01',
    student_id: 'stud-kabir',
    student_name: 'Kabir Singhania',
    roll_number: '#02',
    file_url: 'https://example.com/dpp14_kabir_solution.pdf',
    file_name: 'Kabir_DPP14_Solutions.pdf',
    submitted_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    submitted_at_formatted: '2 hrs ago',
    submission_text: 'Attached PDF solution for review.',
    status: 'graded',
    marks_obtained: 56,
    feedback: 'Great step-by-step spherical shell derivation! Watch out for minor sign in Q11.',
  },
  {
    id: 'sub-03',
    assignment_id: 'asg-01',
    student_id: 'stud-aarav',
    student_name: 'Aarav Mehta',
    roll_number: '#04',
    file_url: 'https://example.com/dpp14_aarav_solution.pdf',
    file_name: 'Aarav_DPP14_Solutions.pdf',
    submitted_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    submitted_at_formatted: '1 hr ago',
    submission_text: 'Completed questions 1-14, need clarification on question 15 flux through cylinder.',
    status: 'graded',
    marks_obtained: 52,
    feedback: 'Solid work. We will discuss cylinder caps flux in Monday class.',
  },
  {
    id: 'sub-04',
    assignment_id: 'asg-01',
    student_id: 'stud-ananya',
    student_name: 'Ananya Deshmukh',
    roll_number: '#05',
    file_url: 'https://example.com/dpp14_ananya_solution.pdf',
    file_name: 'Ananya_DPP14_Solutions.pdf',
    submitted_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    submitted_at_formatted: '5 hrs ago',
    submission_text: 'Attached complete handwritten notes & final derivations.',
    status: 'submitted',
    marks_obtained: undefined,
    feedback: undefined,
  },
];

const DEFAULT_ENROLLED_TEACHERS: EnrolledTeacherItem[] = [
  {
    id: 'teach-verma-01',
    name: 'Prof. Vikram Joshi',
    subject: 'Physics',
    teacherCode: 'JOSHI-MATH-89',
    instituteName: 'Apex Science Academy',
    batchName: 'Class 12 • JEE Advanced (Morning)',
    schedule: 'Mon, Wed, Fri @ 04:30 PM',
    attendanceRate: 96.4,
  },
  {
    id: 'teach-swami-02',
    name: 'Prof. Arvind Swaminathan',
    subject: 'Mathematics',
    teacherCode: 'SWAMI-MATH-99',
    instituteName: 'Pinnacle STEM Tuition',
    batchName: 'Class 11 • Physics & Calculus Mastery',
    schedule: 'Tue, Thu, Sat @ 05:00 PM',
    attendanceRate: 94.0,
  },
];

const AcademicContext = createContext<AcademicContextType | undefined>(undefined);

export const AcademicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeInstitute } = useAuth();

  // State Declarations
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [pdfMaterials, setPdfMaterials] = useState<PDFMaterialItem[]>(INITIAL_PDF_MATERIALS);
  const [lectures, setLectures] = useState<Lecture[]>(INITIAL_LECTURES);
  const [activeLecture, setActiveLecture] = useState<Lecture | null>(null);
  const [offlineLectureIds, setOfflineLectureIds] = useState<string[]>(['lec-01']);
  const [assignments, setAssignments] = useState<Assignment[]>(INITIAL_ASSIGNMENTS);
  const [submissions, setSubmissions] = useState<Submission[]>(INITIAL_SUBMISSIONS);

  // Multi-Teacher Support for Students
  const [enrolledTeachers, setEnrolledTeachers] = useState<EnrolledTeacherItem[]>(DEFAULT_ENROLLED_TEACHERS);
  const [activeTeacherId, setActiveTeacherId] = useState<string>(DEFAULT_ENROLLED_TEACHERS[0].id);

  // Teacher Dual Mode (Solo Tutor vs Coaching Faculty)
  const [teacherMode, setTeacherMode] = useState<'solo' | 'coaching_faculty'>('solo');
  const [linkedCoachingCode, setLinkedCoachingCode] = useState<string>('BLOOM2026');

  // Teacher Code & Join Requests
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>(INITIAL_JOIN_REQUESTS);
  const [studentJoinStatus, setStudentJoinStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [activeJoinRequest, setActiveJoinRequest] = useState<JoinRequest | null>(null);

  // Student 360 Roster
  const [studentsRoster, setStudentsRoster] = useState<Student360Profile[]>(INITIAL_STUDENTS_ROSTER);

  // Comparison & Benchmark Chart Data
  const [comparisonChartData, setComparisonChartData] = useState<{
    testName: string;
    studentScore: number;
    batchAvg: number;
    batchTopper: number;
    maxScore: number;
  }[]>([
    { testName: 'Unit 1 (Kinematics)', studentScore: 88, batchAvg: 68, batchTopper: 96, maxScore: 100 },
    { testName: 'Mock 1 (Mechanics)', studentScore: 78, batchAvg: 64, batchTopper: 94, maxScore: 100 },
    { testName: 'Unit 2 (Calculus)', studentScore: 92, batchAvg: 74, batchTopper: 98, maxScore: 100 },
    { testName: 'Midterm JEE Prep', studentScore: 85, batchAvg: 70, batchTopper: 97, maxScore: 100 },
  ]);

  // Community Feed
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(INITIAL_COMMUNITY_POSTS);

  // Profiles
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile>(DEFAULT_TEACHER_PROFILE);
  const [coachingProfile, setCoachingProfile] = useState<CoachingProfile>(DEFAULT_COACHING_PROFILE);

  // Load Persisted State on Mount
  useEffect(() => {
    const loadSaved = async () => {
      try {
        const savedRequests = await AsyncStorage.getItem('@acadly_join_requests');
        if (savedRequests) setJoinRequests(JSON.parse(savedRequests));

        const savedStatus = await AsyncStorage.getItem('@acadly_student_join_status');
        if (savedStatus) setStudentJoinStatus(savedStatus as any);

        const savedPosts = await AsyncStorage.getItem('@acadly_community_posts');
        if (savedPosts) setCommunityPosts(JSON.parse(savedPosts));

        const savedPdfs = await AsyncStorage.getItem('@acadly_pdf_materials');
        if (savedPdfs) setPdfMaterials(JSON.parse(savedPdfs));

        const savedRoster = await AsyncStorage.getItem('@acadly_students_roster');
        if (savedRoster) setStudentsRoster(JSON.parse(savedRoster));

        const savedChart = await AsyncStorage.getItem('@acadly_comparison_chart_data');
        if (savedChart) setComparisonChartData(JSON.parse(savedChart));
      } catch (err) {
        console.warn('Could not restore academic local storage', err);
      }
    };
    loadSaved();
  }, []);

  // Attendance Handlers
  const markAttendance = async (studentId: string, status: 'P' | 'A' | 'L', remarks?: string) => {
    setAttendanceRecords((prev) =>
      prev.map((rec) =>
        rec.student_id === studentId
          ? { ...rec, status, remarks: remarks || rec.remarks, updated_at: new Date().toISOString() }
          : rec
      )
    );
  };

  const correctAttendance = async (recordId: string, newStatus: 'P' | 'A' | 'L', reason: string) => {
    setAttendanceRecords((prev) =>
      prev.map((rec) =>
        rec.id === recordId
          ? { ...rec, status: newStatus, remarks: `Corrected: ${reason}` }
          : rec
      )
    );
  };

  const markBatchAllPresent = async (batchId: string) => {
    setAttendanceRecords((prev) =>
      prev.map((rec) =>
        rec.batch_id === batchId ? { ...rec, status: 'P', remarks: 'Batch Marked Present' } : rec
      )
    );
  };

  // Material & PDF Handlers
  const uploadMaterial = async (data: Omit<StudyMaterial, 'id' | 'institute_id' | 'created_at'>) => {
    const newMaterial: StudyMaterial = {
      ...data,
      id: `mat-${Date.now()}`,
      institute_id: activeInstitute?.id || 'inst-01',
      created_at: new Date().toISOString(),
    };
    setMaterials((prev) => [newMaterial, ...prev]);
  };

  const uploadPDFMaterial = async (
    title: string,
    subject: string,
    category: 'notes' | 'formula_sheet' | 'pyq' | 'dpp',
    fileName: string,
    fileSizeBytes: string = '2.4 MB PDF'
  ) => {
    const newItem: PDFMaterialItem = {
      id: `pdf-${Date.now()}`,
      subject,
      emoji: subject.includes('Math') ? '📐' : subject.includes('Phys') ? '⚡' : subject.includes('Bio') ? '🌿' : '🧪',
      title,
      subtitle: `Uploaded file: ${fileName}`,
      category,
      author: teacherProfile.fullName,
      fileSizeBytes,
      createdAt: 'Just now',
    };
    setPdfMaterials((prev) => {
      const updated = [newItem, ...prev];
      AsyncStorage.setItem('@acadly_pdf_materials', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  const downloadMaterial = async (_id: string) => {};

  // Lecture Handlers
  const openPlayer = (lecture: Lecture) => setActiveLecture(lecture);
  const closePlayer = () => setActiveLecture(null);
  const addLecture = async (data: Omit<Lecture, 'id' | 'institute_id' | 'created_at'>) => {
    const newLecture: Lecture = {
      ...data,
      id: `lec-${Date.now()}`,
      institute_id: activeInstitute?.id || 'inst-01',
      created_at: new Date().toISOString(),
    };
    setLectures((prev) => [newLecture, ...prev]);
  };

  const toggleOfflineDownload = (lectureId: string) => {
    setOfflineLectureIds((prev) =>
      prev.includes(lectureId) ? prev.filter((id) => id !== lectureId) : [...prev, lectureId]
    );
  };

  // Assignment Handlers
  const createAssignment = async (data: Omit<Assignment, 'id' | 'institute_id' | 'created_at'>) => {
    const newAssignment: Assignment = {
      ...data,
      id: `asg-${Date.now()}`,
      institute_id: activeInstitute?.id || 'inst-01',
      status: 'pending',
      submission_count: 0,
      total_students: 28,
      created_at: new Date().toISOString(),
    };
    setAssignments((prev) => [newAssignment, ...prev]);
  };

  const submitAssignment = async (
    assignmentId: string,
    text: string,
    fileName?: string,
    fileUri?: string
  ) => {
    const newSub: Submission = {
      id: `sub-${Date.now()}`,
      assignment_id: assignmentId,
      student_id: 'stud-amelia',
      student_name: 'Amelia Sharma',
      roll_number: 'ADM-2026-088',
      file_url: fileUri || '',
      file_name: fileName || 'Student_Solution.pdf',
      submitted_at: new Date().toISOString(),
      submitted_at_formatted: 'Just now',
      submission_text: text || 'Uploaded solution PDF file.',
      status: 'submitted',
    };
    setSubmissions((prev) => [
      newSub,
      ...prev.filter((s) => s.assignment_id !== assignmentId || s.student_id !== 'stud-amelia'),
    ]);
    setAssignments((prev) =>
      prev.map((a) => (a.id === assignmentId ? { ...a, status: 'submitted' } : a))
    );
  };

  const gradeSubmission = async (submissionId: string, marks: number, feedback: string) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId ? { ...s, marks_obtained: marks, feedback, status: 'graded' } : s
      )
    );
  };

  // Multi-Teacher Support Functions
  const switchActiveTeacher = (teacherId: string) => {
    const found = enrolledTeachers.find((t) => t.id === teacherId);
    if (found) {
      setActiveTeacherId(teacherId);
    }
  };

  const addEnrolledTeacher = (teacher: EnrolledTeacherItem) => {
    setEnrolledTeachers((prev) => {
      if (prev.some((t) => t.id === teacher.id || t.teacherCode === teacher.teacherCode)) {
        return prev;
      }
      return [...prev, teacher];
    });
    setActiveTeacherId(teacher.id);
  };

  // Teacher Dual Mode Functions
  const linkToCoachingCenter = async (
    code: string
  ): Promise<{ success: boolean; instituteName?: string; error?: string }> => {
    const clean = code.trim().toUpperCase();
    if (clean === 'BLOOM2026' || clean.includes('BLOOM') || clean.includes('APEX')) {
      setTeacherMode('coaching_faculty');
      setLinkedCoachingCode(clean);
      return { success: true, instituteName: 'Bloom Science Academy 🌸' };
    }
    return { success: false, error: 'Institute code not found. Please verify with center admin.' };
  };

  // Community Verified Comment Handler
  const verifyCommunityComment = (postId: string, commentId: string) => {
    setCommunityPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const targetComment = p.comments.find((c) => c.id === commentId);
          return {
            ...p,
            hasTeacherAnswer: true,
            teacherName: teacherProfile.fullName,
            teacherVerifiedText: targetComment?.text || p.teacherVerifiedText,
            comments: p.comments.map((c) =>
              c.id === commentId ? { ...c, isTeacherVerified: true } : c
            ),
          };
        }
        return p;
      })
    );
  };

  // Join Request Gatekeeper Logic
  const submitJoinRequest = async (details: StudentExtraDetails, code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const isTeacher = cleanCode === teacherProfile.teacherCode || cleanCode.includes('JOSHI') || cleanCode.includes('SHARMA');
    const targetName = isTeacher ? teacherProfile.fullName : (coachingProfile.name || 'Apex Institute');
    const targetType = isTeacher ? 'individual_teacher' : 'coaching_center';

    const newReq: JoinRequest = {
      id: `req-${Date.now()}`,
      studentDetails: details,
      codeUsed: cleanCode,
      status: 'pending',
      appliedAt: 'Just now',
      matchedTargetName: targetName,
      matchedType: targetType,
    };

    const updated = [newReq, ...joinRequests];
    setJoinRequests(updated);
    setStudentJoinStatus('pending');
    setActiveJoinRequest(newReq);
    await AsyncStorage.setItem('@acadly_join_requests', JSON.stringify(updated));
    await AsyncStorage.setItem('@acadly_student_join_status', 'pending');

    return { success: true, targetName };
  };

  const approveJoinRequest = async (requestId: string, batchId: string, feePlan: string) => {
    const targetReq = joinRequests.find((r) => r.id === requestId);
    if (!targetReq) return;

    // 1. Move to active Student 360 Roster
    const newStudentProfile: Student360Profile = {
      id: `stud-${Date.now()}`,
      name: targetReq.studentDetails.fullName,
      rollNumber: `ADM-${Date.now().toString().slice(-4)}`,
      grade: targetReq.studentDetails.grade,
      board: targetReq.studentDetails.board,
      school: targetReq.studentDetails.school,
      targetExam: targetReq.studentDetails.targetExam,
      batchName: batchId === 'batch-01' ? 'Class 12 • JEE Advanced (Morning)' : 'Class 11 • Physics & Calculus Mastery',
      guardianName: targetReq.studentDetails.guardianName,
      guardianPhone: targetReq.studentDetails.guardianPhone,
      address: targetReq.studentDetails.address || 'Address on file',
      bloodGroup: targetReq.studentDetails.bloodGroup,
      previousPercentage: targetReq.studentDetails.previousPercentage,
      weakSubjects: targetReq.studentDetails.weakSubjects,
      overallAttendance: 100.0,
      feeStatus: `Plan Assigned (${feePlan})`,
      rank: studentsRoster.length + 1,
      percentile: 88.0,
      parentLinkCode: 'STU-' + targetReq.studentDetails.fullName.split(' ')[0].toUpperCase() + '-' + Math.floor(100 + Math.random() * 900),
      teacherRemarks: ['Admitted via Teacher Code verification.'],
    };

    const updatedRoster = [newStudentProfile, ...studentsRoster];
    setStudentsRoster(updatedRoster);

    // 2. Mark request approved
    const updatedReqs: JoinRequest[] = joinRequests.map((r) =>
      r.id === requestId ? { ...r, status: 'approved', assignedBatch: batchId, assignedFeePlan: feePlan } : r
    );
    setJoinRequests(updatedReqs);
    setStudentJoinStatus('approved');

    // 3. Add to daily attendance roster
    setAttendanceRecords((prev) => [
      {
        id: `att-${Date.now()}`,
        institute_id: 'inst-01',
        batch_id: batchId,
        student_id: newStudentProfile.id,
        student_name: newStudentProfile.name,
        roll_number: newStudentProfile.rollNumber,
        date: new Date().toISOString().split('T')[0],
        status: 'P',
        remarks: 'New Admitted Student',
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);

    await AsyncStorage.setItem('@acadly_join_requests', JSON.stringify(updatedReqs));
    await AsyncStorage.setItem('@acadly_students_roster', JSON.stringify(updatedRoster));
    await AsyncStorage.setItem('@acadly_student_join_status', 'approved');

    // 4. Automatically add student to Batch Group Chat and create 1-on-1 Direct Chat in AsyncStorage
    try {
      const storedRooms = await AsyncStorage.getItem('@acadly_chat_rooms_v1');
      const existingRooms = storedRooms ? JSON.parse(storedRooms) : [];

      const newDirectRoom = {
        id: `direct-teacher-${newStudentProfile.id}`,
        title: `${newStudentProfile.name}`,
        subtitle: `${newStudentProfile.grade} • Direct Doubt`,
        type: 'direct',
        participantIds: ['prof-vikram', newStudentProfile.id],
        avatarEmoji: '🌱',
        unreadCount: 0,
        lastMessage: {
          text: 'Welcome to the batch! Feel free to ask any doubt here.',
          senderName: teacherProfile.fullName,
          timeFormatted: 'Just now',
        },
      };

      const updatedChatRooms = existingRooms.map((rm: any) => {
        if (rm.type === 'batch_group') {
          return {
            ...rm,
            participantIds: [...(rm.participantIds || []), newStudentProfile.id],
          };
        }
        return rm;
      });

      if (!updatedChatRooms.some((rm: any) => rm.id === newDirectRoom.id)) {
        updatedChatRooms.push(newDirectRoom);
      }

      await AsyncStorage.setItem('@acadly_chat_rooms_v1', JSON.stringify(updatedChatRooms));
    } catch (e) {
      console.warn('Chat room auto-link notice:', e);
    }
  };

  const rejectJoinRequest = async (requestId: string, _reason?: string) => {
    const updatedReqs: JoinRequest[] = joinRequests.map((r) =>
      r.id === requestId ? { ...r, status: 'rejected' } : r
    );
    setJoinRequests(updatedReqs);
    setStudentJoinStatus('rejected');
    await AsyncStorage.setItem('@acadly_join_requests', JSON.stringify(updatedReqs));
    await AsyncStorage.setItem('@acadly_student_join_status', 'rejected');
  };

  const simulateTeacherApproval = async () => {
    const pendingReq = joinRequests.find((r) => r.status === 'pending') || joinRequests[0];
    if (pendingReq) {
      await approveJoinRequest(pendingReq.id, 'batch-01', 'Monthly Term (₹3,500/mo)');
    } else {
      setStudentJoinStatus('approved');
      await AsyncStorage.setItem('@acadly_student_join_status', 'approved');
    }
  };

  // Student 360 Helpers
  const getStudentById = (studentId: string) => {
    return studentsRoster.find((s) => s.id === studentId || s.name.toLowerCase().includes(studentId.toLowerCase()));
  };

  const updateStudentRemarks = (studentId: string, remark: string) => {
    setStudentsRoster((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, teacherRemarks: [remark, ...s.teacherRemarks] } : s
      )
    );
  };

  const updateStudentFeeStatus = (studentId: string, status: string) => {
    setStudentsRoster((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, feeStatus: status } : s))
    );
  };

  // Community Feed Handlers
  const addCommunityPost = async (
    title: string,
    content: string,
    subject: string,
    attachmentName?: string,
    attachmentUri?: string
  ) => {
    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      author: 'Amelia Sharma (You)',
      role: 'student',
      avatarEmoji: '🌸',
      timeAgo: 'Just now',
      subject,
      title,
      content,
      upvotes: 1,
      hasTeacherAnswer: false,
      attachmentName,
      attachmentUri,
      comments: [],
    };
    const updated = [newPost, ...communityPosts];
    setCommunityPosts(updated);
    await AsyncStorage.setItem('@acadly_community_posts', JSON.stringify(updated));
  };

  const upvoteCommunityPost = (postId: string) => {
    setCommunityPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, upvotes: p.upvotes + 1 } : p))
    );
  };

  const addCommunityComment = (postId: string, text: string, isTeacherVerified: boolean = false) => {
    const newComment: CommunityComment = {
      id: `c-${Date.now()}`,
      author: isTeacherVerified ? teacherProfile.fullName : 'Amelia Sharma',
      role: isTeacherVerified ? 'teacher' : 'student',
      text,
      createdAt: 'Just now',
      isTeacherVerified,
    };

    setCommunityPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            hasTeacherAnswer: isTeacherVerified || p.hasTeacherAnswer,
            teacherName: isTeacherVerified ? teacherProfile.fullName : p.teacherName,
            teacherVerifiedText: isTeacherVerified ? text : p.teacherVerifiedText,
            comments: [...p.comments, newComment],
          };
        }
        return p;
      })
    );
  };

  const recordTestMarks = async (
    testName: string,
    subject: string,
    maxScore: number,
    marks: { studentId: string; score: number }[]
  ) => {
    if (marks.length === 0) return;
    const scores = marks.map((m) => m.score);
    const batchTopper = Math.max(...scores);
    const batchAvg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const ameliaMark =
      marks.find((m) => m.studentId === 'stud-amelia')?.score || marks[0]?.score || 85;

    const newBenchmark = {
      testName,
      studentScore: ameliaMark,
      batchAvg,
      batchTopper,
      maxScore,
    };

    const updatedChart = [...comparisonChartData, newBenchmark];
    setComparisonChartData(updatedChart);

    // Update Student 360 percentiles and ranks based on scores
    const sortedMarks = [...marks].sort((a, b) => b.score - a.score);
    setStudentsRoster((prev) =>
      prev.map((student) => {
        const foundIndex = sortedMarks.findIndex((m) => m.studentId === student.id);
        if (foundIndex !== -1) {
          const rank = foundIndex + 1;
          const percentile = Math.round(
            ((sortedMarks.length - rank + 1) / sortedMarks.length) * 100
          );
          return {
            ...student,
            rank,
            percentile,
            teacherRemarks: [
              `Scored ${sortedMarks[foundIndex].score}/${maxScore} on ${testName} (Rank #${rank}).`,
              ...student.teacherRemarks,
            ],
          };
        }
        return student;
      })
    );

    await AsyncStorage.setItem('@acadly_comparison_chart_data', JSON.stringify(updatedChart));
  };

  return (
    <AcademicContext.Provider
      value={{
        attendanceRecords,
        markAttendance,
        correctAttendance,
        markBatchAllPresent,
        materials,
        pdfMaterials,
        uploadMaterial,
        uploadPDFMaterial,
        downloadMaterial,
        lectures,
        activeLecture,
        openPlayer,
        closePlayer,
        addLecture,
        offlineLectureIds,
        toggleOfflineDownload,
        assignments,
        submissions,
        createAssignment,
        submitAssignment,
        gradeSubmission,
        enrolledTeachers,
        activeTeacherId,
        switchActiveTeacher,
        addEnrolledTeacher,
        teacherMode,
        setTeacherMode,
        linkedCoachingCode,
        linkToCoachingCenter,
        joinRequests,
        studentJoinStatus,
        activeJoinRequest,
        submitJoinRequest,
        approveJoinRequest,
        rejectJoinRequest,
        simulateTeacherApproval,
        studentsRoster,
        getStudentById,
        updateStudentRemarks,
        updateStudentFeeStatus,
        comparisonChartData,
        recordTestMarks,
        communityPosts,
        addCommunityPost,
        upvoteCommunityPost,
        addCommunityComment,
        verifyCommunityComment,
        teacherProfile,
        setTeacherProfile,
        coachingProfile,
        setCoachingProfile,
      }}
    >
      {children}
    </AcademicContext.Provider>
  );
};

export const useAcademic = () => {
  const context = useContext(AcademicContext);
  if (!context) {
    throw new Error('useAcademic must be used within an AcademicProvider');
  }
  return context;
};
