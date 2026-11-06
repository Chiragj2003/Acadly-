import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
  ScrollView,
  TextInput,
  Share,
  Linking,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  BookOpen,
  Users,
  Clock,
  CheckCircle2,
  Video,
  FileText,
  Save,
  MessageSquare,
  Plus,
  Award,
  Upload,
  Share2,
  Copy,
  GraduationCap,
  LogOut,
  Calendar,
  ChevronRight,
  X,
  Edit2,
  Home,
  ClipboardCheck,
  Check,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
  Search,
  Phone,
  Star,
  ShieldCheck,
  FileQuestion,
  Download,
  AlertTriangle,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useAuth } from '@/context/AuthContext';
import { useAcademic } from '@/context/AcademicContext';
import {
  ScreenWrapper,
  AttendanceToggle,
  Badge,
  BottomTabBar,
  type TabItem,
  type AttendanceStatus,
} from '@/components/ui';
import {
  VideoPlayerModal,
  StudyMaterialsViewer,
  AssignmentsModule,
  AttendanceCorrectionModal,
  DocumentReaderModal,
  InteractiveDppBuilderModal,
  type InteractiveQuestion,
} from '@/components/academic';
import { DUMMY_PDF_CATALOG, type PDFDocumentContent } from '@/services/dummyPdfService';
import { type AttendanceRecord } from '@/types/database';

const TEACHER_BATCHES = [
  {
    id: 'batch-01',
    name: 'Class 12 • JEE Advanced (Morning)',
    time: '04:30 PM - 06:00 PM',
    subject: 'Physics • Rotational Dynamics',
    room: 'Room 204 • Hybrid',
    count: 28,
  },
  {
    id: 'batch-02',
    name: 'JEE Rankers Cohort (Evening)',
    time: '06:15 PM - 07:45 PM',
    subject: 'Physics • Electromagnetic Induction',
    room: 'Room 102 • Lab 1',
    count: 18,
  },
  {
    id: 'batch-03',
    name: 'Class 11 Foundation Batch',
    time: '08:00 PM - 09:15 PM',
    subject: 'Mechanics • Laws of Motion',
    room: 'Virtual Room A',
    count: 22,
  },
];

