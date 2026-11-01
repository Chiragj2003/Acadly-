import React, { useState } from 'react';
import { View, Text, Pressable, Alert, Switch } from 'react-native';
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
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import {
  ScreenWrapper,
  AttendanceToggle,
  Button,
  Badge,
  Card,
  type AttendanceStatus,
} from '@/components/ui';

interface StudentRollItem {
  id: string;
  rollNo: string;
  name: string;
  subtext: string;
  status: AttendanceStatus;
}

const INITIAL_STUDENTS: StudentRollItem[] = [
  {
    id: 's1',
    rollNo: '#01',
    name: 'Aditya Sharma',
    subtext: 'Last test: 94% • JEE/NEET',
    status: 'P',
  },
  {
    id: 's2',
    rollNo: '#02',
    name: 'Ananya Iyer',
    subtext: 'Unexcused Sick Note?',
    status: 'A',
  },
  {
    id: 's3',
    rollNo: '#03',
    name: 'Rohan Deshmukh',
    subtext: 'Arrived +15m (Bus Delay)',
    status: 'L',
  },
  {
    id: 's4',
    rollNo: '#04',
    name: 'Aryan Kapoor',
    subtext: 'Top 0.8% • JEE Dropper Pro',
    status: 'P',
  },
];

export default function TeacherScreen() {
  const { activeInstitute } = useAuth();
  const [students, setStudents] = useState<StudentRollItem[]>(INITIAL_STUDENTS);
  const [waParentPing, setWaParentPing] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleStatusChange = (id: string, newStatus: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
  };

  const handleMarkAllPresent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: 'P' })));
    Alert.alert('Roll Call', 'All 4 enrolled students marked as Present.');
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

  return (
    <ScreenWrapper
      headerProps={{
        title: 'Attendance Roll Call',
        instituteName: activeInstitute?.name,
        onNotificationPress: () => Alert.alert('Faculty Notices', 'Monthly mock test review by 6 PM.'),
        onProfilePress: () => Alert.alert('Faculty Profile', 'Er. Rakesh Verma • Senior Physics Faculty'),
      }}
    >
      {/* Teacher Profile Banner (from Stitch Teacher design) */}
      <Card elevation="hero" className="border-0">
        <View className="flex-row items-center justify-between mb-2">
          <Badge label="Academic Duty • Live" variant="pro" showDot />
          <Text className="text-xs text-on-primary-container">Today, Live Session</Text>
        </View>

        <View className="flex-row items-center gap-3">
          <View className="w-12 h-12 rounded-full bg-secondary items-center justify-center border-2 border-white/20">
            <Text className="text-base font-bold text-white">RV</Text>
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-lg font-bold text-on-primary" numberOfLines={1}>
              Er. Rakesh Verma
            </Text>
            <Text className="text-xs text-on-primary-container" numberOfLines={1}>
              Senior Physics Faculty • Dept. Head
            </Text>
          </View>
        </View>
      </Card>

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

        {/* Student Roll List */}
        <View className="gap-2">
          {students.map((student) => (
            <View
              key={student.id}
              className="p-3 rounded-xl bg-surface-container-low flex-row items-center justify-between gap-2"
            >
              <View className="flex-row items-center gap-2.5 flex-1 min-w-0">
                <View className="w-8 h-8 rounded-full bg-surface-container-highest items-center justify-center shrink-0">
                  <Text className="text-xs font-bold text-secondary">{student.rollNo}</Text>
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-xs font-bold text-on-surface" numberOfLines={1}>
                    {student.name}
                  </Text>
                  <Text className="text-[11px] text-on-surface-variant" numberOfLines={1}>
                    {student.subtext}
                  </Text>
                </View>
              </View>

              <AttendanceToggle
                value={student.status}
                onChange={(status) => handleStatusChange(student.id, status)}
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
            onPress={() => Alert.alert('Upload Lecture', 'Opening video link & upload form (YouTube Unlisted / MP4)...')}
            className="flex-1 bg-surface-container-lowest p-4 rounded-2xl gap-2 shadow-sm active:bg-surface-container-high"
          >
            <View className="w-9 h-9 rounded-full bg-secondary/10 items-center justify-center">
              <Video size={18} color="#0051d5" />
            </View>
            <View>
              <Text className="text-xs font-bold text-on-surface">+ Lecture Video</Text>
              <Text className="text-[11px] text-on-surface-variant">MP4 / YouTube Unlisted</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => Alert.alert('Upload DPP', 'Opening PDF study notes & worksheet upload...')}
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
    </ScreenWrapper>
  );
}
