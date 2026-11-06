import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import {
  Trophy,
  Play,
  FileCheck,
  CalendarCheck,
  CheckCircle2,
  Clock,
  DownloadCloud,
  Flame,
  ArrowRight,
  BookOpen,
  Sparkles,
  MessageSquare,
  BarChart3,
  Calendar,
  Plus,
  CreditCard,
  Home,
  GraduationCap,
  Users,
  Settings,
  HelpCircle,
  FileText,
  Copy,
  LogOut,
  Edit2,
  X,
  ShieldCheck,
  Bell,
  ChevronRight,
  Star,
  Search,
  SlidersHorizontal,
  Check,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useAuth } from '@/context/AuthContext';
import { useInstitute } from '@/context/InstituteContext';
import { useAcademic } from '@/context/AcademicContext';
import { useFeeNotification } from '@/context/FeeNotificationContext';
import { ScreenWrapper, Badge, BottomTabBar, type TabItem } from '@/components/ui';
import {
  PerformanceComparisonChart,
  SubjectRadarOrBarChart,
  AttendanceRingAndTrendChart,
} from '@/components/charts';
import {
  VideoPlayerModal,
  StudyMaterialsViewer,
  AssignmentsModule,
  DocumentReaderModal,
} from '@/components/academic';
import {
  FeeReceiptModal,
  NotificationDrawer,
  RazorpayCheckoutModal,
} from '@/components/finance';
import { generateAndSharePDF, DUMMY_PDF_CATALOG, type PDFDocumentContent } from '@/services/dummyPdfService';
import { DAILY_AFFIRMATIONS } from '@/data/dummyAcademicData';
import { FEATURE_FEES } from '@/config/features';

const WEEK_DAYS = [
  { day: 'Mon', date: '18', full: 'Mon 18' },
  { day: 'Tue', date: '19', full: 'Tue 19' },
  { day: 'Wed', date: '20', full: 'Wed 20' },
  { day: 'Thu', date: '21', full: 'Thu 21' },
  { day: 'Fri', date: '22', full: 'Fri 22' },
  { day: 'Sat', date: '23', full: 'Sat 23' },
  { day: 'Sun', date: '24', full: 'Sun 24' },
];

const SUBJECT_PROGRESS_CARDS = [
  {
    id: 'sub-physics',
    title: 'Physics Mechanics',
    teacher: 'Prof. Vikram Joshi',
    lessons: '17 Lessons',
    hours: '2h 10m',
    progress: 82,
    badge: 'Rotational',
    bgClass: 'bg-[#DCFCE7]',
    borderClass: 'border-emerald-300',
    barClass: 'bg-emerald-500',
    textColor: 'text-emerald-950',
    subtextColor: 'text-emerald-700',
  },
  {
    id: 'sub-maths',
    title: 'Calculus & Vectors',
    teacher: 'Dr. Ramanujan',
    lessons: '22 Lessons',
    hours: '3h 40m',
    progress: 94,
    badge: 'Integrals',
    bgClass: 'bg-[#EDE9FE]',
    borderClass: 'border-purple-300',
    barClass: 'bg-purple-600',
    textColor: 'text-purple-950',
    subtextColor: 'text-purple-700',
  },
  {
    id: 'sub-chem',
    title: 'Organic Chemistry',
    teacher: 'Dr. Sen',
    lessons: '15 Lessons',
    hours: '1h 50m',
    progress: 76,
    badge: 'Reactions',
    bgClass: 'bg-[#FEF3C7]',
    borderClass: 'border-amber-300',
    barClass: 'bg-amber-500',
    textColor: 'text-amber-950',
    subtextColor: 'text-amber-700',
  },
];

const INITIAL_STUDENT_TASKS = [
  {
    id: 'task-1',
    title: 'Read poem & answer questions',
    subject: 'English Literature',
    status: 'in_progress' as const,
    statusLabel: 'In progress',
    statusColor: 'bg-amber-100 text-amber-800 border-amber-300',
    dueDate: 'May 28, 2026',
    comments: 12,
    progress: 1,
    totalBlocks: 3,
  },
  {
    id: 'task-2',
    title: 'Create a comic strip with a story',
    subject: 'Social Studies',
    status: 'todo' as const,
    statusLabel: 'To do',
    statusColor: 'bg-purple-100 text-purple-800 border-purple-300',
    dueDate: 'May 30, 2026',
    comments: 2,
    progress: 0,
    totalBlocks: 3,
  },
  {
    id: 'task-3',
    title: 'Solve Electromagnetism DPP #14',
    subject: 'Physics • Chapter 6',
    status: 'todo' as const,
    statusLabel: 'To do',
    statusColor: 'bg-blue-100 text-blue-800 border-blue-300',
    dueDate: 'Tomorrow, 05:00 PM',
    comments: 6,
    progress: 0,
    totalBlocks: 3,
  },
  {
    id: 'task-4',
    title: 'Prepare for the math test',
    subject: 'Mathematics • Class 12',
    status: 'done' as const,
    statusLabel: 'Done',
    statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dueDate: 'Completed Yesterday',
    comments: 5,
    progress: 3,
    totalBlocks: 3,
  },
];

