import React, { createContext, useContext, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import {
  type AttendanceRecord,
  type StudyMaterial,
  type Lecture,
  type Assignment,
  type Submission,
} from '@/types/database';

export interface AcademicContextType {
  // Attendance
  attendanceRecords: AttendanceRecord[];
  markAttendance: (studentId: string, status: 'P' | 'A' | 'L', remarks?: string) => Promise<void>;
  correctAttendance: (recordId: string, newStatus: 'P' | 'A' | 'L', reason: string) => Promise<void>;
  markBatchAllPresent: (batchId: string) => Promise<void>;

  // Study Materials
  materials: StudyMaterial[];
  uploadMaterial: (data: Omit<StudyMaterial, 'id' | 'institute_id' | 'created_at'>) => Promise<void>;
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
}

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-01',
    institute_id: 'inst-01',
    batch_id: 'batch-02',
    student_id: 's1',
    student_name: 'Aditya Sharma',
    roll_number: '#01',
    date: new Date().toISOString().split('T')[0],
    status: 'P',
    remarks: 'On time',
    created_at: new Date().toISOString(),
  },
  {
    id: 'att-02',
    institute_id: 'inst-01',
    batch_id: 'batch-02',
    student_id: 's2',
    student_name: 'Ananya Iyer',
    roll_number: '#02',
    date: new Date().toISOString().split('T')[0],
    status: 'A',
    remarks: 'Medical leave requested',
    created_at: new Date().toISOString(),
  },
  {
    id: 'att-03',
    institute_id: 'inst-01',
    batch_id: 'batch-02',
    student_id: 's3',
    student_name: 'Rohan Deshmukh',
    roll_number: '#03',
    date: new Date().toISOString().split('T')[0],
    status: 'L',
    remarks: 'Bus breakdown +15m',
    created_at: new Date().toISOString(),
  },
  {
    id: 'att-04',
    institute_id: 'inst-01',
    batch_id: 'batch-02',
    student_id: 's4',
    student_name: 'Aryan Kapoor',
    roll_number: '#04',
    date: new Date().toISOString().split('T')[0],
    status: 'P',
    created_at: new Date().toISOString(),
  },
];

const INITIAL_MATERIALS: StudyMaterial[] = [
  {
    id: 'mat-01',
    institute_id: 'inst-01',
    batch_id: 'batch-01',
    title: 'Electrodynamics & Gauss Law Compendium',
    subject: 'Physics',
    description: 'Comprehensive formula sheet, solved derivations, and previous 10-year JEE Advanced questions.',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_type: 'pdf',
    file_size_formatted: '4.2 MB',
    page_count: 24,
    uploaded_by: 'Er. Rakesh Verma',
    created_at: '2025-10-20',
  },
  {
    id: 'mat-02',
    institute_id: 'inst-01',
    batch_id: 'batch-02',
    title: 'Organic Reaction Mechanisms: Substitution & Elimination',
    subject: 'Chemistry',
    description: 'Complete notes on SN1, SN2, E1, E2 mechanisms with stereochemical visual diagrams.',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_type: 'pdf',
    file_size_formatted: '6.8 MB',
    page_count: 36,
    uploaded_by: 'Dr. Manisha Gupta',
    created_at: '2025-10-22',
  },
  {
    id: 'mat-03',
    institute_id: 'inst-01',
    batch_id: 'batch-03',
    title: 'Definite Integration & Area Under Curves Formula Handbook',
    subject: 'Mathematics',
    description: 'Standard integral identities, Leibniz theorem applications, and shortcuts.',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_type: 'pdf',
    file_size_formatted: '3.1 MB',
    page_count: 18,
    uploaded_by: 'Prof. Arvind Swaminathan',
    created_at: '2025-10-23',
  },
];

