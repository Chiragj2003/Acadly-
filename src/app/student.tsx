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
        onNotificationPress: openNotificationDrawer,
        onProfilePress: () => setActiveTab('profile'),
        onLogoutPress: handleLogout,
        hasUnreadNotifications: unreadCount > 0,
      }}
      contentContainerClassName="p-5 gap-5"
      contentContainerStyle={{ paddingBottom: 24 }}
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
      {/* TAB 1: HOME (BENTO EDITORIAL DASHBOARD)                  */}
      {/* ======================================================== */}
          {activeTab === 'home' && (
            <View className="gap-5">
              {/* 1. Multi-Teacher Tuition Switcher Pill Strip */}
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
                    className="bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xl flex-row items-center gap-1 active:scale-95"
                  >
                    <Plus size={12} color="#2563EB" />
                    <Text className="text-[11px] font-bold text-blue-600">+ Join Teacher</Text>
                  </TouchableOpacity>
                </View>

                {/* Horizontal Teacher Scroll */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1 px-1">
                  <View className="flex-row gap-2.5">
                    {enrolledTeachers.map((teach) => {
                      const isSelected = activeTeacherId === teach.id;
                      return (
                        <TouchableOpacity
                          key={teach.id}
                          activeOpacity={0.85}
                          onPress={() => switchActiveTeacher(teach.id)}
                          className={`p-3 rounded-2xl border min-w-[170px] ${
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
                              isSelected ? 'text-blue-200' : 'text-slate-400'
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

              {/* 2. Primary Hero Bento Card: Next Live Class */}
              <View className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex-row items-center gap-1.5">
                    <View className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <Text className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                      Upcoming Class • Today
                    </Text>
                  </View>
                  <Text className="text-xs font-bold text-slate-500">Room 204 • Hybrid</Text>
                </View>

                <Text className="text-lg font-black text-slate-900 tracking-tight mt-1">
                  Electromagnetism & Circuit Flow
                </Text>
                <Text className="text-xs text-slate-500 mt-1 leading-relaxed">
                  With {activeTeacher.name} • 45 minutes problem solving & derivation
                </Text>

                <View className="mt-4 pt-3 border-t border-slate-100 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1.5">
                    <Clock size={13} color="#64748B" />
                    <Text className="text-xs font-bold text-slate-600">04:30 PM (Starts in 2h)</Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => liveLecture && openPlayer(liveLecture)}
                    className="bg-blue-600 px-4 py-2 rounded-2xl flex-row items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <Play size={13} color="#FFFFFF" fill="#FFFFFF" />
                    <Text className="text-xs font-bold text-white">Join Lecture</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 3. Bento 2-Column Metrics */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setActiveTab('analytics')}
                  className="flex-1 bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs"
                >
                  <View className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 items-center justify-center mb-2">
                    <CheckCircle2 size={16} color="#10B981" />
                  </View>
                  <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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
                    <View className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 items-center justify-center mb-2">
                      <CreditCard size={16} color="#F59E0B" />
                    </View>
                    <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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
                    <View className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 items-center justify-center mb-2">
                      <BookOpen size={16} color="#059669" />
                    </View>
                    <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Assignments
                    </Text>
                    <Text className="text-2xl font-black text-slate-800 mt-0.5">12 / 12</Text>
                    <Text className="text-[10px] text-emerald-600 font-bold mt-1">100% Submitted</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* 4. Quick Action Hub */}
              <View className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs">
                <Text className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
                  Quick Actions
                </Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => router.push('/chat')}
                    className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-2xl items-center active:scale-95"
                  >
                    <MessageSquare size={16} color="#2563EB" />
                    <Text className="text-xs font-bold text-slate-800 mt-1.5">Class Chat</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setActiveTab('study')}
                    className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-2xl items-center active:scale-95"
                  >
                    <FileText size={16} color="#10B981" />
                    <Text className="text-xs font-bold text-slate-800 mt-1.5">Submit DPP</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => router.push('/community')}
                    className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-2xl items-center active:scale-95"
                  >
                    <Users size={16} color="#F59E0B" />
                    <Text className="text-xs font-bold text-slate-800 mt-1.5">Doubts Feed</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* ======================================================== */}
          {/* TAB 2: STUDY HUB (PDF NOTES, FORMULAS & ASSIGNMENTS)    */}
          {/* ======================================================== */}
          {activeTab === 'study' && (
            <View className="gap-5">
              {/* Category Filter Pills */}
              <View className="flex-row bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
                {[
                  { key: 'all', label: 'All Library' },
                  { key: 'notes', label: 'Notes 📑' },
                  { key: 'formula', label: 'Formula Sheets 📐' },
                  { key: 'dpp', label: 'DPPs & Tasks ✏️' },
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
                        className={`text-xs font-extrabold ${
                          isSelected ? 'text-white' : 'text-slate-600'
                        }`}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Study Materials & High-Yield PDF Downloads */}
              {(studyFilter === 'all' || studyFilter === 'notes' || studyFilter === 'formula') && (
                <View className="gap-3">
                  <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    High-Yield Verified PDF Materials
                  </Text>
                  {DUMMY_PDF_CATALOG.map((pdfDoc) => (
                    <View
                      key={pdfDoc.id}
                      className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs"
                    >
                      <View className="flex-row items-center justify-between mb-1.5">
                        <View className="bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          <Text className="text-[10px] font-bold text-blue-700 uppercase">
                            {pdfDoc.subject} • {pdfDoc.category}
                          </Text>
                        </View>
                        <Text className="text-[11px] text-slate-400 font-semibold">{pdfDoc.date}</Text>
                      </View>

                      <Text className="text-sm font-extrabold text-slate-800 mt-1">
                        {pdfDoc.title}
                      </Text>
                      <Text className="text-xs text-slate-500 mt-0.5 leading-relaxed" numberOfLines={2}>
                        {pdfDoc.subtitle}
                      </Text>

                      <View className="flex-row gap-2 mt-3 pt-2.5 border-t border-slate-100">
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => setSelectedReaderDoc(pdfDoc)}
                          className="flex-1 bg-slate-100 py-2 rounded-xl flex-row items-center justify-center gap-1.5 active:scale-95"
                        >
                          <BookOpen size={13} color="#2563EB" />
                          <Text className="text-xs font-bold text-blue-700">Open & Read</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => generateAndSharePDF(pdfDoc)}
                          className="flex-1 bg-blue-600 py-2 rounded-xl flex-row items-center justify-center gap-1.5 active:scale-95 shadow-xs"
                        >
                          <DownloadCloud size={13} color="#FFFFFF" />
                          <Text className="text-xs font-bold text-white">Save PDF</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
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
                    <View className="w-12 h-12 rounded-2xl bg-blue-100 border border-blue-200 items-center justify-center">
                      <Text className="text-2xl">🌸</Text>
                    </View>
                    <View>
                      <Text className="text-base font-black text-slate-900">{profileNameInput}</Text>
                      <Text className="text-xs text-slate-500">{studentProfile.grade} • {studentProfile.board}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsEditProfileOpen(true)}
                    className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 items-center justify-center active:scale-95"
                  >
                    <Edit2 size={13} color="#2563EB" />
                  </TouchableOpacity>
                </View>

                <View className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500 font-medium">🏫 School / Junior College:</Text>
                    <Text className="text-xs font-bold text-slate-800">{profileSchoolInput}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500 font-medium">🎯 Target Exam:</Text>
                    <Text className="text-xs font-bold text-slate-800">{studentProfile.targetExam}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500 font-medium">📚 Enrolled Batch:</Text>
                    <Text className="text-xs font-bold text-blue-600">{studentProfile.batchName}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500 font-medium">🆔 Admission Number:</Text>
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
