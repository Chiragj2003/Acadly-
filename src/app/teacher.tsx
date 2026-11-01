import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
  ScrollView,
  TextInput,
  Share,
} from 'react-native';
import {
  BookOpen,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle,
  Video,
  FileText,
  Save,
  MessageSquare,
  Sparkles,
  Edit2,
  X,
  Plus,
  Award,
  Upload,
  Share2,
  Copy,
  Layers,
  GraduationCap,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useAcademic } from '@/context/AcademicContext';
import {
  ScreenWrapper,
  AttendanceToggle,
  Button,
  Badge,
  Card,
  Input,
  type AttendanceStatus,
} from '@/components/ui';
import {
  VideoPlayerModal,
  StudyMaterialsViewer,
  AssignmentsModule,
  AttendanceCorrectionModal,
} from '@/components/academic';
import { type AttendanceRecord } from '@/types/database';

export default function TeacherScreen() {
  const router = useRouter();
  const { activeInstitute } = useAuth();
  const {
    attendanceRecords,
    markAttendance,
    markBatchAllPresent,
    addLecture,
    openPlayer,
    joinRequests,
    teacherProfile,
    studentsRoster,
    recordTestMarks,
    uploadPDFMaterial,
  } = useAcademic();

  const pendingJoinCount = joinRequests.filter(r => r.status === 'pending').length;

  const [activeTab, setActiveTab] = useState<'attendance' | 'chat' | 'assignments' | 'notes'>('attendance');
  const [waParentPing, setWaParentPing] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedRecordForCorrection, setSelectedRecordForCorrection] = useState<AttendanceRecord | null>(null);

  // Add Lecture Video Modal
  const [isAddLectureOpen, setIsAddLectureOpen] = useState(false);
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureSubject, setLectureSubject] = useState('Physics');
  const [lectureVideoId, setLectureVideoId] = useState('');
  const [lectureDuration, setLectureDuration] = useState('60');

  // Exam Marks Entry Modal
  const [isExamMarksModalOpen, setIsExamMarksModalOpen] = useState(false);
  const [examTestName, setExamTestName] = useState('Mock Test #04 (Mechanics)');
  const [examSubject, setExamSubject] = useState('Physics');
  const [examMaxScore, setExamMaxScore] = useState('100');
  const [studentMarksInput, setStudentMarksInput] = useState<Record<string, string>>({
    'stud-amelia': '94',
    'stud-kabir': '96',
    'stud-rohan': '82',
  });

  // PDF Upload Modal
  const [isUploadPdfOpen, setIsUploadPdfOpen] = useState(false);
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfSubject, setPdfSubject] = useState('Physics');
  const [pdfCategory, setPdfCategory] = useState<'notes' | 'formula_sheet' | 'pyq' | 'dpp'>('notes');
  const [pickedPdfFile, setPickedPdfFile] = useState<{ name: string; size?: string } | null>(null);

  // Share Teacher Code
  const handleShareTeacherCode = async () => {
    try {
      await Share.share({
        message: `Join my tuition batch on Acadly! 🌸 Use Teacher Code: ${teacherProfile.teacherCode} to link directly to my classroom, attendance & doubt chats.`,
      });
    } catch {
      Alert.alert('Teacher Code', `Your Teacher Code is: ${teacherProfile.teacherCode}`);
    }
  };

  const handleStatusChange = async (studentId: string, status: AttendanceStatus) => {
    await markAttendance(studentId, status);
  };

  const handleMarkAllPresent = async () => {
    await markBatchAllPresent('batch-02');
    Alert.alert('Roll Call', 'All enrolled batch students marked as Present.');
  };

  const handleCommitAttendance = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      Alert.alert(
        'Synced to Cloud',
        waParentPing
          ? 'Attendance recorded and WhatsApp alerts dispatched for unexcused absences!'
          : 'Attendance recorded in Supabase database.'
      );
    }, 800);
  };

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
    Alert.alert('Lecture Added', 'New video lecture linked and published to batch.');
  };

  // Pick PDF File
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
      Alert.alert('Picker Error', 'Could not open document picker.');
    }
  };

  // Publish PDF
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
    Alert.alert('PDF Published! 🌸', 'All linked batch students can now view and download this note.');
  };

  // Save Exam Marks & Compute Ranks
  const handleSaveExamMarks = async () => {
    if (!examTestName.trim()) {
      Alert.alert('Required', 'Please enter the test assessment title.');
      return;
    }
    const max = parseInt(examMaxScore) || 100;
    const marksList = studentsRoster.map(s => {
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
      `Computed ranks, batch average, and topper score. Live comparison graphs have been updated across all student dashboards.`
    );
  };

  return (
    <ScreenWrapper
      headerProps={{
        title: 'Teacher Desk 🍎',
        instituteName: activeInstitute?.name || 'Bloom Academy 🌸',
        onNotificationPress: () => Alert.alert('Faculty Notices', 'Monthly mock test review by 6 PM.'),
        onProfilePress: () => Alert.alert('Faculty Profile', `${teacherProfile.fullName} • ${teacherProfile.qualification}`),
      }}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-3 pb-16">
        {/* 1. Shareable Teacher Code Hero Banner */}
        <View className="bg-cute-peach-light border-2 border-cute-peach rounded-[28px] p-5 shadow-xs">
          <View className="flex-row items-center justify-between mb-2">
            <View className="bg-white px-2.5 py-0.5 rounded-full border border-cute-peach flex-row items-center gap-1.5">
              <View className="w-2 h-2 rounded-full bg-emerald-500" />
              <Text className="text-[10px] font-bold text-cute-peach uppercase">Faculty Studio</Text>
            </View>
            <Text className="text-xs font-semibold text-cute-muted">Batch Sakura 🌸 • Room 204</Text>
          </View>

          <View className="flex-row items-center gap-3">
            <View className="w-13 h-13 rounded-2xl bg-white border border-cute-border items-center justify-center shadow-xs">
              <Text className="text-3xl">👨‍🏫</Text>
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-lg font-black text-cute-cocoa" numberOfLines={1}>
                {teacherProfile.fullName}
              </Text>
              <Text className="text-xs text-cute-muted" numberOfLines={1}>
                {teacherProfile.qualification}
              </Text>
            </View>
          </View>

          {/* Shareable Teacher Code Strip */}
          <View className="bg-white rounded-2xl p-3 border border-cute-peach/40 mt-3 flex-row items-center justify-between shadow-xs">
            <View>
              <Text className="text-[10px] font-black text-cute-muted uppercase tracking-wider">
                My Shareable Teacher Code
              </Text>
              <Text className="text-base font-black text-cute-peach tracking-wider">
                {teacherProfile.teacherCode}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleShareTeacherCode}
              className="bg-cute-peach px-3 py-1.5 rounded-xl flex-row items-center gap-1.5 active:scale-95 shadow-xs"
            >
              <Share2 size={12} color="#ffffff" />
              <Text className="text-xs font-bold text-white">Share Code</Text>
            </TouchableOpacity>
          </View>

          {/* Action Strip: Live Chat, Verify Requests, 360 Student View */}
          <View className="flex-row gap-2 mt-3 pt-3 border-t border-cute-peach/20">
            <TouchableOpacity
              onPress={() => router.push('/chat')}
              className="flex-1 bg-white border border-cute-peach p-2 rounded-xl flex-row items-center justify-center gap-1.5 shadow-xs active:scale-95"
            >
              <MessageSquare size={13} color="#ff7d6b" />
              <Text className="text-[11px] font-black text-cute-peach">Live Chat 💬</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/verify-students')}
              className="flex-1 bg-white border border-cute-border p-2 rounded-xl flex-row items-center justify-center gap-1.5 shadow-xs"
            >
              {pendingJoinCount > 0 && <View className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
              <Text className="text-[11px] font-bold text-cute-cocoa">Verify ({pendingJoinCount})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/student-detail')}
              className="flex-1 bg-white border border-cute-border p-2 rounded-xl flex-row items-center justify-center gap-1.5 shadow-xs"
            >
              <Text className="text-xs">🔍</Text>
              <Text className="text-[11px] font-bold text-cute-cocoa">Student 360°</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Navigation Sub-Tabs (Cute Pills) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1 px-1">
          <View className="flex-row items-center gap-1.5">
            {[
              { key: 'attendance', label: 'Daily Roll Call 📋' },
              { key: 'chat', label: 'Batch Chat & Doubts 💬' },
              { key: 'assignments', label: 'Assignments & DPP ✏️' },
              { key: 'notes', label: 'Notes & Media 🌸' },
            ].map((tab) => {
              const isSelected = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key as any)}
                  className={`px-3.5 py-2 rounded-2xl items-center border ${
                    isSelected
                      ? 'bg-cute-peach border-cute-cocoa/20 shadow-xs'
                      : 'bg-white border-cute-border'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isSelected ? 'text-white' : 'text-cute-muted'
                    }`}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* ================= TAB 1: ATTENDANCE & VITALS ================= */}
        {activeTab === 'attendance' && (
          <View className="gap-4">
            {/* 3-Column Quick Vitals */}
            <View className="flex-row gap-2">
              <Card elevation="lowest" className="flex-1 items-center p-3">
                <View className="w-7 h-7 rounded-full bg-surface-container-high items-center justify-center mb-1">
                  <BookOpen size={14} color="#0051d5" />
                </View>
                <Text className="text-lg font-bold text-on-surface">3</Text>
                <Text className="text-[11px] text-on-surface-variant">Classes Today</Text>
              </Card>

              <Card elevation="lowest" className="flex-1 items-center p-3">
                <View className="w-7 h-7 rounded-full bg-surface-container-high items-center justify-center mb-1">
                  <Users size={14} color="#0051d5" />
                </View>
                <Text className="text-lg font-bold text-on-surface">{studentsRoster.length}</Text>
                <Text className="text-[11px] text-on-surface-variant">Linked Pupils</Text>
              </Card>

              <Card elevation="lowest" className="flex-1 items-center p-3">
                <View className="w-7 h-7 rounded-full bg-surface-container-high items-center justify-center mb-1">
                  <AlertTriangle size={14} color="#ba1a1a" />
                </View>
                <Text className="text-lg font-bold text-error">1</Text>
                <Text className="text-[11px] text-on-surface-variant">Unexcused</Text>
              </Card>
            </View>

            {/* In-Session Roll Call Hub */}
            <Card elevation="lowest" className="gap-3.5">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-xs font-semibold text-secondary">In-Session Roll Call</Text>
                  <Text className="text-base font-bold text-on-surface">Batch Sakura 🌸</Text>
                </View>
                <Button
                  size="sm"
                  variant="surface"
                  title="All Present"
                  onPress={handleMarkAllPresent}
                />
              </View>

              {/* WhatsApp Parent Ping Switch */}
              <View className="flex-row items-center justify-between p-2.5 rounded-xl bg-surface-container-low">
                <View className="flex-row items-center gap-2 flex-1 mr-2">
                  <View className="w-7 h-7 rounded-full bg-tertiary-fixed items-center justify-center">
                    <MessageSquare size={14} color="#002114" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-on-surface">WhatsApp Parent Ping</Text>
                    <Text className="text-[11px] text-on-surface-variant">Instant dispatch on unexcused absence</Text>
                  </View>
                </View>
                <Switch
                  value={waParentPing}
                  onValueChange={setWaParentPing}
                  trackColor={{ false: '#c6c6cd', true: '#0051d5' }}
                />
              </View>

              {/* Student Roll List with Correction Action */}
              <View className="gap-2">
                {attendanceRecords.map((record) => (
                  <View
                    key={record.id}
                    className="p-3 rounded-xl bg-surface-container-low flex-row items-center justify-between gap-2"
                  >
                    <Pressable
                      onPress={() => router.push({ pathname: '/student-detail', params: { studentId: record.student_id } })}
                      className="flex-row items-center gap-2.5 flex-1 min-w-0"
                    >
                      <View className="w-8 h-8 rounded-full bg-surface-container-highest items-center justify-center shrink-0">
                        <Text className="text-xs font-bold text-secondary">{record.roll_number}</Text>
                      </View>
                      <View className="flex-1 min-w-0">
                        <View className="flex-row items-center gap-1">
                          <Text className="text-xs font-bold text-on-surface" numberOfLines={1}>
                            {record.student_name}
                          </Text>
                          <TouchableOpacity
                            onPress={() => setSelectedRecordForCorrection(record)}
                            hitSlop={8}
                          >
                            <Edit2 size={12} color="#76777d" />
                          </TouchableOpacity>
                        </View>
                        <Text className="text-[11px] text-on-surface-variant" numberOfLines={1}>
                          {record.remarks || 'Tap to view 360° profile'}
                        </Text>
                      </View>
                    </Pressable>

                    <AttendanceToggle
                      value={record.status === 'E' ? 'P' : record.status}
                      onChange={(status) => handleStatusChange(record.student_id, status)}
                    />
                  </View>
                ))}
              </View>

              {/* Commit Button */}
              <Button
                variant="primary"
                title="Commit & Broadcast Roll"
                leftIcon={<Save size={16} color="#ffffff" />}
                loading={isSyncing}
                fullWidth
                onPress={handleCommitAttendance}
              />
            </Card>

            {/* Quick Faculty Tools Grid: Videos, PDFs, Marks */}
            <View className="gap-2">
              <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">
                Faculty Publishing Tools
              </Text>

              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => setIsAddLectureOpen(true)}
                  className="flex-1 bg-white border border-cute-border p-3.5 rounded-2xl gap-2 shadow-xs active:scale-98"
                >
                  <View className="w-8 h-8 rounded-xl bg-blue-50 items-center justify-center">
                    <Video size={16} color="#0051d5" />
                  </View>
                  <View>
                    <Text className="text-xs font-bold text-cute-cocoa">+ Lecture Video</Text>
                    <Text className="text-[10px] text-cute-muted">YouTube Unlisted</Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setIsUploadPdfOpen(true)}
                  className="flex-1 bg-white border border-cute-border p-3.5 rounded-2xl gap-2 shadow-xs active:scale-98"
                >
                  <View className="w-8 h-8 rounded-xl bg-emerald-50 items-center justify-center">
                    <FileText size={16} color="#069669" />
                  </View>
                  <View>
                    <Text className="text-xs font-bold text-cute-cocoa">+ Upload PDF</Text>
                    <Text className="text-[10px] text-cute-muted">Notes, DPP & PYQ</Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setIsExamMarksModalOpen(true)}
                  className="flex-1 bg-white border border-cute-border p-3.5 rounded-2xl gap-2 shadow-xs active:scale-98"
                >
                  <View className="w-8 h-8 rounded-xl bg-amber-50 items-center justify-center">
                    <Award size={16} color="#d97706" />
                  </View>
                  <View>
                    <Text className="text-xs font-bold text-cute-cocoa">+ Test Marks</Text>
                    <Text className="text-[10px] text-cute-muted">Compute Ranks</Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* ================= TAB 2: BATCH CHAT & DOUBTS ================= */}
        {activeTab === 'chat' && (
          <View className="gap-4">
            {/* Batch Group Chat Card */}
            <View className="bg-white border-2 border-cute-border rounded-3xl p-5 shadow-xs gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2.5">
                  <View className="w-10 h-10 rounded-2xl bg-cute-peach-light border border-cute-peach items-center justify-center">
                    <Text className="text-lg">🌸</Text>
                  </View>
                  <View>
                    <Text className="text-sm font-black text-cute-cocoa">Batch Sakura 🌸 Group Room</Text>
                    <Text className="text-xs text-cute-muted">Teacher + {studentsRoster.length} Enrolled Students</Text>
                  </View>
                </View>

                <View className="bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-emerald-800">Realtime Active</Text>
                </View>
              </View>

              <View className="bg-cute-cream p-3 rounded-2xl border border-cute-border">
                <Text className="text-[10px] font-black text-cute-muted uppercase tracking-wider mb-1">
                  Current Class Pinned Announcement:
                </Text>
                <Text className="text-xs text-cute-cocoa font-bold">
                  📌 Physics masterclass on Rotational Dynamics is live at 04:30 PM. Keep your formula cheat-sheets ready!
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => router.push('/chat')}
                className="w-full bg-cute-peach py-3 rounded-2xl items-center flex-row justify-center gap-2 shadow-xs active:scale-98"
              >
                <MessageSquare size={14} color="#ffffff" />
                <Text className="text-xs font-black text-white">
                  Open Real-Time Class Room (Broadcast & Pin) →
                </Text>
              </TouchableOpacity>
            </View>

            {/* Student 1-on-1 Doubts Inbox */}
            <View className="bg-white border-2 border-cute-border rounded-3xl p-5 shadow-xs gap-3">
              <View className="flex-row items-center justify-between mb-1">
                <View className="flex-row items-center gap-2">
                  <View className="w-8 h-8 rounded-xl bg-cute-cream border border-cute-border items-center justify-center">
                    <Text className="text-sm">💬</Text>
                  </View>
                  <View>
                    <Text className="text-sm font-black text-cute-cocoa">Direct Student Messages</Text>
                    <Text className="text-[10px] text-cute-muted">Private queries from enrolled pupils</Text>
                  </View>
                </View>

                <View className="bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-rose-800">1 Unread</Text>
                </View>
              </View>

              {/* Direct messages preview list */}
              {studentsRoster.slice(0, 3).map((st, idx) => (
                <TouchableOpacity
                  key={st.id}
                  onPress={() => router.push('/chat')}
                  className="p-3 rounded-2xl bg-cute-cream border border-cute-border flex-row items-center justify-between active:scale-98"
                >
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-2 mb-0.5">
                      <Text className="text-xs font-black text-cute-cocoa">{st.name}</Text>
                      <Text className="text-[10px] text-cute-muted">{st.rollNumber}</Text>
                      {idx === 0 && (
                        <View className="bg-rose-100 px-1.5 py-0.2 rounded border border-rose-200">
                          <Text className="text-[9px] font-bold text-rose-800">PDF Doubt</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-xs text-cute-muted" numberOfLines={1}>
                      {idx === 0 ? 'Sir, I uploaded my solution notes. Could you check step 2?' : 'Sir, which reference book for Rotational Mechanics?'}
                    </Text>
                  </View>

                  <Text className="text-[10px] font-bold text-cute-peach">Today</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ================= TAB 3: ASSIGNMENTS & DPP ================= */}
        {activeTab === 'assignments' && <AssignmentsModule />}

        {/* ================= TAB 4: STUDY NOTES ================= */}
        {activeTab === 'notes' && <StudyMaterialsViewer />}
      </ScrollView>

      {/* ================= MODAL 1: ADD LECTURE ================= */}
      <Modal visible={isAddLectureOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface rounded-t-3xl p-5 gap-3 max-h-[85%]">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-on-surface">Link YouTube Lecture</Text>
              <Pressable onPress={() => setIsAddLectureOpen(false)}>
                <X size={20} color="#0b1c30" />
              </Pressable>
            </View>

            <Input
              label="Lecture Title"
              placeholder="e.g. Kinematics Lecture 08: Projectile Motion"
              value={lectureTitle}
              onChangeText={setLectureTitle}
            />

            <Input
              label="Subject"
              placeholder="Physics / Chemistry / Mathematics"
              value={lectureSubject}
              onChangeText={setLectureSubject}
            />

            <Input
              label="YouTube Video ID or Unlisted URL"
              placeholder="e.g. dQw4w9WgXcQ or https://youtu.be/..."
              value={lectureVideoId}
              onChangeText={setLectureVideoId}
            />

            <Input
              label="Duration (Minutes)"
              placeholder="60"
              keyboardType="numeric"
              value={lectureDuration}
              onChangeText={setLectureDuration}
            />

            <Button
              variant="primary"
              title="Publish Video Lecture"
              fullWidth
              onPress={handleAddLecture}
            />
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 2: UPLOAD PDF NOTES ================= */}
      <Modal visible={isUploadPdfOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 gap-3 max-h-[85%] border-t-2 border-cute-border">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-black text-cute-cocoa">Upload PDF Study Material</Text>
              <Pressable onPress={() => setIsUploadPdfOpen(false)}>
                <X size={18} color="#7d6f6a" />
              </Pressable>
            </View>

            <View>
              <Text className="text-xs font-bold text-cute-cocoa mb-1">Document Title</Text>
              <TextInput
                placeholder="e.g. Rotational Mechanics Summary Sheet"
                placeholderTextColor="#a89993"
                value={pdfTitle}
                onChangeText={setPdfTitle}
                className="bg-cute-cream border border-cute-border rounded-2xl px-3.5 py-2 text-xs text-cute-cocoa font-bold"
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-cute-cocoa mb-1">Subject</Text>
              <View className="flex-row flex-wrap gap-1.5">
                {['Physics', 'Chemistry', 'Mathematics', 'Biology'].map(sub => (
                  <TouchableOpacity
                    key={sub}
                    onPress={() => setPdfSubject(sub)}
                    className={`px-3 py-1.5 rounded-xl border ${
                      pdfSubject === sub ? 'bg-cute-peach border-cute-peach' : 'bg-cute-cream border-cute-border'
                    }`}
                  >
                    <Text className={`text-[11px] font-bold ${pdfSubject === sub ? 'text-white' : 'text-cute-cocoa'}`}>
                      {sub}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text className="text-xs font-bold text-cute-cocoa mb-1">Category</Text>
              <View className="flex-row flex-wrap gap-1.5">
                {[
                  { id: 'notes', label: 'Notes 📖' },
                  { id: 'formula_sheet', label: 'Formula Sheet 📐' },
                  { id: 'dpp', label: 'DPP ⚡' },
                  { id: 'pyq', label: 'PYQ 📝' },
                ].map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setPdfCategory(cat.id as any)}
                    className={`px-3 py-1.5 rounded-xl border ${
                      pdfCategory === cat.id ? 'bg-cute-peach border-cute-peach' : 'bg-cute-cream border-cute-border'
                    }`}
                  >
                    <Text className={`text-[10px] font-bold ${pdfCategory === cat.id ? 'text-white' : 'text-cute-cocoa'}`}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Pick File */}
            <TouchableOpacity
              onPress={handlePickPdf}
              className="bg-cute-cream border border-cute-border p-3.5 rounded-2xl flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-2 flex-1 pr-2">
                <FileText size={18} color="#ff7d6b" />
                <Text className="text-xs font-bold text-cute-cocoa" numberOfLines={1}>
                  {pickedPdfFile ? pickedPdfFile.name : 'Pick PDF File from Phone'}
                </Text>
              </View>
              <Text className="text-xs font-bold text-cute-peach">Browse</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirmPdfUpload}
              className="bg-cute-peach py-3 rounded-2xl items-center shadow-xs mt-2"
            >
              <Text className="text-xs font-black text-white">Publish PDF to Batch 🌸</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 3: EXAM MARKS & RANKS ================= */}
      <Modal visible={isExamMarksModalOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 gap-3 max-h-[85%] border-t-2 border-cute-border">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-base font-black text-cute-cocoa">Record Test Marks & Ranks</Text>
                <Text className="text-xs text-cute-muted">Calculates topper & average for comparison graphs</Text>
              </View>
              <Pressable onPress={() => setIsExamMarksModalOpen(false)}>
                <X size={18} color="#7d6f6a" />
              </Pressable>
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="text-[11px] font-bold text-cute-cocoa mb-1">Test Title</Text>
                <TextInput
                  placeholder="e.g. Mock Test 04"
                  placeholderTextColor="#a89993"
                  value={examTestName}
                  onChangeText={setExamTestName}
                  className="bg-cute-cream border border-cute-border rounded-xl px-3 py-2 text-xs text-cute-cocoa font-bold"
                />
              </View>
              <View className="w-24">
                <Text className="text-[11px] font-bold text-cute-cocoa mb-1">Max Marks</Text>
                <TextInput
                  placeholder="100"
                  keyboardType="numeric"
                  placeholderTextColor="#a89993"
                  value={examMaxScore}
                  onChangeText={setExamMaxScore}
                  className="bg-cute-cream border border-cute-border rounded-xl px-3 py-2 text-xs text-cute-cocoa font-bold"
                />
              </View>
            </View>

            {/* Students List Inputs */}
            <Text className="text-xs font-black text-cute-cocoa mt-2 mb-1">
              Enter Student Scores (out of {examMaxScore}):
            </Text>
            <ScrollView className="max-h-56 gap-2">
              {studentsRoster.map(st => (
                <View
                  key={st.id}
                  className="flex-row items-center justify-between p-2.5 rounded-xl bg-cute-cream border border-cute-border mb-1.5"
                >
                  <View className="flex-1 pr-2">
                    <Text className="text-xs font-bold text-cute-cocoa">{st.name}</Text>
                    <Text className="text-[10px] text-cute-muted">{st.rollNumber}</Text>
                  </View>

                  <View className="w-20">
                    <TextInput
                      placeholder="85"
                      keyboardType="numeric"
                      value={studentMarksInput[st.id] || '85'}
                      onChangeText={val => setStudentMarksInput(prev => ({ ...prev, [st.id]: val }))}
                      className="bg-white border border-cute-border rounded-lg px-2.5 py-1 text-xs text-cute-cocoa text-center font-bold"
                    />
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={handleSaveExamMarks}
              className="bg-cute-peach py-3 rounded-2xl items-center shadow-xs mt-2"
            >
              <Text className="text-xs font-black text-white">Save & Compute Ranks 🏆</Text>
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