const INITIAL_LECTURES: Lecture[] = [
  {
    id: 'lec-01',
    institute_id: 'inst-01',
    batch_id: 'batch-01',
    title: 'Electromagnetism & Ampere Circuital Law',
    subject: 'Physics',
    provider: 'youtube',
    video_id_or_url: 'dQw4w9WgXcQ', // Clean YouTube embed video id
    duration_minutes: 74,
    duration_formatted: '1h 14m',
    faculty_name: 'Er. Rakesh Verma',
    lecture_number: 14,
    is_live: true,
    created_at: '2025-10-24',
  },
  {
    id: 'lec-02',
    institute_id: 'inst-01',
    batch_id: 'batch-02',
    title: 'Reaction Mechanisms: Nucleophilic Attack',
    subject: 'Organic Chemistry',
    provider: 'youtube',
    video_id_or_url: 'jNQXAC9IVRw',
    duration_minutes: 58,
    duration_formatted: '58m',
    faculty_name: 'Dr. Manisha Gupta',
    lecture_number: 9,
    is_live: false,
    created_at: '2025-10-23',
  },
  {
    id: 'lec-03',
    institute_id: 'inst-01',
    batch_id: 'batch-03',
    title: 'Definite Integrals & Area Under Curves',
    subject: 'Mathematics',
    provider: 'youtube',
    video_id_or_url: 'M7lc1UVf-VE',
    duration_minutes: 65,
    duration_formatted: '1h 05m',
    faculty_name: 'Prof. Arvind Swaminathan',
    lecture_number: 12,
    is_live: false,
    created_at: '2025-10-21',
  },
];

const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg-01',
    institute_id: 'inst-01',
    batch_id: 'batch-01',
    title: 'Rotational Dynamics DPP-04',
    subject: 'Physics',
    instructions: 'Attempt all 25 questions. Pay special attention to torque equilibrium problems 18-24.',
    due_date: '2025-11-02',
    due_label: 'Due Tomorrow',
    total_marks: 100,
    question_count: 25,
    created_by: 'Er. Rakesh Verma',
    created_at: '2025-10-24',
    submission_status: 'pending',
  },
  {
    id: 'asg-02',
    institute_id: 'inst-01',
    batch_id: 'batch-02',
    title: 'Thermodynamics Practice Sheet B',
    subject: 'Chemistry',
    instructions: 'Solve enthalpy and entropy cyclical calculations. Show work for full credit.',
    due_date: '2025-11-05',
    due_label: 'Due in 4 Days',
    total_marks: 50,
    question_count: 20,
    created_by: 'Dr. Manisha Gupta',
    created_at: '2025-10-23',
    submission_status: 'pending',
  },
];

const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-01',
    assignment_id: 'asg-01',
    student_id: 's4',
    student_name: 'Aryan Kapoor',
    roll_number: '#04',
    submission_text: 'Attached solution PDF with derivations for questions 1 through 25.',
    file_url: 'https://example.com/solutions/aryan_dpp04.pdf',
    status: 'submitted',
    submitted_at: '2025-10-24T14:30:00Z',
  },
];

const AcademicContext = createContext<AcademicContextType | undefined>(undefined);

