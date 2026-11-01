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

  // Assignments
  assignments: Assignment[];
  submissions: Submission[];
  createAssignment: (data: Omit<Assignment, 'id' | 'institute_id' | 'created_at'>) => Promise<void>;
  submitAssignment: (assignmentId: string, text: string) => Promise<void>;
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

  // Community Feed
  communityPosts: CommunityPost[];
  addCommunityPost: (title: string, content: string, subject: string, attachmentName?: string, attachmentUri?: string) => Promise<void>;
  upvoteCommunityPost: (postId: string) => void;
  addCommunityComment: (postId: string, text: string, isTeacherVerified?: boolean) => void;

  // Teacher & Coaching Profiles
  teacherProfile: TeacherProfile;
  setTeacherProfile: React.Dispatch<React.SetStateAction<TeacherProfile>>;
  coachingProfile: CoachingProfile;
  setCoachingProfile: React.Dispatch<React.SetStateAction<CoachingProfile>>;
}

const DEFAULT_TEACHER_PROFILE: TeacherProfile = {
  fullName: 'Prof. Vikram Joshi ⚡',
  qualification: 'M.Sc Physics (IIT Bombay), 12+ Yrs Exp',
  specializationSubjects: ['Physics ⚡', 'Calculus 📐', 'Mechanics ⚙️'],
  experienceYears: 12.5,
  bio: 'Passionate about turning complex physics equations into beautiful intuitive stories.',
  achievements: 'Mentored 40+ AIR Top 500 students in JEE Advanced.',
  monthlyFeeRate: 3500,
  teacherCode: 'SHARMA-MATH-89',
};

const DEFAULT_COACHING_PROFILE: CoachingProfile = {
  name: 'Bloom Academy 🌸',
  city: 'Pune / Kota',
  subjectsOffered: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  directorName: 'Director Sharma',
  phone: '+91 98230 11223',
  inviteCode: 'BLOOM2026',
};

const INITIAL_STUDENTS_ROSTER: Student360Profile[] = [
  {
    id: 'stud-amelia',
    name: 'Amelia Sharma 🌸',
    rollNumber: 'ADM-2026-088',
    grade: 'Class 11 Science',
    board: 'CBSE',
    school: 'Delhi Public School (R.K. Puram)',
    targetExam: 'IIT-JEE 2026',
    batchName: 'Batch Sakura 🌸 (Medical & Adv)',
    guardianName: 'Sunita Sharma (Mother)',
    guardianPhone: '+91 98230 44551',
    address: 'Flat 402, Lotus Towers, Pune, Maharashtra',
    bloodGroup: 'B+',
    previousPercentage: '96.2% in Class 10',
    weakSubjects: ['Rotational Mechanics', 'Ionic Equilibrium'],
    overallAttendance: 96.4,
    feeStatus: 'Partially Paid (₹15,000 remaining)',
    rank: 2,
    percentile: 94.8,
    teacherRemarks: ['Exceptionally strong in calculus.', 'Needs more practice in rotational dynamics.'],
  },
  {
    id: 'stud-kabir',
    name: 'Kabir Singhania 🚀',
    rollNumber: 'ADM-2026-118',
    grade: 'Class 11 Science',
    board: 'CBSE',
    school: 'The Mother International',
    targetExam: 'IIT-JEE 2026',
    batchName: 'Batch Sakura 🌸 (Medical & Adv)',
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
    name: 'Zoya Khan 🌿',
    rollNumber: 'ADM-2026-124',
    grade: 'Class 11 Science',
    board: 'ICSE',
    school: 'St. Xavier High School',
    targetExam: 'NEET Medical 2026',
    batchName: 'Batch Clover 🍀 (Foundation)',
    guardianName: 'Dr. Farooq Khan',
    guardianPhone: '+91 98900 22119',
    address: '77 Hill Road, Bandra, Mumbai',
    bloodGroup: 'A+',
    previousPercentage: '91.8% in Class 10',
    weakSubjects: ['Physics Numerical Problems'],
    overallAttendance: 98.0,
    feeStatus: 'Paid Full (₹40,000)',
    rank: 1,
    percentile: 98.5,
    teacherRemarks: ['Remarkable memory in Botany.', 'Encouraged to solve JEE-level Physics MCQs.'],
  },
];

