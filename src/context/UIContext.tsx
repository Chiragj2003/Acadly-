import React, { createContext, useContext, useState } from 'react';
import { type Lecture } from '@/types/database';

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

export interface EnrolledTeacherItem {
  id: string;
  name: string;
  subject: string;
  teacherCode: string;
  instituteName: string;
  batchName: string;
  schedule: string;
  attendanceRate: number;
}

export interface ComparisonChartItem {
  testName: string;
  studentScore: number;
  batchAvg: number;
  batchTopper: number;
  maxScore: number;
}

export interface UIContextType {
  // Batch & Child selection state
  selectedBatchId: string | null;
  setSelectedBatchId: (batchId: string | null) => void;
  selectedChildId: string | null;
  setSelectedChildId: (childId: string | null) => void;

  // Video player overlay state
  activeLecture: Lecture | null;
  openPlayer: (lecture: Lecture) => void;
  closePlayer: () => void;
  offlineLectureIds: string[];
  toggleOfflineDownload: (lectureId: string) => void;
  lectures: Lecture[];
  addLecture: (data: Omit<Lecture, 'id' | 'institute_id' | 'created_at'>) => Promise<void>;

  // Multi-Teacher Support for Students
  enrolledTeachers: EnrolledTeacherItem[];
  activeTeacherId: string;
  switchActiveTeacher: (teacherId: string) => void;

  // Teacher dual mode UI state
  teacherMode: 'solo' | 'coaching_faculty';
  setTeacherMode: (mode: 'solo' | 'coaching_faculty') => void;
  linkedCoachingCode: string;
  setLinkedCoachingCode: (code: string) => void;
  linkToCoachingCenter: (code: string) => Promise<{ success: boolean; instituteName?: string; error?: string }>;
  teacherProfile: TeacherProfile;
  setTeacherProfile: React.Dispatch<React.SetStateAction<TeacherProfile>>;
  coachingProfile: CoachingProfile;
  setCoachingProfile: React.Dispatch<React.SetStateAction<CoachingProfile>>;

  // Assessment Benchmarking
  comparisonChartData: ComparisonChartItem[];
  setComparisonChartData: React.Dispatch<React.SetStateAction<ComparisonChartItem[]>>;
  recordTestMarks: (
    testName: string,
    subject: string,
    maxScore: number,
    marks: { studentId: string; score: number }[]
  ) => Promise<void>;
}

const DEFAULT_TEACHER_PROFILE: TeacherProfile = {
  fullName: 'Prof. Vikram Joshi',
  qualification: 'M.Sc Physics (IIT Bombay)',
  specializationSubjects: ['Physics', 'Calculus', 'Mechanics'],
  experienceYears: 12.5,
  bio: 'Passionate about turning complex physics equations into intuitive stories.',
  achievements: 'State & National Olympiad Mentorship',
  monthlyFeeRate: 3500,
  teacherCode: 'JOSHI-MATH-89',
};

const DEFAULT_COACHING_PROFILE: CoachingProfile = {
  name: 'Academy Center',
  city: 'Pune',
  subjectsOffered: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  directorName: 'Director Sharma',
  phone: '+91 98230 11223',
  inviteCode: 'ACAD-2026',
};

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
    instituteName: 'Kota Elite Scholars',
    batchName: 'JEE Rankers Cohort (Evening)',
    schedule: 'Tue, Thu, Sat @ 06:15 PM',
    attendanceRate: 93.8,
  },
];

const INITIAL_LECTURES: Lecture[] = [
  {
    id: 'lec-01',
    institute_id: 'a0000000-0000-0000-0000-000000000001',
    batch_id: 'b0000000-0000-0000-0000-000000000001',
    title: 'Electromagnetism & Circuit Flow Masterclass',
    description: 'Comprehensive derivation of Biot-Savart Law and Ampere circuital law with numerical problem solving.',
    subject: 'Physics',
    provider: 'youtube',
    video_id_or_url: 'dQw4w9WgXcQ',
    duration_minutes: 75,
    duration_formatted: '1h 15m',
    faculty_name: 'Prof. Vikram Joshi',
    is_live: false,
    created_at: '2026-03-20T10:00:00Z',
  },
  {
    id: 'lec-02',
    institute_id: 'a0000000-0000-0000-0000-000000000001',
    batch_id: 'b0000000-0000-0000-0000-000000000001',
    title: 'Rotational Motion: Moment of Inertia & Torques',
    description: 'Detailed problem solving on parallel and perpendicular axis theorems with standard exam applications.',
    subject: 'Physics',
    provider: 'youtube',
    video_id_or_url: 'dQw4w9WgXcQ',
    duration_minutes: 60,
    duration_formatted: '1h 00m',
    faculty_name: 'Prof. Vikram Joshi',
    is_live: true,
    created_at: '2026-03-21T16:30:00Z',
  },
];

