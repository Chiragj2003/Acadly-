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
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
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
} from '@/components/academic';
import { type AttendanceRecord } from '@/types/database';

export default function PinterestTeacherScreen() {
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

  const handleMarkAllPresent = async () => {
    await markBatchAllPresent('batch-02');
    Alert.alert('Roll Call Updated', 'All enrolled batch students marked as Present.');
  };

  const handleCommitAttendance = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      if (waParentPing) {
        Alert.alert(
          'Roll Call Recorded 📲',
          'Dispatch automated WhatsApp absentee notification to registered parent contact?',
          [
            {
              text: 'Send WhatsApp Alert',
              onPress: () => {
                const message = encodeURIComponent(
                  `Namaste from Acadly: This is an automated update from ${teacherProfile.fullName}'s classroom. Your ward was marked absent today. Please connect if this was unexcused.`
                );
                Linking.openURL(`https://wa.me/919823044551?text=${message}`).catch(() => {
                  Alert.alert('Alert Dispatched', 'WhatsApp message simulated successfully.');
                });
              },
            },
            { text: 'Done', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Synced to Cloud', 'Attendance recorded safely in the database.');
      }
    }, 600);
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

  return (
    <ScreenWrapper
      headerProps={{
        title: teacherMode === 'solo' ? 'Solo Tutor Desk' : 'Faculty Command Desk',
        instituteName: teacherMode === 'solo' ? 'Private Tuition' : (activeInstitute?.name || 'Bloom Academy'),
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
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-3.5 pb-20">
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
                <View className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 items-center justify-center">
                  <Text className="text-2xl">👨‍🏫</Text>
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
                  { batch: 'Batch Sakura (Class 12)', subject: 'Physics • Rotational Dynamics', time: '04:30 PM - 06:00 PM', count: '28 Students', active: true },
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
        {activeTab === 'roster' && (
          <View className="gap-3.5">
            {/* Roll Call Hub Card */}
            <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3.5">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-xs font-semibold text-slate-400">Classroom Roll Call</Text>
                  <Text className="text-base font-extrabold text-slate-900">Batch Sakura 🌸</Text>
                </View>
                <TouchableOpacity
                  onPress={handleMarkAllPresent}
                  className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl active:scale-95"
                >
                  <Text className="text-xs font-bold text-blue-700">Mark All Present</Text>
                </TouchableOpacity>
              </View>

              {/* WhatsApp Absence Ping Toggle */}
              <View className="flex-row items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                  <View className="w-8 h-8 rounded-full bg-emerald-100 items-center justify-center">
                    <MessageSquare size={14} color="#047857" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-slate-800">WhatsApp Absence Alert</Text>
                    <Text className="text-[11px] text-slate-500">Auto-compose message to parent phone on absence</Text>
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
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                  Enrolled Students ({attendanceRecords.length}) • Tap name for 360° Diagnostics
                </Text>

                {attendanceRecords.map((record) => (
                  <View
                    key={record.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex-row items-center justify-between gap-2"
                  >
                    <TouchableOpacity
                      onPress={() => router.push({ pathname: '/student-detail', params: { studentId: record.student_id } })}
                      className="flex-row items-center gap-2.5 flex-1 min-w-0"
                    >
                      <View className="w-8 h-8 rounded-full bg-white border border-slate-200 items-center justify-center shrink-0">
                        <Text className="text-xs font-bold text-blue-600">{record.roll_number}</Text>
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
        )}

        {/* ================= TAB 3: PUBLISH (STUDY HUB & GRADING) ================= */}
        {activeTab === 'publish' && (
          <View className="gap-3.5">
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
                <Text className="text-xs font-bold text-slate-800">+ Create DPP</Text>
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
                        <Text className="text-[10px] text-slate-400 mt-0.5">
                          File: {sub.file_name || 'handwritten_solution.pdf'}
                        </Text>
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
                    <Text className="text-lg">🌸</Text>
                  </View>
                  <View>
                    <Text className="text-sm font-bold text-slate-900">Batch Sakura Class Chat</Text>
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
        {activeTab === 'profile' && (
          <View className="gap-3.5">
            <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3.5">
              <View className="flex-row items-center gap-3.5">
                <View className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 items-center justify-center">
                  <Text className="text-3xl">👨‍🏫</Text>
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-lg font-black text-slate-900">{teacherProfile.fullName}</Text>
                  <Text className="text-xs text-slate-500">{teacherProfile.qualification}</Text>
                  <Badge
                    label={teacherMode === 'solo' ? 'Solo Tutor Account' : 'Institute Faculty'}
                    variant="info"
                  />
                </View>
              </View>

              <View className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 gap-2">
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-500">Teacher Code:</Text>
                  <Text className="text-xs font-bold text-blue-600">{teacherProfile.teacherCode}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-500">Experience:</Text>
                  <Text className="text-xs font-bold text-slate-800">{teacherProfile.experienceYears} Years</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-500">Subject Domains:</Text>
                  <Text className="text-xs font-bold text-slate-800">
                    {teacherProfile.specializationSubjects.join(', ')}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-500">Monthly Tuition Rate:</Text>
                  <Text className="text-xs font-bold text-emerald-700">₹{teacherProfile.monthlyFeeRate.toLocaleString()} / month</Text>
                </View>
              </View>

              <View className="gap-1">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bio & Pedagogy</Text>
                <Text className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  {teacherProfile.bio}
                </Text>
              </View>

              {/* Mode Switch Card */}
              <TouchableOpacity
                onPress={() => setIsDualModeModalOpen(true)}
                className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-2xl flex-row items-center justify-between active:scale-98"
              >
                <View className="flex-1 pr-2">
                  <Text className="text-xs font-bold text-blue-900">Switch Account Mode</Text>
                  <Text className="text-[11px] text-blue-700">
                    Currently: {teacherMode === 'solo' ? 'Independent Solo Tutor' : 'Connected to Coaching Center'}
                  </Text>
                </View>
                <ChevronRight size={16} color="#2563EB" />
              </TouchableOpacity>

              {/* Sign Out Button */}
              <TouchableOpacity
                onPress={handleLogout}
                className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex-row items-center justify-center gap-2 active:scale-98 mt-2"
              >
                <LogOut size={16} color="#e11d48" />
                <Text className="text-xs font-bold text-rose-700">Sign Out of Teacher Desk</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ================= BOTTOM TAB BAR ================= */}
      <BottomTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as any)}
        accentColor="#2563EB"
      />

      {/* ================= MODAL 1: DUAL MODE SWITCHER ================= */}
      <Modal visible={isDualModeModalOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
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
        </View>
      </Modal>

      {/* ================= MODAL 2: UPLOAD PDF NOTES ================= */}
      <Modal visible={isUploadPdfOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 gap-3 max-h-[85%] border-t border-slate-200">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-extrabold text-slate-900">Upload PDF Study Material</Text>
              <TouchableOpacity onPress={() => setIsUploadPdfOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

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
              className="bg-blue-600 py-3 rounded-2xl items-center shadow-xs mt-1"
            >
              <Text className="text-xs font-bold text-white">Publish PDF to Batch</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 3: EXAM MARKS & RANKS ================= */}
      <Modal visible={isExamMarksModalOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
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

            <View className="flex-row gap-2">
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

            <Text className="text-xs font-bold text-slate-700 mt-1">
              Enter Student Scores (out of {examMaxScore}):
            </Text>
            <ScrollView className="max-h-56 gap-2">
              {studentsRoster.map((st) => (
                <View
                  key={st.id}
                  className="flex-row items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 mb-1.5"
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
            </ScrollView>

            <TouchableOpacity
              onPress={handleSaveExamMarks}
              className="bg-blue-600 py-3 rounded-2xl items-center shadow-xs mt-1"
            >
              <Text className="text-xs font-bold text-white">Save Marks & Compute Ranks 🏆</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 4: GRADE HOMEWORK ================= */}
      <Modal visible={isGradingModalOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 gap-3.5 max-h-[85%] border-t border-slate-200">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-extrabold text-slate-900">Grade Student Homework</Text>
              <TouchableOpacity onPress={() => setIsGradingModalOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

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
              className="bg-emerald-600 py-3 rounded-2xl items-center shadow-xs mt-1"
            >
              <Text className="text-xs font-bold text-white">Save Grade & Notify Student ✅</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 5: CREATE ASSIGNMENT ================= */}
      <Modal visible={isCreateAssignmentOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 gap-3 max-h-[85%] border-t border-slate-200">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-extrabold text-slate-900">Create New DPP / Assignment</Text>
              <TouchableOpacity onPress={() => setIsCreateAssignmentOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

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
              className="bg-blue-600 py-3 rounded-2xl items-center shadow-xs mt-1"
            >
              <Text className="text-xs font-bold text-white">Publish Assignment to Batch</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 6: ADD LECTURE ================= */}
      <Modal visible={isAddLectureOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 gap-3 max-h-[85%] border-t border-slate-200">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-extrabold text-slate-900">Link YouTube Lecture</Text>
              <TouchableOpacity onPress={() => setIsAddLectureOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

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
              className="bg-blue-600 py-3 rounded-2xl items-center shadow-xs mt-1"
            >
              <Text className="text-xs font-bold text-white">Publish Video Lecture</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ATTENDANCE CORRECTION MODAL */}
      <AttendanceCorrectionModal
        record={selectedRecordForCorrection}
        onClose={() => setSelectedRecordForCorrection(null)}
      />

      {/* VIDEO PLAYER MODAL */}
      <VideoPlayerModal />
    </ScreenWrapper>
  );
}