const INITIAL_JOIN_REQUESTS: JoinRequest[] = [
  {
    id: 'req-kabir-01',
    studentDetails: {
      fullName: 'Kabir Singhania 🚀',
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
    codeUsed: 'SHARMA-MATH-89',
    status: 'pending',
    appliedAt: '25 mins ago',
    matchedTargetName: 'Prof. Vikram Joshi (Physics & Math Tuition)',
    matchedType: 'individual_teacher',
  },
  {
    id: 'req-zoya-02',
    studentDetails: {
      fullName: 'Zoya Khan 🌿',
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
    codeUsed: 'BLOOM2026',
    status: 'pending',
    appliedAt: '1 hour ago',
    matchedTargetName: 'Bloom Academy 🌸 (Medical & JEE)',
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
    title: 'Electrostatics & Gauss Law Master Notes',
    subtitle: 'Handwritten notes with colored diagrams and derivations',
    category: 'notes',
    author: 'Prof. Vikram Joshi',
    fileSizeBytes: '3.4 MB PDF',
    createdAt: 'Today',
  },
  {
    id: 'pdf-02',
    subject: 'Mathematics',
    emoji: '📐',
    title: 'Calculus: Derivatives & Curves Cheat Sheet',
    subtitle: 'Graph sketches, tangent rules & maxima-minima steps',
    category: 'formula_sheet',
    author: 'Prof. Meera Sen',
    fileSizeBytes: '2.1 MB PDF',
    createdAt: 'Yesterday',
  },
  {
    id: 'pdf-03',
    subject: 'Biology',
    emoji: '🌿',
    title: 'Photosynthesis & Chloroplast Anatomy (PYQ)',
    subtitle: '10-Year Solved Questions with Model Answers',
    category: 'pyq',
    author: 'Dr. Ananya Ray',
    fileSizeBytes: '4.8 MB PDF',
    createdAt: '2 days ago',
  },
  {
    id: 'pdf-04',
    subject: 'Chemistry',
    emoji: '🧪',
    title: 'Organic Chemistry: Aldehydes & Ketones DPP #04',
    subtitle: 'Practice problem set with answer keys & hints',
    category: 'dpp',
    author: 'Dr. Rohan Kulkarni',
    fileSizeBytes: '1.8 MB PDF',
    createdAt: '3 days ago',
  },
];

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-01',
    institute_id: 'inst-01',
    batch_id: 'batch-01',
    student_id: 'stud-amelia',
    student_name: 'Amelia Sharma 🌸',
    roll_number: '#07',
    date: new Date().toISOString().split('T')[0],
    status: 'P',
    remarks: 'Present & Active',
    created_at: new Date().toISOString(),
  },
  {
    id: 'att-02',
    institute_id: 'inst-01',
    batch_id: 'batch-01',
    student_id: 'stud-kabir',
    student_name: 'Kabir Singhania 🚀',
    roll_number: '#12',
    date: new Date().toISOString().split('T')[0],
    status: 'P',
    remarks: 'On time',
    created_at: new Date().toISOString(),
  },
  {
    id: 'att-03',
    institute_id: 'inst-01',
    batch_id: 'batch-01',
    student_id: 'stud-zoya',
    student_name: 'Zoya Khan 🌿',
    roll_number: '#15',
    date: new Date().toISOString().split('T')[0],
    status: 'A',
    remarks: 'Prior leave granted',
    created_at: new Date().toISOString(),
  },
];

const INITIAL_LECTURES: Lecture[] = [
  {
    id: 'lec-01',
    institute_id: 'inst-01',
    batch_id: 'batch-01',
    title: 'Electromagnetism & Circuit Flow Masterclass',
    description: 'Comprehensive derivation of Biot-Savart Law and Ampere circuital law with numerical problems.',
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
    description: 'Special integration tricks for IIT-JEE Advanced and Olympiad problems.',
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
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  // Teacher Code & Join Requests
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>(INITIAL_JOIN_REQUESTS);
  const [studentJoinStatus, setStudentJoinStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [activeJoinRequest, setActiveJoinRequest] = useState<JoinRequest | null>(null);

  // Student 360 Roster
  const [studentsRoster, setStudentsRoster] = useState<Student360Profile[]>(INITIAL_STUDENTS_ROSTER);

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

  const submitAssignment = async (assignmentId: string, text: string) => {
    const newSub: Submission = {
      id: `sub-${Date.now()}`,
      assignment_id: assignmentId,
      student_id: 'stud-amelia',
      student_name: 'Amelia Sharma 🌸',
      roll_number: 'ADM-2026-088',
      submitted_at: new Date().toISOString(),
      submitted_at_formatted: 'Just now',
      submission_text: text,
      status: 'submitted',
    };
    setSubmissions((prev) => [newSub, ...prev]);
    setAssignments((prev) =>
      prev.map((a) => (a.id === assignmentId ? { ...a, status: 'submitted' } : a))
    );
  };

  const gradeSubmission = async (submissionId: string, marks: number, feedback: string) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === submissionId ? { ...s, marks_obtained: marks, feedback, status: 'graded' } : s))
    );
  };

  // Join Request Gatekeeper Logic
  const submitJoinRequest = async (details: StudentExtraDetails, code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const isTeacher = cleanCode === teacherProfile.teacherCode || cleanCode.includes('SHARMA');
    const targetName = isTeacher ? teacherProfile.fullName : 'Bloom Academy 🌸';
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
      batchName: batchId === 'batch-01' ? 'Batch Sakura 🌸 (Medical & Adv)' : 'Batch Cosmos 🚀 (IIT-JEE)',
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
        communityPosts,
        addCommunityPost,
        upvoteCommunityPost,
        addCommunityComment,
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