const INITIAL_COMPARISON_CHART: ComparisonChartItem[] = [
  { testName: 'Unit 1 (Kinematics)', studentScore: 88, batchAvg: 68, batchTopper: 96, maxScore: 100 },
  { testName: 'Mock 1 (Mechanics)', studentScore: 78, batchAvg: 64, batchTopper: 94, maxScore: 100 },
  { testName: 'Unit 2 (Calculus)', studentScore: 92, batchAvg: 74, batchTopper: 98, maxScore: 100 },
  { testName: 'Midterm JEE Prep', studentScore: 85, batchAvg: 70, batchTopper: 97, maxScore: 100 },
];

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [activeLecture, setActiveLecture] = useState<Lecture | null>(null);
  const [offlineLectureIds, setOfflineLectureIds] = useState<string[]>(['lec-01']);
  const [lectures, setLectures] = useState<Lecture[]>(INITIAL_LECTURES);

  const [teacherMode, setTeacherMode] = useState<'solo' | 'coaching_faculty'>('solo');
  const [linkedCoachingCode, setLinkedCoachingCode] = useState<string>('BLOOM2026');
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile>(DEFAULT_TEACHER_PROFILE);
  const [coachingProfile, setCoachingProfile] = useState<CoachingProfile>(DEFAULT_COACHING_PROFILE);

  const [enrolledTeachers, setEnrolledTeachers] = useState<EnrolledTeacherItem[]>(DEFAULT_ENROLLED_TEACHERS);
  const [activeTeacherId, setActiveTeacherId] = useState<string>(DEFAULT_ENROLLED_TEACHERS[0].id);

  const [comparisonChartData, setComparisonChartData] = useState<ComparisonChartItem[]>(INITIAL_COMPARISON_CHART);

  const openPlayer = (lecture: Lecture) => setActiveLecture(lecture);
  const closePlayer = () => setActiveLecture(null);

  const toggleOfflineDownload = (lectureId: string) => {
    setOfflineLectureIds((prev) =>
      prev.includes(lectureId) ? prev.filter((id) => id !== lectureId) : [...prev, lectureId]
    );
  };

  const addLecture = async (data: Omit<Lecture, 'id' | 'institute_id' | 'created_at'>) => {
    const newLec: Lecture = {
      ...data,
      id: `lec-${Date.now()}`,
      institute_id: 'a0000000-0000-0000-0000-000000000001',
      created_at: new Date().toISOString(),
    };
    setLectures((prev) => [newLec, ...prev]);
  };

  const switchActiveTeacher = (teacherId: string) => {
    setActiveTeacherId(teacherId);
  };

  const linkToCoachingCenter = async (
    code: string
  ): Promise<{ success: boolean; instituteName?: string; error?: string }> => {
    const clean = code.trim().toUpperCase();
    if (clean === 'BLOOM2026' || clean.includes('BLOOM') || clean.includes('APEX')) {
      setTeacherMode('coaching_faculty');
      setLinkedCoachingCode(clean);
      return { success: true, instituteName: 'Apex Science Academy' };
    }
    return { success: false, error: 'Institute code not found. Please verify with center admin.' };
  };

  const recordTestMarks = async (
    testName: string,
    _subject: string,
    maxScore: number,
    marks: { studentId: string; score: number }[]
  ) => {
    if (marks.length === 0) return;
    const scores = marks.map((m) => m.score);
    const batchTopper = Math.max(...scores);
    const batchAvg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const primaryMark = marks[0]?.score || 85;

    const newBenchmark: ComparisonChartItem = {
      testName,
      studentScore: primaryMark,
      batchAvg,
      batchTopper,
      maxScore,
    };
    setComparisonChartData((prev) => [...prev, newBenchmark]);
  };

  return (
    <UIContext.Provider
      value={{
        selectedBatchId,
        setSelectedBatchId,
        selectedChildId,
        setSelectedChildId,
        activeLecture,
        openPlayer,
        closePlayer,
        offlineLectureIds,
        toggleOfflineDownload,
        lectures,
        addLecture,
        enrolledTeachers,
        activeTeacherId,
        switchActiveTeacher,
        teacherMode,
        setTeacherMode,
        linkedCoachingCode,
        setLinkedCoachingCode,
        linkToCoachingCenter,
        teacherProfile,
        setTeacherProfile,
        coachingProfile,
        setCoachingProfile,
        comparisonChartData,
        setComparisonChartData,
        recordTestMarks,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};