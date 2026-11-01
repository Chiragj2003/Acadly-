import React, { useState } from 'react';
import { View, Text, Pressable, TouchableOpacity, Alert, Switch, Modal } from 'react-native';
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
} from 'lucide-react-native';
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
  } = useAcademic();

  const [activeTab, setActiveTab] = useState<'attendance' | 'assignments' | 'notes'>('attendance');
  const [waParentPing, setWaParentPing] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedRecordForCorrection, setSelectedRecordForCorrection] = useState<AttendanceRecord | null>(null);

  // Add Lecture Video Modal
  const [isAddLectureOpen, setIsAddLectureOpen] = useState(false);
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureSubject, setLectureSubject] = useState('Physics');
  const [lectureVideoId, setLectureVideoId] = useState('');
  const [lectureDuration, setLectureDuration] = useState('60');

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
      faculty_name: 'Er. Rakesh Verma',
    });

    setIsAddLectureOpen(false);
    setLectureTitle('');
    setLectureVideoId('');
    Alert.alert('Lecture Added', 'New video lecture linked and published.');
  };

  return (
    <ScreenWrapper
      headerProps={{
        title: 'Attendance Roll Call',
        instituteName: activeInstitute?.name,
        onNotificationPress: () => Alert.alert('Faculty Notices', 'Monthly mock test review by 6 PM.'),
        onProfilePress: () => Alert.alert('Faculty Profile', 'Er. Rakesh Verma • Senior Physics Faculty'),
      }}
    >
      {/* Teacher Profile Banner (Warm & Friendly) */}
      <View className="bg-cute-peach-light border-2 border-cute-peach rounded-[28px] p-5 shadow-xs mb-3">
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
              Prof. Vikram Joshi ⚡
            </Text>
            <Text className="text-xs text-cute-muted" numberOfLines={1}>
              Senior Physics & Electromagnetism Faculty
            </Text>
          </View>
        </View>

        {/* Action Strip: Verify Requests, Community, 360 Student View */}
        <View className="flex-row gap-2 mt-4 pt-3 border-t border-cute-peach/20">
          <TouchableOpacity
            onPress={() => router.push('/verify-students')}
            className="flex-1 bg-white border border-cute-peach p-2 rounded-xl flex-row items-center justify-center gap-1.5 shadow-xs"
          >
            <View className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <Text className="text-[11px] font-bold text-cute-peach">Verify Join (2)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/community')}
            className="flex-1 bg-white border border-cute-border p-2 rounded-xl flex-row items-center justify-center gap-1.5 shadow-xs"
          >
            <Text className="text-xs">💬</Text>
            <Text className="text-[11px] font-bold text-cute-cocoa">Doubts</Text>
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

      {/* Navigation Sub-Tabs (Cute Pills) */}
      <View className="flex-row items-center gap-2 mb-3">
        <Pressable
          onPress={() => setActiveTab('attendance')}
          className={`flex-1 py-2.5 rounded-2xl items-center border ${
            activeTab === 'attendance'
              ? 'bg-cute-peach border-cute-cocoa/20 shadow-xs'
              : 'bg-white border-cute-border'
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === 'attendance' ? 'text-white' : 'text-cute-muted'
            }`}
          >
            Daily Roll Call 📋
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('assignments')}
          className={`flex-1 py-2.5 rounded-2xl items-center border ${
            activeTab === 'assignments'
              ? 'bg-cute-peach border-cute-cocoa/20 shadow-xs'
              : 'bg-white border-cute-border'
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === 'assignments' ? 'text-white' : 'text-cute-muted'
            }`}
          >
            Assignments & DPP ✏️
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('notes')}
          className={`flex-1 py-2.5 rounded-2xl items-center border ${
            activeTab === 'notes'
              ? 'bg-cute-peach border-cute-cocoa/20 shadow-xs'
              : 'bg-white border-cute-border'
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === 'notes' ? 'text-white' : 'text-cute-muted'
            }`}
          >
            Notes & Media 🌸
          </Text>
        </Pressable>
      </View>

      {/* TAB 1: ATTENDANCE & SCHEDULE */}
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
              <Text className="text-lg font-bold text-on-surface">118</Text>
              <Text className="text-[11px] text-on-surface-variant">Total Pupils</Text>
            </Card>

            <Card elevation="lowest" className="flex-1 items-center p-3">
              <View className="w-7 h-7 rounded-full bg-surface-container-high items-center justify-center mb-1">
                <AlertTriangle size={14} color="#ba1a1a" />
              </View>
              <Text className="text-lg font-bold text-error">8</Text>
              <Text className="text-[11px] text-on-surface-variant">Pending DPP</Text>
            </Card>
          </View>

          {/* Today's Schedule Timeline */}
          <View className="gap-2">
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Today's Schedule
              </Text>
              <Text className="text-xs font-semibold text-secondary">Track 3 of 3</Text>
            </View>

            <Card elevation="lowest" className="p-3 opacity-75">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs text-on-surface-variant">09:00 AM - 10:30 AM</Text>
                <Badge label="Completed" variant="neutral" icon={<CheckCircle size={12} color="#76777d" />} />
              </View>
              <Text className="text-sm font-semibold text-on-surface line-through decoration-outline">
                JEE Target 2025 (Batch A)
              </Text>
              <Text className="text-xs text-on-surface-variant mt-0.5">Hall 4 • 42 Students logged</Text>
            </Card>

            <Card elevation="lowest" className="p-3 border-l-4 border-l-secondary">
              <View className="flex-row items-center justify-between mb-1">
                <Badge label="ACTIVE NOW" variant="live" showDot />
                <Text className="text-xs text-secondary font-semibold">11:00 AM - 12:30 PM</Text>
              </View>
              <Text className="text-sm font-bold text-on-surface">NEET Droppers Batch</Text>
              <Text className="text-xs text-on-surface-variant mt-0.5">
                Electrodynamics: Gauss's Law Applications • Lab 2
              </Text>
            </Card>
          </View>

          {/* In-Session Roll Call Hub */}
          <Card elevation="lowest" className="gap-3.5">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs font-semibold text-secondary">In-Session Roll Call</Text>
                <Text className="text-base font-bold text-on-surface">NEET Droppers Batch</Text>
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
                    onPress={() => setSelectedRecordForCorrection(record)}
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
                        <Edit2 size={12} color="#76777d" />
                      </View>
                      <Text className="text-[11px] text-on-surface-variant" numberOfLines={1}>
                        {record.remarks || 'No remarks logged'}
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

          {/* Quick Faculty Uploads */}
          <View className="gap-2">
            <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">
              Quick Faculty Uploads
            </Text>

            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setIsAddLectureOpen(true)}
                className="flex-1 bg-surface-container-lowest p-4 rounded-2xl gap-2 shadow-sm active:bg-surface-container-high"
              >
                <View className="w-9 h-9 rounded-full bg-secondary/10 items-center justify-center">
                  <Video size={18} color="#0051d5" />
                </View>
                <View>
                  <Text className="text-xs font-bold text-on-surface">+ Lecture Video</Text>
                  <Text className="text-[11px] text-on-surface-variant">YouTube Unlisted Link</Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab('notes')}
                className="flex-1 bg-surface-container-lowest p-4 rounded-2xl gap-2 shadow-sm active:bg-surface-container-high"
              >
                <View className="w-9 h-9 rounded-full bg-tertiary-fixed/40 items-center justify-center">
                  <FileText size={18} color="#069669" />
                </View>
                <View>
                  <Text className="text-xs font-bold text-on-surface">+ Practice DPP</Text>
                  <Text className="text-[11px] text-on-surface-variant">PDF Worksheet & Keys</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* TAB 2: ASSIGNMENTS & GRADING */}
      {activeTab === 'assignments' && <AssignmentsModule />}

      {/* TAB 3: STUDY NOTES */}
      {activeTab === 'notes' && <StudyMaterialsViewer />}

      {/* ADD LECTURE MODAL */}
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