export const AcademicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeInstitute } = useAuth();

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [materials, setMaterials] = useState<StudyMaterial[]>(INITIAL_MATERIALS);
  const [lectures, setLectures] = useState<Lecture[]>(INITIAL_LECTURES);
  const [activeLecture, setActiveLecture] = useState<Lecture | null>(null);
  const [offlineLectureIds, setOfflineLectureIds] = useState<string[]>(['lec-02']);
  const [assignments, setAssignments] = useState<Assignment[]>(INITIAL_ASSIGNMENTS);
  const [submissions, setSubmissions] = useState<Submission[]>(INITIAL_SUBMISSIONS);

  // 1. Attendance Methods
  const markAttendance = async (studentId: string, status: 'P' | 'A' | 'L', remarks?: string) => {
    setAttendanceRecords((prev) =>
      prev.map((r) =>
        r.student_id === studentId
          ? { ...r, status, remarks: remarks || r.remarks }
          : r
      )
    );

    if (isSupabaseConfigured) {
      try {
        await supabase.from('attendance').upsert({
          student_id: studentId,
          status,
          remarks,
          institute_id: activeInstitute?.id,
          date: new Date().toISOString().split('T')[0],
        });
      } catch {
        // gracefully handle in local state
      }
    }
  };

  const correctAttendance = async (recordId: string, newStatus: 'P' | 'A' | 'L', reason: string) => {
    setAttendanceRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? { ...r, status: newStatus, remarks: `Corrected: ${reason}` }
          : r
      )
    );

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('attendance')
          .update({ status: newStatus, remarks: `Corrected: ${reason}` })
          .eq('id', recordId);
      } catch {
        // gracefully fallback
      }
    }
  };

  const markBatchAllPresent = async (batchId: string) => {
    setAttendanceRecords((prev) =>
      prev.map((r) => (r.batch_id === batchId ? { ...r, status: 'P' } : r))
    );
  };

  // 2. Study Materials
  const uploadMaterial = async (data: Omit<StudyMaterial, 'id' | 'institute_id' | 'created_at'>) => {
    const newMaterial: StudyMaterial = {
      ...data,
      id: `mat-${Date.now()}`,
      institute_id: activeInstitute?.id || 'inst-01',
      created_at: new Date().toISOString(),
    };
    setMaterials((prev) => [newMaterial, ...prev]);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('study_materials').insert({
          ...data,
          institute_id: activeInstitute?.id,
        });
      } catch {
        // gracefully fallback
      }
    }
  };

  const downloadMaterial = async (id: string) => {
    // Simulated PDF download
  };

  // 3. Video Lectures
  const openPlayer = (lecture: Lecture) => {
    setActiveLecture(lecture);
  };

  const closePlayer = () => {
    setActiveLecture(null);
  };

  const addLecture = async (data: Omit<Lecture, 'id' | 'institute_id' | 'created_at'>) => {
    const newLecture: Lecture = {
      ...data,
      id: `lec-${Date.now()}`,
      institute_id: activeInstitute?.id || 'inst-01',
      created_at: new Date().toISOString(),
    };
    setLectures((prev) => [newLecture, ...prev]);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('lectures').insert({
          ...data,
          institute_id: activeInstitute?.id,
        });
      } catch {
        // fallback
      }
    }
  };

  const toggleOfflineDownload = (lectureId: string) => {
    setOfflineLectureIds((prev) =>
      prev.includes(lectureId) ? prev.filter((id) => id !== lectureId) : [...prev, lectureId]
    );
  };

  // 4. Assignments & Submissions
  const createAssignment = async (data: Omit<Assignment, 'id' | 'institute_id' | 'created_at'>) => {
    const newAssignment: Assignment = {
      ...data,
      id: `asg-${Date.now()}`,
      institute_id: activeInstitute?.id || 'inst-01',
      submission_status: 'pending',
      created_at: new Date().toISOString(),
    };
    setAssignments((prev) => [newAssignment, ...prev]);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('assignments').insert({
          ...data,
          institute_id: activeInstitute?.id,
        });
      } catch {
        // fallback
      }
    }
  };

  const submitAssignment = async (assignmentId: string, text: string) => {
    const newSub: Submission = {
      id: `sub-${Date.now()}`,
      assignment_id: assignmentId,
      student_id: 's4',
      student_name: 'Aryan Kapoor',
      roll_number: '#04',
      submission_text: text,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    };

    setSubmissions((prev) => [newSub, ...prev]);
    setAssignments((prev) =>
      prev.map((a) => (a.id === assignmentId ? { ...a, submission_status: 'submitted' } : a))
    );
  };

  const gradeSubmission = async (submissionId: string, marks: number, feedback: string) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? { ...s, status: 'graded', marks_obtained: marks, feedback }
          : s
      )
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
        uploadMaterial,
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