export default function PinterestStudentScreen() {
  const router = useRouter();
  const { isAuthorized, isLoading } = useRoleGuard(['student', 'teacher', 'admin']);
  const { user, signOut } = useAuth();
  const { currentInstitute } = useInstitute();
  const [selectedReaderDoc, setSelectedReaderDoc] = useState<PDFDocumentContent | null>(null);
  const {
    lectures,
    openPlayer,
    comparisonChartData,
    enrolledTeachers,
    activeTeacherId,
    switchActiveTeacher,
    studentsRoster,
  } = useAcademic();
  const { openNotificationDrawer, unreadCount, openRazorpayCheckout, studentFees } = useFeeNotification();

  // Bottom Navigation Bar State (5 Tabs)
  const [activeTab, setActiveTab] = useState<'home' | 'study' | 'analytics' | 'chat' | 'profile'>('home');

  // Study Hub Sub-Category Filter
  const [studyFilter, setStudyFilter] = useState<'all' | 'notes' | 'formula' | 'dpp'>('all');

  // Student Profile Info
  const studentProfile = studentsRoster.find((s) => s.id === 'stud-amelia') || studentsRoster[0];
  const activeTeacher =
    enrolledTeachers.find((t) => t.id === activeTeacherId) || enrolledTeachers[0];
  const liveLecture = lectures.find((l) => l.is_live) || lectures[0];

  // Profile Edit Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState(studentProfile?.name || 'Amelia Sharma 🌸');
  const [profileSchoolInput, setProfileSchoolInput] = useState(studentProfile?.school || 'Delhi Public School (R.K. Puram)');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  // Modern UI Inspiration State (Weekly Day Picker & Segmented Task Filters)
  const [selectedDay, setSelectedDay] = useState('Tue 19');
  const [taskFilter, setTaskFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [homeSearchQuery, setHomeSearchQuery] = useState('');
  const [studentTasks, setStudentTasks] = useState(INITIAL_STUDENT_TASKS);

  // Filtered Tasks for Home screen
  const filteredTasks = studentTasks.filter((t) => {
    if (taskFilter === 'all') return true;
    return t.status === taskFilter;
  });

  // Parent Link Code Copier / Share
  const handleShareParentCode = async () => {
    try {
      await Share.share({
        message: `Parent Link Code for ${studentProfile.name}: ${studentProfile.parentLinkCode}\nUse this in the Acadly Parent App to view attendance, report cards, and fee receipts.`,
      });
    } catch {
      Alert.alert('Parent Code', `Code: ${studentProfile.parentLinkCode}`);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out 🚪',
      'Are you sure you want to sign out from Acadly?',
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

  // Bottom Tab Bar Items
  const studentTabs: TabItem[] = [
    {
      key: 'home',
      label: 'Home',
      icon: (color, size) => <Home size={size} color={color} />,
    },
    {
      key: 'study',
      label: 'Study Hub',
      icon: (color, size) => <BookOpen size={size} color={color} />,
    },
    {
      key: 'analytics',
      label: 'Analytics',
      icon: (color, size) => <BarChart3 size={size} color={color} />,
    },
    {
      key: 'chat',
      label: 'Chat',
      icon: (color, size) => <MessageSquare size={size} color={color} />,
      badgeCount: 2,
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: (color, size) => <GraduationCap size={size} color={color} />,
    },
  ];

  
  if (isLoading || !isAuthorized) {
    return (
      <ScreenWrapper headerProps={{ title: 'Student Hub' }}>
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
        title: 'Student Desk',
        instituteName: currentInstitute?.name || 'Bloom Science Academy',
        profileInitials: 'AS',
        onNotificationPress: openNotificationDrawer,
        onProfilePress: () => setActiveTab('profile'),
        onLogoutPress: handleLogout,
        hasUnreadNotifications: unreadCount > 0,
      }}
      contentContainerClassName="p-4 gap-4"
      footer={
        <BottomTabBar
          tabs={studentTabs}
          activeTab={activeTab}
          onTabChange={(key) => setActiveTab(key as any)}
          accentColor="#2563EB"
        />
      }
    >
      {/* ======================================================== */}
      {/* TAB 1: HOME (EDITORIAL INSPIRATION DASHBOARD)            */}
      {/* ======================================================== */}
      {activeTab === 'home' && (
        <View className="gap-4">
          {/* 1. Header Greeting & Profile Circle (Inspiration: Image 1 & 3) */}
          <View className="flex-row items-center justify-between pt-1">
            <View>
              <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Class 12 • JEE Rankers
              </Text>
              <Text className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                Hi, {studentProfile.name.split(' ')[0]} 👋
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setActiveTab('profile')}
              className="w-11 h-11 rounded-full bg-slate-900 items-center justify-center border-2 border-white shadow-xs"
            >
              <Text className="text-xs font-black text-white">AS</Text>
            </TouchableOpacity>
          </View>

          {/* 2. Pill Search Bar (Inspiration: Image 1 & 2) */}
          <View className="bg-white rounded-full px-4 py-2.5 border border-slate-200/80 shadow-xs flex-row items-center gap-2.5">
            <Search size={16} color="#64748B" />
            <TextInput
              placeholder="Search lectures, notes, DPPs..."
              placeholderTextColor="#94A3B8"
              value={homeSearchQuery}
              onChangeText={setHomeSearchQuery}
              className="flex-1 text-xs text-slate-800 font-semibold p-0"
            />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveTab('study')}
              className="w-7 h-7 rounded-full bg-slate-100 items-center justify-center"
            >
              <SlidersHorizontal size={13} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* 3. Horizontal Weekly Day-Picker Strip (Inspiration: Image 1 & 3) */}
          <View className="bg-white rounded-3xl p-3 border border-slate-200/80 shadow-xs">
            <View className="flex-row items-center justify-between mb-2 px-1">
              <View className="flex-row items-center gap-1.5">
                <Calendar size={13} color="#2563EB" />
                <Text className="text-xs font-extrabold text-slate-800">Schedule & Calendar</Text>
              </View>
              <Text className="text-[11px] font-bold text-purple-600">May 2026</Text>
            </View>

            <View className="flex-row justify-between gap-1">
              {WEEK_DAYS.map((d) => {
                const isSelected = selectedDay === d.full;
                return (
                  <TouchableOpacity
                    key={d.full}
                    activeOpacity={0.8}
                    onPress={() => setSelectedDay(d.full)}
                    className={`flex-1 items-center py-2 px-1 rounded-2xl ${
                      isSelected
                        ? 'bg-purple-600 shadow-xs'
                        : 'bg-slate-50'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-medium ${
                        isSelected ? 'text-purple-100' : 'text-slate-500'
                      }`}
                    >
                      {d.day}
                    </Text>
                    <Text
                      className={`text-xs font-black mt-0.5 ${
                        isSelected ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {d.date}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 4. Primary Hero Card: Next Live Class (Inspiration: Image 2) */}
          <View
            style={{
              backgroundColor: '#3E243E',
              shadowColor: '#3E243E',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.22,
              shadowRadius: 16,
              elevation: 8,
            }}
            className="rounded-[28px] p-5 border border-white/10"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <View className="bg-white/15 px-2.5 py-1 rounded-xl">
                  <Text className="text-[10px] font-black text-white uppercase tracking-wider">
                    MON 26
                  </Text>
                </View>
                <Text className="text-xs font-semibold text-rose-200">
                  04:30 PM • Live Stream
                </Text>
              </View>

              <View className="bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
                <Text className="text-[10px] font-bold text-rose-100">
                  Physics • Hybrid
                </Text>
              </View>
            </View>

            <Text className="text-xl font-black text-white tracking-tight mt-1">
              Electromagnetism & Circuit Flow
            </Text>
            <Text className="text-xs text-rose-200/80 mt-1 leading-relaxed">
              With {activeTeacher.name} • 45m problem solving & derivation
            </Text>

            <View className="flex-row items-center justify-between mt-5 pt-3 border-t border-white/10">
              {/* Instructor and Student Avatars */}
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-full bg-rose-400 items-center justify-center border-2 border-white/40">
                  <Text className="text-[11px] font-black text-slate-900">VJ</Text>
                </View>
                <View>
                  <Text className="text-xs font-bold text-white" numberOfLines={1}>
                    {activeTeacher.name}
                  </Text>
                  <Text className="text-[10px] text-rose-200 font-medium">
                    Lead Faculty • 28 Students
                  </Text>
                </View>
              </View>

              {/* Golden Pill CTA Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => liveLecture && openPlayer(liveLecture)}
                style={{
                  backgroundColor: '#F59E0B',
                  shadowColor: '#F59E0B',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.35,
                  shadowRadius: 8,
                  elevation: 6,
                }}
                className="px-4 py-2 rounded-full flex-row items-center gap-1.5 active:scale-95"
              >
                <Play size={13} color="#FFFFFF" fill="#FFFFFF" />
                <Text className="text-xs font-black text-slate-950 uppercase tracking-wider">
                  Join Class
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 5. Active Class Right Now (Inspiration: Image 3 Schedule Screen) */}
          <View className="bg-[#DCFCE7] border border-emerald-300/80 rounded-[24px] p-4 flex-row items-center justify-between gap-3 shadow-xs">
            <View className="flex-1 min-w-0">
              <View className="flex-row items-center gap-1.5 mb-1">
                <View className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <Text className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">
                  Now Active • 10:30 AM - 12:00 PM
                </Text>
              </View>
              <Text className="text-sm font-black text-emerald-950" numberOfLines={1}>
                Problem Solving & Mechanics Lab
              </Text>
              <Text className="text-xs text-emerald-700 font-medium mt-0.5" numberOfLines={1}>
                B2, Room 158 • Mrs. Melton
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setActiveTab('study')}
              className="bg-emerald-600 px-3.5 py-2 rounded-full active:scale-95 shadow-xs shrink-0"
            >
              <Text className="text-xs font-bold text-white">Open Notes</Text>
            </TouchableOpacity>
          </View>

          {/* 6. Your Subjects & Mastery Carousel (Inspiration: Image 1) */}
          <View className="gap-2.5">
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Your Subjects & Mastery
              </Text>
              <TouchableOpacity onPress={() => setActiveTab('study')}>
                <Text className="text-xs font-bold text-blue-600">See all</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1 px-1">
              <View className="flex-row gap-3">
                {SUBJECT_PROGRESS_CARDS.map((card) => (
                  <TouchableOpacity
                    key={card.id}
                    activeOpacity={0.88}
                    onPress={() => setActiveTab('study')}
                    className={`w-44 p-4 rounded-3xl border ${card.bgClass} ${card.borderClass} shadow-xs gap-2`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="w-7 h-7 rounded-xl bg-white/80 items-center justify-center">
                        <BookOpen size={14} color="#334155" />
                      </View>
                      <View className="bg-white/70 px-2 py-0.5 rounded-md">
                        <Text className="text-[9px] font-black uppercase text-slate-700">
                          {card.badge}
                        </Text>
                      </View>
                    </View>

                    <Text className={`text-sm font-black ${card.textColor} mt-1`} numberOfLines={1}>
                      {card.title}
                    </Text>
                    <Text className={`text-[11px] font-medium ${card.subtextColor}`} numberOfLines={1}>
                      {card.lessons} • {card.hours}
                    </Text>

                    {/* Progress Bar */}
                    <View className="mt-2">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-[10px] font-bold text-slate-600">Progress</Text>
                        <Text className="text-[10px] font-black text-slate-800">{card.progress}%</Text>
                      </View>
                      <View className="h-2 rounded-full bg-black/10 overflow-hidden">
                        <View
                          style={{ width: `${card.progress}%` }}
                          className={`h-full rounded-full ${card.barClass}`}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* 7. My Tasks & DPPs with Segmented Filter (Inspiration: Image 3 Tasks Screen) */}
          <View className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs gap-3">
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">
                My Tasks & DPPs
              </Text>
              <TouchableOpacity onPress={() => setActiveTab('study')}>
                <Text className="text-xs font-bold text-blue-600">View All</Text>
              </TouchableOpacity>
            </View>

            {/* Segmented Filter Pills */}
            <View className="flex-row bg-slate-100 p-1 rounded-full border border-slate-200/60">
              {[
                { key: 'all', label: 'All task' },
                { key: 'todo', label: 'To do' },
                { key: 'in_progress', label: 'In progress' },
                { key: 'done', label: 'Done' },
              ].map((f) => {
                const isSelected = taskFilter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => setTaskFilter(f.key as any)}
                    className={`flex-1 py-1.5 rounded-full items-center ${
                      isSelected ? 'bg-slate-900 shadow-xs' : 'bg-transparent'
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${
                        isSelected ? 'text-white' : 'text-slate-600'
                      }`}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Task Cards List */}
            <View className="gap-2.5">
              {filteredTasks.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  activeOpacity={0.88}
                  onPress={() => setActiveTab('study')}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 gap-2"
                >
                  <View className="flex-row items-center justify-between">
                    <View className={`px-2 py-0.5 rounded-md border ${t.statusColor}`}>
                      <Text className="text-[10px] font-black uppercase">
                        {t.statusLabel}
                      </Text>
                    </View>
                    <Text className="text-[11px] text-slate-500 font-medium">
                      {t.dueDate}
                    </Text>
                  </View>

                  <Text className="text-sm font-extrabold text-slate-900 leading-snug">
                    {t.title}
                  </Text>
                  <Text className="text-xs text-slate-500 font-medium">
                    {t.subject} • 💬 {t.comments} comments
                  </Text>

                  {/* Segmented Progress Bar (Image 3 design!) */}
                  <View className="flex-row items-center gap-1.5 mt-1">
                    {Array.from({ length: t.totalBlocks }).map((_, bIdx) => {
                      const isFilled = bIdx < t.progress;
                      return (
                        <View
                          key={bIdx}
                          className={`flex-1 h-2 rounded-full ${
                            isFilled ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        />
                      );
                    })}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 8. Multi-Teacher Tuition Switcher Pill Strip */}
          <View className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <View className="w-2 h-2 rounded-full bg-blue-600" />
                <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  My Tuitions & Mentors
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push('/join-institute')}
                className="bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full flex-row items-center gap-1 active:scale-95"
              >
                <Plus size={12} color="#2563EB" />
                <Text className="text-[11px] font-bold text-blue-600">+ Join Teacher</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1 px-1">
              <View className="flex-row gap-2.5">
                {enrolledTeachers.map((teach) => {
                  const isSelected = activeTeacherId === teach.id;
                  return (
                    <TouchableOpacity
                      key={teach.id}
                      activeOpacity={0.85}
                      onPress={() => switchActiveTeacher(teach.id)}
                      className={`p-3 rounded-2xl border min-w-[160px] ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 shadow-sm'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <View className="flex-row items-center justify-between mb-1">
                        <Text
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            isSelected ? 'text-blue-100' : 'text-slate-500'
                          }`}
                        >
                          {teach.subject}
                        </Text>
                        {isSelected && (
                          <View className="bg-white/20 px-1.5 py-0.5 rounded">
                            <Text className="text-[9px] font-black text-white">Active</Text>
                          </View>
                        )}
                      </View>
                      <Text
                        className={`text-xs font-black ${
                          isSelected ? 'text-white' : 'text-slate-800'
                        }`}
                        numberOfLines={1}
                      >
                        {teach.name}
                      </Text>
                      <Text
                        className={`text-[10px] font-semibold mt-1 ${
                          isSelected ? 'text-blue-100' : 'text-slate-500'
                        }`}
                      >
                        Code: {teach.teacherCode}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* 9. Bento 2-Column Metrics */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setActiveTab('analytics')}
              className="flex-1 bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs"
            >
              <View className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 items-center justify-center mb-2">
                <CheckCircle2 size={16} color="#10B981" />
              </View>
              <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Attendance
              </Text>
              <Text className="text-2xl font-black text-slate-800 mt-0.5">96.4%</Text>
              <Text className="text-[10px] text-emerald-600 font-bold mt-1">Above 90% Target 🎯</Text>
            </TouchableOpacity>

            {FEATURE_FEES ? (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => studentFees[0] && openRazorpayCheckout(studentFees[0])}
                className="flex-1 bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs"
              >
                <View className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 items-center justify-center mb-2">
                  <CreditCard size={16} color="#F59E0B" />
                </View>
                <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Tuition Fee
                </Text>
                <Text className="text-2xl font-black text-slate-800 mt-0.5">₹3,500</Text>
                <Text className="text-[10px] text-blue-600 font-bold mt-1">Tap to Pay UPI 💳</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setActiveTab('study')}
                className="flex-1 bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs"
              >
                <View className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 items-center justify-center mb-2">
                  <BookOpen size={16} color="#059669" />
                </View>
                <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Assignments
                </Text>
                <Text className="text-2xl font-black text-slate-800 mt-0.5">12 / 12</Text>
                <Text className="text-[10px] text-emerald-600 font-bold mt-1">100% Submitted</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

          {/* ======================================================== */}
          {/* TAB 2: STUDY HUB (PDF NOTES, FORMULAS & ASSIGNMENTS)    */}
          {/* ======================================================== */}
          {activeTab === 'study' && (
            <View className="gap-5">
              {/* Category Filter Pills */}
              <View className="flex-row bg-white p-1 rounded-2xl border border-slate-200/90 shadow-xs">
                {[
                  { key: 'all', label: 'All Resources' },
                  { key: 'notes', label: 'Lecture Notes' },
                  { key: 'formula', label: 'Formula Sheets' },
                  { key: 'dpp', label: 'DPPs & Tasks' },
                ].map((f) => {
                  const isSelected = studyFilter === f.key;
                  return (
                    <TouchableOpacity
                      key={f.key}
                      onPress={() => setStudyFilter(f.key as any)}
                      className={`flex-1 py-2 rounded-xl items-center ${
                        isSelected ? 'bg-blue-600 shadow-xs' : 'bg-transparent'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isSelected ? 'text-white' : 'text-slate-600'
                        }`}
                        numberOfLines={1}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Study Materials & High-Yield PDF Catalog */}
              {(studyFilter === 'all' || studyFilter === 'notes' || studyFilter === 'formula') && (
                <View className="gap-3">
                  <View className="flex-row items-center justify-between px-1">
                    <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Verified Study Library
                    </Text>
                    <Text className="text-[11px] font-semibold text-slate-500">
                      {DUMMY_PDF_CATALOG.length} Documents Available
                    </Text>
                  </View>

                  {DUMMY_PDF_CATALOG.map((pdfDoc, idx) => {
                    const rating = idx === 0 ? '4.9' : idx === 1 ? '4.8' : '4.9';
                    const readsCount = idx === 0 ? '1.4k reads' : idx === 1 ? '980 reads' : '1.1k reads';
                    const pageCount = idx === 0 ? '12 Pgs' : idx === 1 ? '8 Pgs' : '16 Pgs';
                    const isMath = pdfDoc.subject === 'Mathematics';
                    const isChem = pdfDoc.subject === 'Chemistry';
                    const badgeBg = isMath ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : isChem ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-blue-50 border-blue-200 text-blue-700';

                    return (
                      <View
                        key={pdfDoc.id}
                        className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs gap-3"
                      >
                        {/* Top Metadata Row: Subject Badge + Trust Signals */}
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center gap-2">
                            <View className={`px-2.5 py-0.5 rounded-lg border ${badgeBg}`}>
                              <Text className="text-[10px] font-extrabold uppercase">
                                {pdfDoc.subject}
                              </Text>
                            </View>

                            <View className="flex-row items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/80">
                              <Star size={11} color="#F59E0B" fill="#F59E0B" />
                              <Text className="text-[10px] font-extrabold text-amber-800">
                                {rating}
                              </Text>
                              <Text className="text-[10px] text-amber-600 font-medium">
                                • {readsCount}
                              </Text>
                            </View>
                          </View>

                          <Text className="text-[11px] text-slate-500 font-semibold">
                            {pdfDoc.date}
                          </Text>
                        </View>

                        {/* Middle Content Row: Visual Thumbnail Box + Title & Author */}
                        <View className="flex-row gap-3 items-start">
                          {/* Structured Product Thumbnail Box */}
                          <View className="w-14 h-16 rounded-2xl bg-slate-50 border border-slate-200 items-center justify-between py-2 shrink-0">
                            <FileText size={20} color="#2563EB" />
                            <View className="bg-slate-200/80 px-1.5 py-0.5 rounded">
                              <Text className="text-[8px] font-black text-slate-700 uppercase">
                                {pageCount}
                              </Text>
                            </View>
                          </View>

                          {/* Info Zone */}
                          <View className="flex-1 min-w-0">
                            <Text className="text-sm font-extrabold text-slate-900 leading-snug" numberOfLines={2}>
                              {pdfDoc.title}
                            </Text>

                            <View className="flex-row items-center gap-1 mt-1">
                              <ShieldCheck size={12} color="#10B981" />
                              <Text className="text-[11px] font-semibold text-slate-600" numberOfLines={1}>
                                {pdfDoc.author}
                              </Text>
                            </View>

                            <Text className="text-xs text-slate-500 mt-1 leading-relaxed" numberOfLines={2}>
                              {pdfDoc.subtitle}
                            </Text>
                          </View>
                        </View>

                        {/* Refined Action Row: Open & Save */}
                        <View className="flex-row gap-2 pt-2 border-t border-slate-100">
                          <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => setSelectedReaderDoc(pdfDoc)}
                            className="flex-1 bg-blue-600 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5 active:scale-95 shadow-xs"
                          >
                            <BookOpen size={14} color="#FFFFFF" />
                            <Text className="text-xs font-bold text-white">Open & Read</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => generateAndSharePDF(pdfDoc)}
                            className="flex-1 bg-slate-100 border border-slate-200/80 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5 active:scale-95"
                          >
                            <DownloadCloud size={14} color="#334155" />
                            <Text className="text-xs font-bold text-slate-700">Save PDF</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Homework / Daily Practice Problems (DPP) Module */}
              {(studyFilter === 'all' || studyFilter === 'dpp') && (
                <View className="gap-3 mt-2">
                  <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Homework & DPP Assignments
                  </Text>
                  <AssignmentsModule />
                </View>
              )}
            </View>
          )}

          {/* ======================================================== */}
          {/* TAB 3: ANALYTICS (COMPARISON GRAPHS & RADAR)            */}
          {/* ======================================================== */}
          {activeTab === 'analytics' && (
            <View className="gap-5">
              <PerformanceComparisonChart
                data={comparisonChartData}
                title="Exam Score vs. Cohort Curve"
                subtitle="Compare your scores against batch average and batch topper"
              />
              <SubjectRadarOrBarChart title="Subject Mastery Breakdown" />
              <AttendanceRingAndTrendChart percentage={96.4} />

              {/* Hall of Stars Leaderboard */}
              <View className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs overflow-hidden">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <Trophy size={18} color="#F59E0B" />
                    <Text className="text-base font-black text-slate-800">Class 12 Leaderboard</Text>
                  </View>
                  <Text className="text-xs font-bold text-blue-600">Top 5% Cohort</Text>
                </View>

                {[
                  { rank: '#01', name: 'Amelia Sharma (You!)', score: '294/300', tag: 'Top 1% Ranker' },
                  { rank: '#02', name: 'Kabir Singhania', score: '288/300', tag: 'High Accuracy' },
                  { rank: '#03', name: 'Zoya Khan', score: '282/300', tag: '100% Attendance' },
                ].map((item, idx) => (
                  <View
                    key={idx}
                    className={`flex-row items-center justify-between p-3 rounded-2xl mb-2 gap-2 ${
                      idx === 0
                        ? 'bg-amber-50/70 border border-amber-200'
                        : 'bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <View className="flex-row items-center gap-2.5 flex-1 min-w-0 pr-1">
                      <View className="w-7 h-7 rounded-full bg-white border border-slate-200 items-center justify-center shrink-0">
                        <Text className="text-xs font-black text-slate-800">{item.rank}</Text>
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text className="text-xs font-bold text-slate-800" numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text className="text-[10px] text-slate-500" numberOfLines={1}>
                          {item.tag}
                        </Text>
                      </View>
                    </View>
                    <View className="bg-white/80 border border-slate-200 px-2 py-1 rounded-xl shrink-0">
                      <Text className="text-xs font-black text-slate-800">{item.score}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ======================================================== */}
          {/* TAB 4: CHAT (CLASSROOM GROUPS & ANNOUNCEMENTS)           */}
          {/* ======================================================== */}
          {activeTab === 'chat' && (
            <View className="gap-3">
              <View className="flex-row items-center justify-between px-1">
                <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Classroom Group Channels
                </Text>
                <Badge label="Active Cohort" variant="primary" />
              </View>

              {[
                {
                  id: 'math-group',
                  name: 'Class 12 • Mathematics Group',
                  faculty: 'Prof. Vikram Joshi',
                  unread: 3,
                  lastMessage: '📌 DPP #14 solutions discussed. Homework due tomorrow night.',
                  members: 28,
                  tag: 'Calculus & Vectors',
                  icon: '📐',
                  bgColor: 'bg-blue-50',
                  borderColor: 'border-blue-200',
                },
                {
                  id: 'physics-group',
                  name: 'Class 12 • Physics Group',
                  faculty: 'Prof. Vikram Joshi',
                  unread: 1,
                  lastMessage: 'Derivation for rotational kinetic energy uploaded to Study Hub.',
                  members: 28,
                  tag: 'Mechanics & Rotational',
                  icon: '⚡',
                  bgColor: 'bg-indigo-50',
                  borderColor: 'border-indigo-200',
                },
                {
                  id: 'chemistry-group',
                  name: 'Class 12 • Chemistry Discussion',
                  faculty: 'Dr. Sen',
                  unread: 0,
                  lastMessage: 'Aldol condensation mechanism chart is pinned in the study vault.',
                  members: 28,
                  tag: 'Organic Chemistry',
                  icon: '🧪',
                  bgColor: 'bg-emerald-50',
                  borderColor: 'border-emerald-200',
                },
                {
                  id: 'batch-announcements',
                  name: 'Batch Announcements & Circulars',
                  faculty: 'Administration Desk',
                  unread: 0,
                  lastMessage: 'Next Mock Test schedule: Sunday 09:30 AM to 12:30 PM.',
                  members: 32,
                  tag: 'Official Notices',
                  icon: '📢',
                  bgColor: 'bg-amber-50',
                  borderColor: 'border-amber-200',
                },
                {
                  id: 'community-forum',
                  name: 'Community Student Lounge',
                  faculty: 'Peer Doubts & Study Hub',
                  unread: 0,
                  lastMessage: 'Ask questions, share concept shortcuts, and study together.',
                  members: 45,
                  tag: 'Peer Discussion',
                  icon: '💡',
                  bgColor: 'bg-purple-50',
                  borderColor: 'border-purple-200',
                  isForum: true,
                },
              ].map((grp) => (
                <TouchableOpacity
                  key={grp.id}
                  activeOpacity={0.88}
                  onPress={() => (grp.isForum ? router.push('/community') : router.push('/chat'))}
                  className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs gap-2.5 active:scale-98"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2.5 flex-1 min-w-0 mr-2">
                      <View className={`w-10 h-10 rounded-2xl ${grp.bgColor} border ${grp.borderColor} items-center justify-center shrink-0`}>
                        <Text className="text-lg">{grp.icon}</Text>
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>
                          {grp.name}
                        </Text>
                        <Text className="text-[11px] text-slate-500 font-medium" numberOfLines={1}>
                          {grp.faculty} • {grp.members} Students
                        </Text>
                      </View>
                    </View>
                    {grp.unread > 0 ? (
                      <View className="bg-blue-600 px-2 py-0.5 rounded-full shrink-0">
                        <Text className="text-[10px] font-black text-white">{grp.unread} new</Text>
                      </View>
                    ) : (
                      <View className="bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                        <Text className="text-[10px] font-bold text-slate-500">Synced</Text>
                      </View>
                    )}
                  </View>

                  <View className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex-row items-center justify-between">
                    <Text className="text-xs text-slate-600 flex-1 min-w-0 pr-2" numberOfLines={1}>
                      {grp.lastMessage}
                    </Text>
                    <ChevronRight size={14} color="#94A3B8" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ======================================================== */}
          {/* TAB 5: PROFILE & SETTINGS (EXTENDED ACADEMIC PROFILE)    */}
          {/* ======================================================== */}
          {activeTab === 'profile' && (
            <View className="gap-5">
              {/* Profile Overview Card */}
              <View className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-3">
                    <View className="w-12 h-12 rounded-2xl bg-blue-600 items-center justify-center shadow-xs">
                      <Text className="text-base font-black text-white">AS</Text>
                    </View>
                    <View>
                      <Text className="text-base font-black text-slate-900">{profileNameInput.replace(' 🌸', '')}</Text>
                      <Text className="text-xs text-slate-500 font-medium">{studentProfile.grade} • {studentProfile.board}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsEditProfileOpen(true)}
                    className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 items-center justify-center active:scale-95"
                  >
                    <Edit2 size={13} color="#2563EB" />
                  </TouchableOpacity>
                </View>

                <View className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500 font-medium">School / College</Text>
                    <Text className="text-xs font-bold text-slate-800">{profileSchoolInput}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500 font-medium">Target Exam</Text>
                    <Text className="text-xs font-bold text-slate-800">{studentProfile.targetExam}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500 font-medium">Current Batch</Text>
                    <Text className="text-xs font-bold text-blue-600">{studentProfile.batchName}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500 font-medium">Roll Number</Text>
                    <Text className="text-xs font-bold font-mono text-slate-800">{studentProfile.rollNumber}</Text>
                  </View>
                </View>
              </View>

              {/* My Parent Link Code (For Parents to Link in Parent App) */}
              <View className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs gap-2.5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    My Parent Link Code
                  </Text>
                  <Badge label="Share With Parents" variant="primary" />
                </View>
                <Text className="text-xs text-slate-500">
                  Your guardian can enter this code in the Acadly Parent App to view real-time attendance and marks:
                </Text>

                <View className="bg-blue-50 border border-blue-200 p-3 rounded-2xl flex-row items-center justify-between">
                  <Text className="text-base font-black text-blue-700 tracking-wider">
                    {studentProfile.parentLinkCode}
                  </Text>
                  <TouchableOpacity
                    onPress={handleShareParentCode}
                    className="bg-blue-600 px-3 py-1.5 rounded-xl flex-row items-center gap-1 active:scale-95 shadow-xs"
                  >
                    <Copy size={12} color="#FFFFFF" />
                    <Text className="text-xs font-bold text-white">Share Code</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Preferences & Settings */}
              <View className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs gap-3">
                <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Preferences & Tools
                </Text>

                <View className="flex-row items-center justify-between py-1 border-b border-slate-100">
                  <View className="flex-row items-center gap-2">
                    <Bell size={16} color="#64748B" />
                    <Text className="text-xs font-bold text-slate-800">Class & Test Notifications</Text>
                  </View>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: '#cbd5e1', true: '#2563EB' }}
                  />
                </View>

                <View className="flex-row items-center justify-between py-1 border-b border-slate-100">
                  <View className="flex-row items-center gap-2">
                    <HelpCircle size={16} color="#64748B" />
                    <Text className="text-xs font-bold text-slate-800">Help & Support</Text>
                  </View>
                  <TouchableOpacity onPress={() => Alert.alert('Acadly Help', 'Email support@acadly.app or message your tuition teacher.')}>
                    <Text className="text-xs font-bold text-blue-600">Contact</Text>
                  </TouchableOpacity>
                </View>

                {/* Sign Out Action */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleLogout}
                  className="bg-rose-50 border border-rose-200 py-3 rounded-2xl flex-row items-center justify-center gap-2 mt-2 active:scale-98"
                >
                  <LogOut size={15} color="#E11D48" />
                  <Text className="text-xs font-black text-rose-600">Sign Out of Acadly</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        {/* Edit Profile Modal */}
        <Modal
          visible={isEditProfileOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsEditProfileOpen(false)}
        >
          <View className="flex-1 bg-black/60 items-center justify-center p-5">
            <View className="bg-white rounded-3xl p-5 w-full max-w-sm border border-slate-200 shadow-xl">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-black text-slate-900">Edit Academic Profile</Text>
                <TouchableOpacity onPress={() => setIsEditProfileOpen(false)}>
                  <X size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text className="text-xs font-bold text-slate-700 mb-1">Full Name</Text>
              <TextInput
                value={profileNameInput}
                onChangeText={setProfileNameInput}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 mb-3"
              />

              <Text className="text-xs font-bold text-slate-700 mb-1">School / Junior College</Text>
              <TextInput
                value={profileSchoolInput}
                onChangeText={setProfileSchoolInput}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 mb-4"
              />

              <TouchableOpacity
                onPress={() => {
                  setIsEditProfileOpen(false);
                  Alert.alert('Profile Saved', 'Updated your academic profile successfully.');
                }}
                className="bg-blue-600 py-2.5 rounded-xl items-center shadow-xs active:scale-95"
              >
                <Text className="text-xs font-bold text-white">Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Global Modals */}
        <VideoPlayerModal />
        <DocumentReaderModal
          document={selectedReaderDoc}
          visible={Boolean(selectedReaderDoc)}
          onClose={() => setSelectedReaderDoc(null)}
        />
        <NotificationDrawer />
        {FEATURE_FEES && (
          <>
            <FeeReceiptModal />
            <RazorpayCheckoutModal />
          </>
        )}
      </ScreenWrapper>
  );
}