export default function PinterestTeacherScreen() {
  const { isAuthorized, isLoading } = useRoleGuard(["teacher","admin"]);
  const router = useRouter();
  const { activeInstitute, signOut } = useAuth();
  const {
    attendanceRecords,
    markAttendance,
    markBatchAllPresent,
    addLecture,
    joinRequests,
    teacherProfile,
    studentsRoster,
    updateStudentFeeStatus,
    recordTestMarks,
    uploadPDFMaterial,
    teacherMode,
    setTeacherMode,
    linkedCoachingCode,
    linkToCoachingCenter,
    assignments,
    submissions,
    gradeSubmission,
    createAssignment,
  } = useAcademic();

  // Bottom Navigation Tabs (5 Tabs)
  const [activeTab, setActiveTab] = useState<'home' | 'roster' | 'publish' | 'exams_chat' | 'profile'>('home');

  // Roll Call & Absentee Ping
  const [waParentPing, setWaParentPing] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedRecordForCorrection, setSelectedRecordForCorrection] = useState<AttendanceRecord | null>(null);

  // Dual Mode Switcher Modal
  const [isDualModeModalOpen, setIsDualModeModalOpen] = useState(false);
  const [instituteCodeInput, setInstituteCodeInput] = useState(linkedCoachingCode || 'BLOOM2026');

  // Video Lecture Modal
  const [isAddLectureOpen, setIsAddLectureOpen] = useState(false);
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureSubject, setLectureSubject] = useState('Physics');
  const [lectureVideoId, setLectureVideoId] = useState('');
  const [lectureDuration, setLectureDuration] = useState('60');

  // PDF Upload Modal
  const [isUploadPdfOpen, setIsUploadPdfOpen] = useState(false);
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfSubject, setPdfSubject] = useState('Physics');
  const [pdfCategory, setPdfCategory] = useState<'notes' | 'formula_sheet' | 'pyq' | 'dpp'>('notes');
  const [pickedPdfFile, setPickedPdfFile] = useState<{ name: string; size?: string } | null>(null);

  // Exam Marks & Auto-Rank Modal
  const [isExamMarksModalOpen, setIsExamMarksModalOpen] = useState(false);
  const [examTestName, setExamTestName] = useState('Unit Assessment #04 (Mechanics)');
  const [examSubject, setExamSubject] = useState('Physics');
  const [examMaxScore, setExamMaxScore] = useState('100');
  const [studentMarksInput, setStudentMarksInput] = useState<Record<string, string>>({
    'stud-amelia': '94',
    'stud-kabir': '96',
    'stud-rohan': '82',
  });

  // Homework Grading Modal
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [gradingScoreInput, setGradingScoreInput] = useState('24');
  const [gradingFeedbackInput, setGradingFeedbackInput] = useState('Excellent precision on derivation step 2. Clear diagrams!');

  // Create Assignment Modal
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [newAssignTitle, setNewAssignTitle] = useState('');
  const [newAssignSubject, setNewAssignSubject] = useState('Physics');
  const [newAssignMaxMarks, setNewAssignMaxMarks] = useState('25');
  const [newAssignDueDays, setNewAssignDueDays] = useState('2');
  const [newAssignPdfName, setNewAssignPdfName] = useState<string | null>(null);

  // Active Batch Filter
  const [selectedBatchId, setSelectedBatchId] = useState('batch-01');
  const currentBatch = TEACHER_BATCHES.find((b) => b.id === selectedBatchId) || TEACHER_BATCHES[0];

  // In-App PDF Reader Modal State
  const [selectedReaderDoc, setSelectedReaderDoc] = useState<PDFDocumentContent | null>(null);

  // In-App Interactive DPP / Quiz Builder Modal State
  const [isInteractiveDppOpen, setIsInteractiveDppOpen] = useState(false);

  // Student Directory Search & Fee Filter
  const [directorySearchQuery, setDirectorySearchQuery] = useState('');
  const [directoryFeeFilter, setDirectoryFeeFilter] = useState<'all' | 'paid' | 'pending'>('all');

  const pendingJoinCount = joinRequests.filter((r) => r.status === 'pending').length;

  const handleLogout = () => {
    Alert.alert(
      'Sign Out 🚪',
      'Are you sure you want to sign out from the Teacher Desk?',
      [
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Share Teacher Code via Native Share Sheet
  const handleShareTeacherCode = async () => {
    try {
      await Share.share({
        message: `Join my tuition batch on Acadly! 📚 Use Teacher Code: ${teacherProfile.teacherCode} to link directly to my classroom, attendance & doubt chats.`,
      });
    } catch {
      Alert.alert('Teacher Code', `Your Teacher Code is: ${teacherProfile.teacherCode}`);
    }
  };

  // Copy Teacher Code
  const handleCopyTeacherCode = () => {
    Alert.alert('Teacher Code Copied 📋', `${teacherProfile.teacherCode}\nShare this with new students to enroll them.`);
  };

  // Coaching Center Link
  const handleLinkCoachingCenter = async () => {
    if (!instituteCodeInput.trim()) {
      Alert.alert('Validation Error', 'Please enter a Coaching Invite Code.');
      return;
    }
    const res = await linkToCoachingCenter(instituteCodeInput);
    if (res.success) {
      setIsDualModeModalOpen(false);
      Alert.alert('Coaching Linked! 🏫', `Connected as faculty to ${res.instituteName}`);
    } else {
      Alert.alert('Not Found', res.error || 'Could not verify that coaching code.');
    }
  };

  // Attendance Handlers
  const handleStatusChange = async (studentId: string, status: AttendanceStatus) => {
    await markAttendance(studentId, status);
  };

  const handlePublishInteractiveDpp = async (dppData: {
    title: string;
    subject: string;
    batchId: string;
    totalMarks: number;
    questions: InteractiveQuestion[];
  }) => {
    const due = new Date();
    due.setDate(due.getDate() + 2);

    await createAssignment({
      batch_id: selectedBatchId,
      title: dppData.title,
      subject: dppData.subject,
      instructions: `Interactive Quiz Form (${dppData.questions.length} Questions: MCQ, True/False & Numerical). Answer directly in app.`,
      description: `Interactive Quiz Form (${dppData.questions.length} Questions: MCQ, True/False & Numerical). Answer directly in app.`,
      due_date: due.toISOString(),
      due_label: 'Due in 2 days',
      total_marks: dppData.totalMarks,
      max_marks: dppData.totalMarks,
      question_count: dppData.questions.length,
      created_by: teacherProfile.fullName,
    });

    Alert.alert(
      'In-App Quiz Published! ⚡',
      `Interactive DPP "${dppData.title}" with ${dppData.questions.length} questions is now live for ${currentBatch.name}.`
    );
  };

  const handleCommitAttendance = async () => {
    setIsSyncing(true);
    try {
      if (waParentPing) {
        Alert.alert(
          'Roll Call Recorded',
          'Attendance recorded in the roster. Absentee SMS & WhatsApp gateway dispatch is scheduled for v2.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Attendance Recorded', 'Attendance recorded safely in the roster.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Pick Document for PDF Upload
  const handlePickPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        const sizeMb = file.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '1.8 MB';
        setPickedPdfFile({ name: file.name, size: sizeMb });
        if (!pdfTitle.trim()) {
          setPdfTitle(file.name.replace('.pdf', '').replace(/_/g, ' '));
        }
      }
    } catch {
      Alert.alert('Picker Error', 'Could not access documents.');
    }
  };

  const handleConfirmPdfUpload = async () => {
    if (!pdfTitle.trim()) {
      Alert.alert('Required', 'Please enter a title for the study document.');
      return;
    }
    const fileName = pickedPdfFile?.name || `${pdfTitle.replace(/\s+/g, '_')}.pdf`;
    const fileSize = pickedPdfFile?.size || '2.4 MB';
    await uploadPDFMaterial(pdfTitle, pdfSubject, pdfCategory, fileName, fileSize);
    setIsUploadPdfOpen(false);
    setPdfTitle('');
    setPickedPdfFile(null);
    Alert.alert('PDF Published! 📄', 'All linked batch students can now view and download this note.');
  };

  // Video Lecture
  const handleAddLecture = async () => {
    if (!lectureTitle.trim() || !lectureVideoId.trim()) {
      Alert.alert('Validation Error', 'Title and YouTube Video ID are required.');
      return;
    }
    await addLecture({
      batch_id: 'batch-01',
      title: lectureTitle,
      subject: lectureSubject,
      provider: 'youtube',
      video_id_or_url: lectureVideoId.replace('https://youtu.be/', '').replace('https://www.youtube.com/watch?v=', ''),
      duration_minutes: parseInt(lectureDuration) || 60,
      duration_formatted: `${lectureDuration}m`,
      faculty_name: teacherProfile.fullName,
    });
    setIsAddLectureOpen(false);
    setLectureTitle('');
    setLectureVideoId('');
    Alert.alert('Lecture Published', 'New video lecture linked and published to batch.');
  };

  // Exam Marks & Auto-Rank
  const handleSaveExamMarks = async () => {
    if (!examTestName.trim()) {
      Alert.alert('Required', 'Please enter the test assessment title.');
      return;
    }
    const max = parseInt(examMaxScore) || 100;
    const marksList = studentsRoster.map((s) => {
      const scoreVal = parseInt(studentMarksInput[s.id] || '85') || 0;
      return {
        studentId: s.id,
        score: Math.min(scoreVal, max),
      };
    });

    await recordTestMarks(examTestName, examSubject, max, marksList);
    setIsExamMarksModalOpen(false);
    Alert.alert(
      'Exam Marks Recorded! 🏆',
      'Batch average, topper, and student percentile ranks computed. Live comparison charts updated across all student dashboards.'
    );
  };

  // Create Assignment
  const handleCreateAssignment = async () => {
    if (!newAssignTitle.trim()) {
      Alert.alert('Required', 'Please enter assignment title.');
      return;
    }
    const due = new Date();
    due.setDate(due.getDate() + (parseInt(newAssignDueDays) || 2));

    await createAssignment({
      batch_id: 'batch-01',
      title: newAssignTitle,
      subject: newAssignSubject,
      instructions: 'Solve all problem sets and upload handwritten PDF solution.',
      description: 'Solve all problem sets and upload handwritten PDF solution.',
      due_date: due.toISOString(),
      due_label: `Due in ${newAssignDueDays} days`,
      total_marks: parseInt(newAssignMaxMarks) || 25,
      max_marks: parseInt(newAssignMaxMarks) || 25,
      question_count: 5,
      created_by: teacherProfile.fullName,
      question_paper_url: newAssignPdfName ? `https://storage.acadly.app/${newAssignPdfName}` : undefined,
    });

    setIsCreateAssignmentOpen(false);
    setNewAssignTitle('');
    setNewAssignPdfName(null);
    Alert.alert('DPP Created! ⚡', 'Assignment published with instant push notification to batch.');
  };

  // Grade Submission
  const handleConfirmGrade = async () => {
    if (!selectedSubmissionId) return;
    const marks = parseInt(gradingScoreInput) || 0;
    await gradeSubmission(selectedSubmissionId, marks, gradingFeedbackInput);
    setIsGradingModalOpen(false);
    setSelectedSubmissionId(null);
    Alert.alert('Submission Graded ✅', `Recorded ${marks} marks with teacher observation.`);
  };

  // Bottom Tabs Configuration
  const tabs: TabItem[] = [
    {
      key: 'home',
      label: 'Home',
      icon: (color, size) => <Home color={color} size={size} />,
      badgeCount: pendingJoinCount > 0 ? pendingJoinCount : undefined,
    },
    {
      key: 'roster',
      label: 'Roster',
      icon: (color, size) => <ClipboardCheck color={color} size={size} />,
    },
    {
      key: 'publish',
      label: 'Publish',
      icon: (color, size) => <Upload color={color} size={size} />,
      badgeCount: submissions.filter((s) => s.status === 'submitted').length,
    },
    {
      key: 'exams_chat',
      label: 'Exams & Chat',
      icon: (color, size) => <MessageSquare color={color} size={size} />,
      badgeCount: 1,
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: (color, size) => <GraduationCap color={color} size={size} />,
    },
  ];

  
  if (isLoading || !isAuthorized) {
    return (
      <ScreenWrapper headerProps={{ title: 'Teacher Desk' }}>
        <View className="flex-1 items-center justify-center p-8">
          <ActivityIndicator size="small" color="#2563EB" />
          <Text className="text-xs text-slate-500 mt-2 font-medium">Verifying authorization...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      headerProps={{
        title: teacherMode === 'solo' ? 'Solo Tutor Desk' : 'Faculty Command Desk',
        instituteName: teacherMode === 'solo' ? 'Private Tuition' : (activeInstitute?.name || 'Bloom Science Academy'),
        profileInitials: 'RV',
        onNotificationPress: () => Alert.alert('Faculty Notices', 'Monthly syllabus benchmark review by Friday 6 PM.'),
        onProfilePress: () => {
          Alert.alert(
            teacherProfile.fullName,
            `${teacherProfile.qualification}\nTeacher Code: ${teacherProfile.teacherCode}\nMode: ${
              teacherMode === 'solo' ? 'Solo Individual Tutor' : 'Coaching Institute Faculty'
            }`,
            [
              { text: 'Sign Out 🚪', style: 'destructive', onPress: handleLogout },
              { text: 'Close', style: 'cancel' },
            ]
          );
        },
        onLogoutPress: handleLogout,
      }}
      contentContainerClassName="gap-3.5 px-4 py-4"
      contentContainerStyle={{ paddingBottom: 24 }}
      footer={
        <BottomTabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(key) => setActiveTab(key as any)}
          accentColor="#2563EB"
        />
      }
    >
      {/* Active Batch & Timing Focus Switcher */}
      <View className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs">
        <View className="flex-row items-center justify-between mb-2 px-1">
          <View className="flex-row items-center gap-1.5">
            <Clock size={13} color="#2563EB" />
            <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Batch & Schedule Focus
            </Text>
          </View>
          <View className="bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
            <Text className="text-[10px] font-bold text-blue-700">
              {currentBatch.time}
            </Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {TEACHER_BATCHES.map((b) => {
              const isSelected = selectedBatchId === b.id;
              return (
                <TouchableOpacity
                  key={b.id}
                  activeOpacity={0.85}
                  onPress={() => setSelectedBatchId(b.id)}
                  className={`px-3 py-2 rounded-xl border flex-row items-center gap-2 ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 shadow-xs'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <View className="items-start">
                    <Text
                      className={`text-xs font-extrabold ${
                        isSelected ? 'text-white' : 'text-slate-800'
                      }`}
                      numberOfLines={1}
                    >
                      {b.name.split(' • ')[0]}
                    </Text>
                    <Text
                      className={`text-[10px] ${
                        isSelected ? 'text-blue-100 font-medium' : 'text-slate-500'
                      }`}
                    >
                      {b.time.split(' - ')[0]} • {b.count} Students
                    </Text>
                  </View>
                  {isSelected && <Check size={14} color="#FFFFFF" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* ================= TAB 1: HOME (COMMAND DESK) ================= */}
        {activeTab === 'home' && (
          <View className="gap-3.5">
            {/* 1. Shareable Teacher Code Hero Card */}
            <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <View className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {teacherMode === 'solo' ? 'Solo Tutor Workspace' : 'Institute Faculty Mode'}
                  </Text>
                </View>

                {/* Mode Switch Button */}
                <TouchableOpacity
                  onPress={() => setIsDualModeModalOpen(true)}
                  className="bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 flex-row items-center gap-1 active:scale-95"
                >
                  <Layers size={12} color="#2563EB" />
                  <Text className="text-[11px] font-bold text-blue-600">
                    {teacherMode === 'solo' ? 'Solo' : 'Coaching'} • Switch
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center gap-3.5 mb-4">
                <View className="w-14 h-14 rounded-2xl bg-blue-600 items-center justify-center shadow-xs">
                  <Text className="text-lg font-black text-white">RV</Text>
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-base font-extrabold text-slate-900" numberOfLines={1}>
                    {teacherProfile.fullName}
                  </Text>
                  <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
                    {teacherProfile.qualification} • {teacherProfile.experienceYears} Years Exp
                  </Text>
                  <Text className="text-[11px] font-semibold text-blue-600 mt-0.5">
                    {teacherProfile.specializationSubjects.join(' • ')}
                  </Text>
                </View>
              </View>

              {/* Shareable Teacher Code Strip */}
              <View className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 flex-row items-center justify-between">
                <View>
                  <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Shareable Teacher Code
                  </Text>
                  <Text className="text-base font-black text-blue-600 tracking-wider">
                    {teacherProfile.teacherCode}
                  </Text>
                </View>

                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={handleCopyTeacherCode}
                    className="p-2 bg-white rounded-xl border border-slate-200 active:scale-95"
                  >
                    <Copy size={14} color="#475569" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleShareTeacherCode}
                    className="bg-blue-600 px-3.5 py-2 rounded-xl flex-row items-center gap-1.5 active:scale-95 shadow-xs"
                  >
                    <Share2 size={13} color="#ffffff" />
                    <Text className="text-xs font-bold text-white">Share Code</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Pending Verification Notice */}
              {pendingJoinCount > 0 && (
                <TouchableOpacity
                  onPress={() => router.push('/verify-students')}
                  className="mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-3 flex-row items-center justify-between active:scale-98"
                >
                  <View className="flex-row items-center gap-2 flex-1 pr-2">
                    <View className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <Text className="text-xs font-bold text-amber-900">
                      {pendingJoinCount} student{pendingJoinCount > 1 ? 's' : ''} waiting for batch admission
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1 bg-amber-200/60 px-2 py-0.5 rounded-lg">
                    <Text className="text-[10px] font-bold text-amber-900">Review</Text>
                    <ChevronRight size={12} color="#78350f" />
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* 2. Today's Classroom Schedule */}
            <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Calendar size={16} color="#2563EB" />
                  <Text className="text-sm font-bold text-slate-900">Today's Class Schedule</Text>
                </View>
                <Badge label="3 Sessions" variant="info" />
              </View>

              <View className="gap-2.5">
                {[
                  { batch: 'Class 12 • JEE Advanced (Morning)', subject: 'Physics • Rotational Dynamics', time: '04:30 PM - 06:00 PM', count: '28 Students', active: true },
                  { batch: 'JEE Advanced Rankers', subject: 'Physics • Electromagnetic Induction', time: '06:15 PM - 07:45 PM', count: '18 Students', active: false },
                  { batch: 'Class 11 Foundation', subject: 'Mechanics • Laws of Motion', time: '08:00 PM - 09:15 PM', count: '22 Students', active: false },
                ].map((item, idx) => (
                  <View
                    key={idx}
                    className={`p-3.5 rounded-2xl border flex-row items-center justify-between ${
                      item.active ? 'bg-blue-50/60 border-blue-200' : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <View className="flex-1 pr-2">
                      <View className="flex-row items-center gap-2 mb-0.5">
                        <Text className="text-xs font-bold text-slate-900">{item.batch}</Text>
                        {item.active && (
                          <View className="bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-200">
                            <Text className="text-[9px] font-bold text-emerald-800">Next Up</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-[11px] text-slate-500">{item.subject}</Text>
                      <View className="flex-row items-center gap-2 mt-1">
                        <View className="flex-row items-center gap-1">
                          <Clock size={11} color="#64748B" />
                          <Text className="text-[10px] font-medium text-slate-500">{item.time}</Text>
                        </View>
                        <Text className="text-[10px] text-slate-400">•</Text>
                        <Text className="text-[10px] font-medium text-slate-500">{item.count}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => setActiveTab('roster')}
                      className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 active:scale-95"
                    >
                      <Text className="text-xs font-bold text-blue-600">Roll Call →</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {/* 3. Quick Action Navigation Cards */}
            <View className="gap-2">
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                Quick Shortcuts
              </Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => setActiveTab('roster')}
                  className="flex-1 bg-white border border-slate-200/90 p-3.5 rounded-2xl items-center gap-2 active:scale-98 shadow-xs"
                >
                  <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center">
                    <ClipboardCheck size={18} color="#2563EB" />
                  </View>
                  <Text className="text-xs font-bold text-slate-800 text-center">Daily Roll Call</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setIsCreateAssignmentOpen(true)}
                  className="flex-1 bg-white border border-slate-200/90 p-3.5 rounded-2xl items-center gap-2 active:scale-98 shadow-xs"
                >
                  <View className="w-10 h-10 rounded-xl bg-emerald-50 items-center justify-center">
                    <Plus size={18} color="#059669" />
                  </View>
                  <Text className="text-xs font-bold text-slate-800 text-center">New DPP</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setIsExamMarksModalOpen(true)}
                  className="flex-1 bg-white border border-slate-200/90 p-3.5 rounded-2xl items-center gap-2 active:scale-98 shadow-xs"
                >
                  <View className="w-10 h-10 rounded-xl bg-amber-50 items-center justify-center">
                    <Award size={18} color="#d97706" />
                  </View>
                  <Text className="text-xs font-bold text-slate-800 text-center">Test Marks</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/chat')}
                  className="flex-1 bg-white border border-slate-200/90 p-3.5 rounded-2xl items-center gap-2 active:scale-98 shadow-xs"
                >
                  <View className="w-10 h-10 rounded-xl bg-purple-50 items-center justify-center">
                    <MessageSquare size={18} color="#7c3aed" />
                  </View>
                  <Text className="text-xs font-bold text-slate-800 text-center">Doubt Chat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ================= TAB 2: ROSTER & ATTENDANCE ================= */}
        {activeTab === 'roster' && (() => {
          const presentCount = attendanceRecords.filter((r) => r.status === 'P' || r.status === 'E').length;
          const absentCount = attendanceRecords.filter((r) => r.status === 'A').length;
          const lateCount = attendanceRecords.filter((r) => r.status === 'L').length;

          return (
            <View className="gap-3.5">
              {/* Roll Call Hub Card */}
              <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3.5">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-2">
                    <Text className="text-xs font-semibold text-slate-400">Classroom Roll Call</Text>
                    <Text className="text-base font-extrabold text-slate-900" numberOfLines={1}>
                      {currentBatch.name}
                    </Text>
                  </View>

                  {/* Live Attendance Counter Badges */}
                  <View className="flex-row items-center gap-1.5 shrink-0">
                    <View className="bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-lg">
                      <Text className="text-[10px] font-extrabold text-emerald-800">{presentCount} Present</Text>
                    </View>
                    {absentCount > 0 && (
                      <View className="bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-lg">
                        <Text className="text-[10px] font-extrabold text-rose-800">{absentCount} Absent</Text>
                      </View>
                    )}
                    {lateCount > 0 && (
                      <View className="bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg">
                        <Text className="text-[10px] font-extrabold text-amber-800">{lateCount} Late</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* In-App Absence Notification Toggle */}
                <View className="flex-row items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                    <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center">
                      <MessageSquare size={14} color="#2563EB" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-slate-800">In-App Absence Alert</Text>
                      <Text className="text-[11px] text-slate-500">Auto-dispatch in-app alert to parent portal on absence</Text>
                    </View>
                  </View>
                  <Switch
                    value={waParentPing}
                    onValueChange={setWaParentPing}
                    trackColor={{ false: '#cbd5e1', true: '#2563EB' }}
                  />
                </View>

                {/* Student Roll List (Tapping ANY student row navigates to 360° diagnostics) */}
                <View className="gap-2">
                  <View className="flex-row items-center justify-between px-1">
                    <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Enrolled Students ({attendanceRecords.length})
                    </Text>
                    <Text className="text-[11px] text-slate-500 font-medium">
                      Tap name for 360° diagnostics
                    </Text>
                  </View>

                  {attendanceRecords.map((record) => (
                    <View
                      key={record.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex-row items-center justify-between gap-2"
                    >
                      <TouchableOpacity
                        onPress={() => router.push({ pathname: '/student-detail', params: { studentId: record.student_id } })}
                        className="flex-row items-center gap-2.5 flex-1 min-w-0"
                      >
                        {/* Auto-sized Roll Container that NEVER overflows */}
                        <View className="min-w-[36px] h-8 px-1.5 rounded-xl bg-white border border-slate-200 items-center justify-center shrink-0">
                          <Text className="text-[11px] font-bold text-blue-600 font-mono" numberOfLines={1}>
                            {record.roll_number.replace('ROLL-', '#').replace('STU-', '#')}
                          </Text>
                        </View>
                        <View className="flex-1 min-w-0">
                          <View className="flex-row items-center gap-1.5">
                            <Text className="text-xs font-bold text-slate-900" numberOfLines={1}>
                              {record.student_name}
                            </Text>
                            <TouchableOpacity
                              onPress={() => setSelectedRecordForCorrection(record)}
                              hitSlop={8}
                            >
                              <Edit2 size={12} color="#64748B" />
                            </TouchableOpacity>
                          </View>
                          <Text className="text-[11px] text-slate-500" numberOfLines={1}>
                            {record.remarks || 'Tap to inspect diagnostic report & marks'}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <AttendanceToggle
                        value={record.status === 'E' ? 'P' : record.status}
                        onChange={(status) => handleStatusChange(record.student_id, status)}
                      />
                    </View>
                  ))}
                </View>

                {/* Commit & Broadcast Roll Call */}
                <TouchableOpacity
                  onPress={handleCommitAttendance}
                  disabled={isSyncing}
                  className="bg-blue-600 py-3 rounded-2xl items-center flex-row justify-center gap-2 shadow-xs active:scale-98"
                >
                  <Save size={16} color="#ffffff" />
                  <Text className="text-sm font-bold text-white">
                    {isSyncing ? 'Syncing to Database...' : 'Commit & Dispatch Roll Call'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}

        {/* ================= TAB 3: PUBLISH (STUDY HUB & GRADING) ================= */}
        {activeTab === 'publish' && (
          <View className="gap-3.5">
            {/* Interactive DPP Builder Featured Card */}
            <View className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-3xl shadow-xs">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <View className="w-8 h-8 rounded-xl bg-white/20 items-center justify-center">
                    <FileQuestion size={18} color="#ffffff" />
                  </View>
                  <View>
                    <Text className="text-sm font-black text-white">In-App Interactive DPP & Quiz Builder</Text>
                    <Text className="text-[11px] text-blue-100">Create forms like Google Forms inside Acadly</Text>
                  </View>
                </View>
                <View className="bg-white/20 px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-white">MCQ & T/F</Text>
                </View>
              </View>
              <Text className="text-xs text-blue-50/90 leading-relaxed mb-3">
                Craft questions with multi-choice options, correct answers key, true/false, and short answer with instant marking.
              </Text>
              <TouchableOpacity
                onPress={() => setIsInteractiveDppOpen(true)}
                className="bg-white py-2.5 px-4 rounded-2xl items-center flex-row justify-center gap-2 shadow-xs active:scale-98"
              >
                <Plus size={16} color="#2563EB" />
                <Text className="text-xs font-black text-blue-600">Create In-App Interactive DPP →</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Upload Buttons */}
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setIsUploadPdfOpen(true)}
                className="flex-1 bg-white border border-slate-200/90 p-3.5 rounded-2xl items-center gap-2 shadow-xs active:scale-98"
              >
                <View className="w-9 h-9 rounded-xl bg-emerald-50 items-center justify-center">
                  <FileText size={18} color="#059669" />
                </View>
                <Text className="text-xs font-bold text-slate-800">+ Upload PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsCreateAssignmentOpen(true)}
                className="flex-1 bg-white border border-slate-200/90 p-3.5 rounded-2xl items-center gap-2 shadow-xs active:scale-98"
              >
                <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center">
                  <Plus size={18} color="#2563EB" />
                </View>
                <Text className="text-xs font-bold text-slate-800">+ Offline DPP</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsAddLectureOpen(true)}
                className="flex-1 bg-white border border-slate-200/90 p-3.5 rounded-2xl items-center gap-2 shadow-xs active:scale-98"
              >
                <View className="w-9 h-9 rounded-xl bg-rose-50 items-center justify-center">
                  <Video size={18} color="#e11d48" />
                </View>
                <Text className="text-xs font-bold text-slate-800">+ Video Class</Text>
              </TouchableOpacity>
            </View>

            {/* Submissions Review & Grading Module */}
            <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Award size={16} color="#2563EB" />
                  <Text className="text-sm font-bold text-slate-900">Student Homework Submissions</Text>
                </View>
                <Badge
                  label={`${submissions.filter((s) => s.status === 'submitted').length} Pending`}
                  variant="warning"
                />
              </View>

              <View className="gap-2.5">
                {submissions.map((sub) => {
                  const assignment = assignments.find((a) => a.id === sub.assignment_id);
                  const isGraded = sub.status === 'graded';
                  return (
                    <View
                      key={sub.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex-row items-center justify-between"
                    >
                      <View className="flex-1 pr-2">
                        <View className="flex-row items-center gap-2 mb-0.5">
                          <Text className="text-xs font-bold text-slate-900">{sub.student_name}</Text>
                          <View
                            className={`px-2 py-0.5 rounded-md ${
                              isGraded ? 'bg-emerald-100' : 'bg-amber-100'
                            }`}
                          >
                            <Text
                              className={`text-[10px] font-bold ${
                                isGraded ? 'text-emerald-800' : 'text-amber-800'
                              }`}
                            >
                              {isGraded ? `${sub.marks_obtained}/${assignment?.max_marks || 25} Marks` : 'Pending Review'}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-[11px] text-slate-600 font-medium" numberOfLines={1}>
                          {assignment?.title || 'Mechanics DPP 04'}
                        </Text>
                        
                        {/* In-App Document Preview Button */}
                        <TouchableOpacity
                          onPress={() => {
                            const match = DUMMY_PDF_CATALOG.find((d) => d.subject.toLowerCase().includes(assignment?.subject?.toLowerCase() || 'physics')) || DUMMY_PDF_CATALOG[0];
                            setSelectedReaderDoc(match);
                          }}
                          className="flex-row items-center gap-1.5 mt-1.5 self-start bg-blue-50 px-2 py-1 rounded-lg border border-blue-200/60 active:scale-95"
                        >
                          <FileText size={11} color="#2563EB" />
                          <Text className="text-[10px] font-semibold text-blue-700" numberOfLines={1}>
                            Open & Review: {sub.file_name || 'handwritten_solution.pdf'} ↗
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        onPress={() => {
                          setSelectedSubmissionId(sub.id);
                          setGradingScoreInput(sub.marks_obtained ? sub.marks_obtained.toString() : '23');
                          setGradingFeedbackInput(sub.feedback || 'Well attempted derivation steps.');
                          setIsGradingModalOpen(true);
                        }}
                        className={`px-3 py-1.5 rounded-xl border ${
                          isGraded ? 'bg-white border-slate-200' : 'bg-blue-600 border-blue-600'
                        } active:scale-95`}
                      >
                        <Text className={`text-xs font-bold ${isGraded ? 'text-slate-700' : 'text-white'}`}>
                          {isGraded ? 'Re-grade' : 'Grade ✍️'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Assignments & Study Notes Modules */}
            <AssignmentsModule />
            <StudyMaterialsViewer />
          </View>
        )}

        {/* ================= TAB 4: EXAMS & CHAT ================= */}
        {activeTab === 'exams_chat' && (
          <View className="gap-3.5">
            {/* Record Test Marks Banner */}
            <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Award size={18} color="#d97706" />
                  <Text className="text-sm font-bold text-slate-900">Exam Marks & Live Rankings</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsExamMarksModalOpen(true)}
                  className="bg-amber-500 px-3 py-1.5 rounded-xl flex-row items-center gap-1.5 active:scale-95"
                >
                  <Plus size={13} color="#ffffff" />
                  <Text className="text-xs font-bold text-white">Record Marks</Text>
                </TouchableOpacity>
              </View>

              <Text className="text-xs text-slate-600 leading-relaxed">
                Publish assessment scores to instantly compute batch average, highest topper benchmark, and percentile rankings across all student dashboards.
              </Text>
            </View>

            {/* Batch Group Real-Time Chat Card */}
            <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2.5">
                  <View className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 items-center justify-center">
                    <Text className="text-lg">📚</Text>
                  </View>
                  <View>
                    <Text className="text-sm font-bold text-slate-900">Class 12 • JEE Advanced Chat</Text>
                    <Text className="text-xs text-slate-500">Teacher + {studentsRoster.length} Pupils</Text>
                  </View>
                </View>
                <Badge label="Realtime" variant="success" />
              </View>

              <View className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Pinned Class Announcement
                </Text>
                <Text className="text-xs text-slate-800 font-semibold">
                  📌 Physics masterclass on Rotational Dynamics is live today at 04:30 PM. Keep your formula cheat-sheets ready!
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => router.push('/chat')}
                className="bg-blue-600 py-3 rounded-2xl items-center flex-row justify-center gap-2 shadow-xs active:scale-98"
              >
                <MessageSquare size={14} color="#ffffff" />
                <Text className="text-xs font-bold text-white">Open Batch Chat Room →</Text>
              </TouchableOpacity>
            </View>

            {/* Direct Student Messages */}
            <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Users size={16} color="#2563EB" />
                  <Text className="text-sm font-bold text-slate-900">1-on-1 Student Doubt Rooms</Text>
                </View>
                <Badge label="1 Doubt" variant="neutral" />
              </View>

              <View className="gap-2">
                {studentsRoster.slice(0, 3).map((st, idx) => (
                  <TouchableOpacity
                    key={st.id}
                    onPress={() => router.push('/chat')}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex-row items-center justify-between active:scale-98"
                  >
                    <View className="flex-1 pr-2">
                      <View className="flex-row items-center gap-2 mb-0.5">
                        <Text className="text-xs font-bold text-slate-900">{st.name}</Text>
                        <Text className="text-[10px] text-slate-400">{st.rollNumber}</Text>
                        {idx === 0 && (
                          <View className="bg-rose-100 px-1.5 py-0.2 rounded border border-rose-200">
                            <Text className="text-[9px] font-bold text-rose-800">PDF Doubt</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-xs text-slate-500" numberOfLines={1}>
                        {idx === 0 ? 'Sir, I uploaded my solution notes. Could you check step 2?' : 'Sir, which reference book for Rotational Mechanics?'}
                      </Text>
                    </View>
                    <Text className="text-[10px] font-semibold text-blue-600">Open Chat</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Community Doubts Wall Link */}
              <TouchableOpacity
                onPress={() => router.push('/community')}
                className="mt-1 bg-slate-100 p-3 rounded-2xl border border-slate-200 flex-row items-center justify-between active:scale-98"
              >
                <View className="flex-row items-center gap-2">
                  <Sparkles size={14} color="#2563EB" />
                  <Text className="text-xs font-bold text-slate-800">Community Doubts & Forum</Text>
                </View>
                <ArrowRight size={14} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= TAB 5: PROFILE & SETTINGS ================= */}
        {activeTab === 'profile' && (() => {
          // Filter students roster by search & fee status
          const filteredStudents = studentsRoster.filter((st) => {
            const matchesSearch =
              st.name.toLowerCase().includes(directorySearchQuery.toLowerCase()) ||
              st.rollNumber.toLowerCase().includes(directorySearchQuery.toLowerCase()) ||
              st.batchName.toLowerCase().includes(directorySearchQuery.toLowerCase());

            const isPaid = st.feeStatus.toLowerCase().includes('paid');
            if (directoryFeeFilter === 'paid') return matchesSearch && isPaid;
            if (directoryFeeFilter === 'pending') return matchesSearch && !isPaid;
            return matchesSearch;
          });

          const paidCount = studentsRoster.filter((st) => st.feeStatus.toLowerCase().includes('paid')).length;
          const pendingCount = studentsRoster.filter((st) => !st.feeStatus.toLowerCase().includes('paid')).length;

          return (
            <View className="gap-4">
              {/* Teacher Identity & Profile Card */}
              <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3.5">
                <View className="flex-row items-center gap-3.5">
                  <View className="w-14 h-14 rounded-2xl bg-blue-600 items-center justify-center shadow-xs">
                    <Text className="text-xl font-black text-white">
                      {teacherProfile.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </Text>
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="text-base font-extrabold text-slate-900" numberOfLines={1}>
                      {teacherProfile.fullName}
                    </Text>
                    <Text className="text-xs text-slate-500 font-medium">{teacherProfile.qualification}</Text>
                    <View className="flex-row items-center gap-2 mt-1">
                      <View className="bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                        <Text className="text-[10px] font-bold text-blue-700">
                          {teacherMode === 'solo' ? 'Solo Tutor' : 'Institute Faculty'}
                        </Text>
                      </View>
                      <View className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        <Text className="text-[10px] font-bold text-emerald-700">
                          ₹{teacherProfile.monthlyFeeRate.toLocaleString()}/mo per pupil
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Teacher Code Card */}
                <View className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex-row items-center justify-between">
                  <View>
                    <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Batch Enrollment Code
                    </Text>
                    <Text className="text-sm font-extrabold text-blue-600 font-mono">
                      {teacherProfile.teacherCode}
                    </Text>
                  </View>
                  <View className="flex-row gap-1.5">
                    <TouchableOpacity
                      onPress={handleShareTeacherCode}
                      className="bg-blue-600 px-3 py-1.5 rounded-xl active:scale-95 flex-row items-center gap-1.5 shadow-xs"
                    >
                      <Share2 size={13} color="#ffffff" />
                      <Text className="text-xs font-bold text-white">Share Code</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Active Batch & Timing Settings */}
              <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Clock size={16} color="#2563EB" />
                    <Text className="text-sm font-bold text-slate-900">Active Batch & Schedule Filter</Text>
                  </View>
                  <Badge label={`${TEACHER_BATCHES.length} Batches`} variant="info" />
                </View>
                <Text className="text-xs text-slate-500 leading-relaxed">
                  Select which batch and timing you want to manage. The roll call, DPP assignments, and diagnostics across Acadly adapt automatically.
                </Text>

                <View className="gap-2 mt-1">
                  {TEACHER_BATCHES.map((batch) => {
                    const isSelected = selectedBatchId === batch.id;
                    return (
                      <TouchableOpacity
                        key={batch.id}
                        onPress={() => setSelectedBatchId(batch.id)}
                        className={`p-3.5 rounded-2xl border flex-row items-center justify-between ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-600'
                            : 'bg-slate-50 border-slate-200/80'
                        } active:scale-98`}
                      >
                        <View className="flex-1 pr-2">
                          <View className="flex-row items-center gap-2 mb-0.5">
                            <Text className={`text-xs font-bold ${isSelected ? 'text-blue-950' : 'text-slate-900'}`}>
                              {batch.name}
                            </Text>
                            {isSelected && (
                              <View className="bg-blue-600 px-1.5 py-0.2 rounded">
                                <Text className="text-[9px] font-bold text-white">Active Focus</Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-[11px] text-slate-500">{batch.subject} • {batch.room}</Text>
                          <Text className="text-[10px] font-semibold text-slate-600 mt-1">🕒 {batch.time} • {batch.count} Pupils</Text>
                        </View>

                        <View
                          className={`w-6 h-6 rounded-full border items-center justify-center ${
                            isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check size={13} color="#ffffff" strokeWidth={3} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Searchable Student Directory with Fee Status & Contact */}
              <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3.5">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Users size={16} color="#2563EB" />
                    <Text className="text-sm font-bold text-slate-900">Student Directory & Fee Tracker</Text>
                  </View>
                  <Text className="text-xs font-bold text-slate-500">{filteredStudents.length} Students</Text>
                </View>

                {/* Search Bar */}
                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 gap-2">
                  <Search size={15} color="#94A3B8" />
                  <TextInput
                    placeholder="Search pupil by name or roll number..."
                    placeholderTextColor="#94a3b8"
                    value={directorySearchQuery}
                    onChangeText={setDirectorySearchQuery}
                    className="flex-1 text-xs text-slate-800 font-medium p-0"
                  />
                  {directorySearchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setDirectorySearchQuery('')}>
                      <X size={14} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Fee Status Filter Tabs */}
                <View className="flex-row gap-1.5">
                  {[
                    { id: 'all', label: `All (${studentsRoster.length})` },
                    { id: 'paid', label: `Paid (${paidCount})` },
                    { id: 'pending', label: `Pending (${pendingCount})` },
                  ].map((tab) => {
                    const isActive = directoryFeeFilter === tab.id;
                    return (
                      <TouchableOpacity
                        key={tab.id}
                        onPress={() => setDirectoryFeeFilter(tab.id as any)}
                        className={`px-3 py-1.5 rounded-xl border ${
                          isActive
                            ? 'bg-slate-900 border-slate-900'
                            : 'bg-slate-50 border-slate-200'
                        } active:scale-95`}
                      >
                        <Text className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-600'}`}>
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Student Cards List */}
                <View className="gap-2.5">
                  {filteredStudents.length === 0 ? (
                    <View className="py-8 items-center justify-center">
                      <Text className="text-xs text-slate-400">No students match your filter.</Text>
                    </View>
                  ) : (
                    filteredStudents.map((st) => {
                      const isFeePaid = st.feeStatus.toLowerCase().includes('paid');
                      return (
                        <View
                          key={st.id}
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 gap-2.5"
                        >
                          <View className="flex-row items-start justify-between">
                            <TouchableOpacity
                              onPress={() => router.push({ pathname: '/student-detail', params: { studentId: st.id } })}
                              className="flex-row items-center gap-2.5 flex-1 min-w-0"
                            >
                              <View className="min-w-[36px] h-8 px-1.5 rounded-xl bg-white border border-slate-200 items-center justify-center shrink-0">
                                <Text className="text-[11px] font-bold text-blue-600 font-mono" numberOfLines={1}>
                                  {st.rollNumber.replace('ROLL-', '#').replace('STU-', '#')}
                                </Text>
                              </View>
                              <View className="flex-1 min-w-0">
                                <Text className="text-xs font-bold text-slate-900" numberOfLines={1}>
                                  {st.name}
                                </Text>
                                <Text className="text-[11px] text-slate-500" numberOfLines={1}>
                                  {st.batchName} • {st.grade}
                                </Text>
                              </View>
                            </TouchableOpacity>

                            {/* Fee Status Badge */}
                            <TouchableOpacity
                              onPress={() => {
                                const newStatus = isFeePaid ? 'Fee Pending (₹3,500)' : 'Fee Paid (Verified)';
                                updateStudentFeeStatus(st.id, newStatus);
                              }}
                              className={`px-2.5 py-1 rounded-xl border flex-row items-center gap-1 active:scale-95 ${
                                isFeePaid
                                  ? 'bg-emerald-50 border-emerald-200'
                                  : 'bg-amber-50 border-amber-200'
                              }`}
                            >
                              {isFeePaid ? (
                                <ShieldCheck size={12} color="#059669" />
                              ) : (
                                <AlertTriangle size={12} color="#d97706" />
                              )}
                              <Text
                                className={`text-[10px] font-bold ${
                                  isFeePaid ? 'text-emerald-700' : 'text-amber-700'
                                }`}
                              >
                                {isFeePaid ? 'Fee Paid' : 'Pending ₹3,500'}
                              </Text>
                            </TouchableOpacity>
                          </View>

                          {/* Chips: Attendance & Rank & Action */}
                          <View className="flex-row items-center justify-between pt-1 border-t border-slate-200/60">
                            <View className="flex-row items-center gap-2">
                              <Text className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                📊 {st.overallAttendance}% Attendance
                              </Text>
                              <Text className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                🏆 Rank #{st.rank}
                              </Text>
                            </View>

                            <View className="flex-row items-center gap-1.5">
                              {st.guardianPhone && (
                                <TouchableOpacity
                                  onPress={() => Linking.openURL(`tel:${st.guardianPhone}`)}
                                  className="w-7 h-7 rounded-xl bg-white border border-slate-200 items-center justify-center active:scale-90"
                                >
                                  <Phone size={12} color="#2563EB" />
                                </TouchableOpacity>
                              )}
                              <TouchableOpacity
                                onPress={() => router.push({ pathname: '/student-detail', params: { studentId: st.id } })}
                                className="bg-white border border-slate-200 px-2.5 py-1 rounded-xl flex-row items-center gap-1 active:scale-95"
                              >
                                <Text className="text-[11px] font-bold text-slate-700">360° Profile</Text>
                                <ChevronRight size={12} color="#64748B" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              </View>

              {/* Mode Switch Card */}
              <TouchableOpacity
                onPress={() => setIsDualModeModalOpen(true)}
                className="bg-blue-50/70 border border-blue-200 p-4 rounded-3xl flex-row items-center justify-between active:scale-98"
              >
                <View className="flex-1 pr-2">
                  <Text className="text-xs font-bold text-blue-900">Switch Account Mode</Text>
                  <Text className="text-[11px] text-blue-700 mt-0.5">
                    Currently: {teacherMode === 'solo' ? 'Independent Solo Tutor' : 'Connected to Coaching Center'}
                  </Text>
                </View>
                <ChevronRight size={16} color="#2563EB" />
              </TouchableOpacity>

              {/* Sign Out Button */}
              <TouchableOpacity
                onPress={handleLogout}
                className="bg-rose-50 border border-rose-200 p-4 rounded-3xl flex-row items-center justify-center gap-2 active:scale-98 mb-6"
              >
                <LogOut size={16} color="#e11d48" />
                <Text className="text-xs font-bold text-rose-700">Sign Out of Teacher Desk</Text>
              </TouchableOpacity>
            </View>
          );
        })()}

      {/* ================= MODAL 1: DUAL MODE SWITCHER ================= */}
      <Modal visible={isDualModeModalOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white rounded-t-3xl p-6 gap-3.5 max-h-[85%] border-t border-slate-200">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-extrabold text-slate-900">Teacher Workspace Mode</Text>
              <TouchableOpacity onPress={() => setIsDualModeModalOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs text-slate-500 leading-relaxed">
              Choose whether you operate as an independent Solo Tutor with direct student fees or connect to a Multi-Teacher Coaching Center.
            </Text>

            <TouchableOpacity
              onPress={() => {
                setTeacherMode('solo');
                setIsDualModeModalOpen(false);
                Alert.alert('Solo Mode Enabled', 'Operating as an Independent Tutor with your Teacher Code.');
              }}
              className={`p-4 rounded-2xl border-2 ${
                teacherMode === 'solo' ? 'bg-blue-50 border-blue-600' : 'bg-slate-50 border-slate-200'
              } flex-row items-center justify-between`}
            >
              <View className="flex-1 pr-2">
                <Text className="text-sm font-bold text-slate-900">Solo Tutor Mode 🍎</Text>
                <Text className="text-xs text-slate-500 mt-0.5">
                  Direct student enrollment via your unique Teacher Code. Full ownership of schedule & fees.
                </Text>
              </View>
              {teacherMode === 'solo' && <Check size={18} color="#2563EB" />}
            </TouchableOpacity>

            <View
              className={`p-4 rounded-2xl border-2 ${
                teacherMode === 'coaching_faculty' ? 'bg-blue-50 border-blue-600' : 'bg-slate-50 border-slate-200'
              } gap-2.5`}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-bold text-slate-900">Coaching Center Faculty 🏫</Text>
                {teacherMode === 'coaching_faculty' && <Check size={18} color="#2563EB" />}
              </View>
              <Text className="text-xs text-slate-500">
                Link to an existing Coaching Center / Institute Admin using their Invite Code.
              </Text>
              <TextInput
                placeholder="Enter Coaching Code (e.g. BLOOM2026)"
                placeholderTextColor="#94a3b8"
                value={instituteCodeInput}
                onChangeText={setInstituteCodeInput}
                className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-bold"
              />
              <TouchableOpacity
                onPress={handleLinkCoachingCenter}
                className="bg-blue-600 py-2.5 rounded-xl items-center active:scale-98"
              >
                <Text className="text-xs font-bold text-white">Verify & Link Coaching Center</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL 2: UPLOAD PDF NOTES ================= */}
      <Modal visible={isUploadPdfOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white rounded-t-3xl p-6 gap-3 max-h-[85%] border-t border-slate-200">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-extrabold text-slate-900">Upload PDF Study Material</Text>
              <TouchableOpacity onPress={() => setIsUploadPdfOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} className="gap-3">
              <View>
                <Text className="text-xs font-bold text-slate-700 mb-1">Document Title</Text>
                <TextInput
                  placeholder="e.g. Rotational Mechanics Master Formula Sheet"
                  placeholderTextColor="#94a3b8"
                  value={pdfTitle}
                  onChangeText={setPdfTitle}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-medium"
                />
              </View>

              <View>
                <Text className="text-xs font-bold text-slate-700 mb-1">Subject</Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {['Physics', 'Chemistry', 'Mathematics', 'Biology'].map((sub) => (
                    <TouchableOpacity
                      key={sub}
                      onPress={() => setPdfSubject(sub)}
                      className={`px-3 py-1.5 rounded-xl border ${
                        pdfSubject === sub ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text className={`text-[11px] font-bold ${pdfSubject === sub ? 'text-white' : 'text-slate-700'}`}>
                        {sub}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <Text className="text-xs font-bold text-slate-700 mb-1">Category</Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {[
                    { id: 'notes', label: 'Notes 📖' },
                    { id: 'formula_sheet', label: 'Formula Sheet 📐' },
                    { id: 'dpp', label: 'DPP ⚡' },
                    { id: 'pyq', label: 'PYQ 📝' },
                  ].map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setPdfCategory(cat.id as any)}
                      className={`px-3 py-1.5 rounded-xl border ${
                        pdfCategory === cat.id ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text className={`text-[10px] font-bold ${pdfCategory === cat.id ? 'text-white' : 'text-slate-700'}`}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                onPress={handlePickPdf}
                className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-2 flex-1 pr-2">
                  <FileText size={18} color="#2563EB" />
                  <Text className="text-xs font-bold text-slate-800" numberOfLines={1}>
                    {pickedPdfFile ? pickedPdfFile.name : 'Pick PDF File from Phone'}
                  </Text>
                </View>
                <Text className="text-xs font-bold text-blue-600">Browse</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmPdfUpload}
                className="bg-blue-600 py-3 rounded-2xl items-center shadow-xs mt-2 mb-4"
              >
                <Text className="text-xs font-bold text-white">Publish PDF to Batch</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL 3: EXAM MARKS & RANKS ================= */}
      <Modal visible={isExamMarksModalOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white rounded-t-3xl p-6 gap-3 max-h-[85%] border-t border-slate-200">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-base font-extrabold text-slate-900">Record Test Marks & Auto-Rank</Text>
                <Text className="text-xs text-slate-500">Computes batch average, topper & ranks</Text>
              </View>
              <TouchableOpacity onPress={() => setIsExamMarksModalOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View className="flex-row gap-2 mb-3">
                <View className="flex-1">
                  <Text className="text-[11px] font-bold text-slate-700 mb-1">Test Title</Text>
                  <TextInput
                    placeholder="e.g. Unit Mock Test 04"
                    placeholderTextColor="#94a3b8"
                    value={examTestName}
                    onChangeText={setExamTestName}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold"
                  />
                </View>
                <View className="w-24">
                  <Text className="text-[11px] font-bold text-slate-700 mb-1">Max Marks</Text>
                  <TextInput
                    placeholder="100"
                    keyboardType="numeric"
                    placeholderTextColor="#94a3b8"
                    value={examMaxScore}
                    onChangeText={setExamMaxScore}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold"
                  />
                </View>
              </View>

              <Text className="text-xs font-bold text-slate-700 mb-2">
                Enter Student Scores (out of {examMaxScore}):
              </Text>
              <View className="gap-2 mb-3">
                {studentsRoster.map((st) => (
                  <View
                    key={st.id}
                    className="flex-row items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <View className="flex-1 pr-2">
                      <Text className="text-xs font-bold text-slate-800">{st.name}</Text>
                      <Text className="text-[10px] text-slate-400">{st.rollNumber}</Text>
                    </View>

                    <View className="w-20">
                      <TextInput
                        placeholder="85"
                        keyboardType="numeric"
                        value={studentMarksInput[st.id] || '85'}
                        onChangeText={(val) => setStudentMarksInput((prev) => ({ ...prev, [st.id]: val }))}
                        className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 text-center font-bold"
                      />
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleSaveExamMarks}
                className="bg-blue-600 py-3 rounded-2xl items-center shadow-xs mb-4"
              >
                <Text className="text-xs font-bold text-white">Save Marks & Compute Ranks 🏆</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL 4: GRADE HOMEWORK ================= */}
      <Modal visible={isGradingModalOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white rounded-t-3xl p-6 gap-3.5 max-h-[85%] border-t border-slate-200">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-extrabold text-slate-900">Grade Student Homework</Text>
              <TouchableOpacity onPress={() => setIsGradingModalOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} className="gap-3.5">
              <View>
                <Text className="text-xs font-bold text-slate-700 mb-1">Marks Awarded (out of 25)</Text>
                <TextInput
                  placeholder="24"
                  keyboardType="numeric"
                  value={gradingScoreInput}
                  onChangeText={setGradingScoreInput}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-bold"
                />
              </View>

              <View>
                <Text className="text-xs font-bold text-slate-700 mb-1">Teacher Feedback / Observations</Text>
                <TextInput
                  placeholder="Add teacher feedback or step correction..."
                  placeholderTextColor="#94a3b8"
                  value={gradingFeedbackInput}
                  onChangeText={setGradingFeedbackInput}
                  multiline
                  numberOfLines={3}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                />
              </View>

              <TouchableOpacity
                onPress={handleConfirmGrade}
                className="bg-emerald-600 py-3 rounded-2xl items-center shadow-xs mt-2 mb-4"
              >
                <Text className="text-xs font-bold text-white">Save Grade & Notify Student ✅</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL 5: CREATE ASSIGNMENT ================= */}
      <Modal visible={isCreateAssignmentOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white rounded-t-3xl p-6 gap-3 max-h-[85%] border-t border-slate-200">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-extrabold text-slate-900">Create New DPP / Assignment</Text>
              <TouchableOpacity onPress={() => setIsCreateAssignmentOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} className="gap-3">
              <View>
                <Text className="text-xs font-bold text-slate-700 mb-1">Title</Text>
                <TextInput
                  placeholder="e.g. DPP 05: Rotational Torque & Angular Momentum"
                  placeholderTextColor="#94a3b8"
                  value={newAssignTitle}
                  onChangeText={setNewAssignTitle}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-bold"
                />
              </View>

              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className="text-[11px] font-bold text-slate-700 mb-1">Subject</Text>
                  <TextInput
                    placeholder="Physics"
                    value={newAssignSubject}
                    onChangeText={setNewAssignSubject}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold"
                  />
                </View>
                <View className="w-24">
                  <Text className="text-[11px] font-bold text-slate-700 mb-1">Max Marks</Text>
                  <TextInput
                    placeholder="25"
                    keyboardType="numeric"
                    value={newAssignMaxMarks}
                    onChangeText={setNewAssignMaxMarks}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold"
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={async () => {
                  try {
                    const res = await DocumentPicker.getDocumentAsync({
                      type: 'application/pdf',
                      copyToCacheDirectory: true,
                    });
                    if (!res.canceled && res.assets && res.assets.length > 0) {
                      setNewAssignPdfName(res.assets[0].name);
                    }
                  } catch {
                    Alert.alert('Picker Error', 'Could not open picker.');
                  }
                }}
                className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex-row items-center justify-between"
              >
                <Text className="text-xs text-slate-700 font-medium" numberOfLines={1}>
                  {newAssignPdfName || 'Attach Question Paper PDF (Optional)'}
                </Text>
                <Text className="text-xs font-bold text-blue-600">Pick</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCreateAssignment}
                className="bg-blue-600 py-3 rounded-2xl items-center shadow-xs mt-2 mb-4"
              >
                <Text className="text-xs font-bold text-white">Publish Assignment to Batch</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL 6: ADD LECTURE ================= */}
      <Modal visible={isAddLectureOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white rounded-t-3xl p-6 gap-3 max-h-[85%] border-t border-slate-200">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-extrabold text-slate-900">Link YouTube Lecture</Text>
              <TouchableOpacity onPress={() => setIsAddLectureOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} className="gap-3">
              <View>
                <Text className="text-xs font-bold text-slate-700 mb-1">Lecture Title</Text>
                <TextInput
                  placeholder="e.g. Kinematics Lecture 08: Projectile Motion"
                  placeholderTextColor="#94a3b8"
                  value={lectureTitle}
                  onChangeText={setLectureTitle}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-bold"
                />
              </View>

              <View>
                <Text className="text-xs font-bold text-slate-700 mb-1">Subject</Text>
                <TextInput
                  placeholder="Physics / Chemistry / Mathematics"
                  placeholderTextColor="#94a3b8"
                  value={lectureSubject}
                  onChangeText={setLectureSubject}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-bold"
                />
              </View>

              <View>
                <Text className="text-xs font-bold text-slate-700 mb-1">YouTube Video ID or Unlisted URL</Text>
                <TextInput
                  placeholder="e.g. dQw4w9WgXcQ or https://youtu.be/..."
                  placeholderTextColor="#94a3b8"
                  value={lectureVideoId}
                  onChangeText={setLectureVideoId}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-bold"
                />
              </View>

              <TouchableOpacity
                onPress={handleAddLecture}
                className="bg-blue-600 py-3 rounded-2xl items-center shadow-xs mt-2 mb-4"
              >
                <Text className="text-xs font-bold text-white">Publish Video Lecture</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ATTENDANCE CORRECTION MODAL */}
      <AttendanceCorrectionModal
        record={selectedRecordForCorrection}
        onClose={() => setSelectedRecordForCorrection(null)}
      />

      {/* VIDEO PLAYER MODAL */}
      <VideoPlayerModal />

      {/* IN-APP DOCUMENT READER MODAL */}
      <DocumentReaderModal
        document={selectedReaderDoc}
        visible={Boolean(selectedReaderDoc)}
        onClose={() => setSelectedReaderDoc(null)}
      />

      {/* IN-APP INTERACTIVE DPP / QUIZ BUILDER MODAL */}
      <InteractiveDppBuilderModal
        visible={isInteractiveDppOpen}
        onClose={() => setIsInteractiveDppOpen(false)}
        onPublish={handlePublishInteractiveDpp}
        defaultBatchName={currentBatch.name}
        defaultSubject={currentBatch.subject}
      />
    </ScreenWrapper>
  );
}
