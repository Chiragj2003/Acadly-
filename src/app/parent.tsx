import React, { useState } from 'react';
import { View, Text, Alert, ActivityIndicator } from 'react-native';
import { Home, Users, Wallet, ShieldCheck, ChartLine, MessageCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useAuth, useInstitute } from '@/context/AuthContext';
import { useChild } from '@/context/ChildContext';
import { useFeeNotification } from '@/context/FeeNotificationContext';
import {
  ScreenWrapper,
  BottomTabBar,
  type TabItem,
  OnboardingWalkthroughModal,
} from '@/components/ui';
import {
  RazorpayCheckoutModal,
  FeeReceiptModal,
  NotificationDrawer,
} from '@/features/fees';
import { generateAndSharePDF, DUMMY_PDF_CATALOG } from '@/services/dummyPdfService';
import { FEATURE_FEES } from '@/config/features';
import {
  ParentChildSelector,
  ParentHomeTab,
  ParentChildrenTab,
  ParentFeesTab,
  ParentProfileTab,
  LinkChildModal,
} from '@/components/screens/parent';
import { ParentReport } from '@/components/screens/parent/ParentReport';

export default function ParentScreen() {
  const { isAuthorized, isLoading } = useRoleGuard(['parent', 'admin']);
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { currentInstitute } = useInstitute();
  const { selectedChild, childrenList, selectChild, addChildByCodeOrPhone } = useChild();
  const {
    studentFees,
    payments,
    openRazorpayCheckout,
    openReceipt,
    openNotificationDrawer,
    unreadCount,
  } = useFeeNotification();

  const [activeTab, setActiveTab] = useState<'home' | 'children' | 'fees_reports' | 'profile'>('home');
  const [isLinkChildModalOpen, setIsLinkChildModalOpen] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out 🚪', 'Are you sure you want to sign out from the Parent Portal?', [
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth');
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleDownloadInvoice = async () => {
    const doc = DUMMY_PDF_CATALOG[0];
    await generateAndSharePDF(doc);
  };

  // Progress-report PDFs are not generated from real data yet. Say so instead of
  // sharing an unrelated sample invoice as the child's report.
  const handleDownloadReport = () => {
    Alert.alert('Coming soon', 'Downloadable progress reports are on the way.');
  };

  const initials = (user?.full_name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const tabs: TabItem[] = [
    {
      key: 'home',
      label: 'Home',
      icon: (color, size) => <Home color={color} size={size} />,
    },
    {
      key: 'children',
      label: 'Children',
      icon: (color, size) => <Users color={color} size={size} />,
      badgeCount: childrenList.length > 0 ? childrenList.length : undefined,
    },
    {
      key: 'fees_reports',
      label: FEATURE_FEES ? 'Fees' : 'Reports',
      icon: (color, size) => (FEATURE_FEES ? <Wallet color={color} size={size} /> : <ChartLine color={color} size={size} />),
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: (color, size) => <ShieldCheck color={color} size={size} />,
    },
  ];

  if (isLoading || !isAuthorized) {
    return (
      <ScreenWrapper headerProps={{ title: 'Parent Portal' }}>
        <View className="flex-1 items-center justify-center p-8">
          <ActivityIndicator size="small" color="#1C1C1E" />
          <Text className="text-xs text-slate-500 mt-2 font-sans">Verifying authorization...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      headerProps={{
        title: user?.full_name ? `Hi, ${user.full_name.split(' ')[0]}` : 'Parent',
        instituteName: currentInstitute?.name || '',
        profileInitials: initials,
        onNotificationPress: openNotificationDrawer,
        onProfilePress: handleLogout,
        onLogoutPress: handleLogout,
        hasUnreadNotifications: unreadCount > 0,
      }}
      contentContainerClassName="gap-5 px-5 py-3"
      footer={
        <BottomTabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(key) => setActiveTab(key as typeof activeTab)}
          trailingAction={{
            label: 'Message teachers',
            icon: (color, size) => <MessageCircle color={color} size={size} fill={color} />,
            onPress: () => router.push('/chat'),
          }}
        />
      }
    >
      <ParentChildSelector
        childrenList={childrenList}
        selectedChild={selectedChild}
        onSelectChild={selectChild}
        onOpenLinkModal={() => setIsLinkChildModalOpen(true)}
      />

      {activeTab === 'home' && (
        <ParentHomeTab
          selectedChild={selectedChild}
          onOpenLinkChild={() => setIsLinkChildModalOpen(true)}
          onOpenChat={() => router.push('/chat')}
        />
      )}

      {activeTab === 'children' && (
        <ParentChildrenTab
          selectedChild={selectedChild}
          onOpenLinkChild={() => setIsLinkChildModalOpen(true)}
        />
      )}

      {activeTab === 'fees_reports' && !FEATURE_FEES && (
        <ParentReport child={selectedChild} onLinkChild={() => setIsLinkChildModalOpen(true)} onDownload={handleDownloadReport} />
      )}

      {activeTab === 'fees_reports' && FEATURE_FEES && (
        <ParentFeesTab
          selectedChild={selectedChild}
          studentFees={studentFees}
          payments={payments}
          onOpenRazorpay={openRazorpayCheckout}
          onOpenReceipt={openReceipt}
          onDownloadInvoice={handleDownloadInvoice}
          onDownloadReport={handleDownloadReport}
        />
      )}

      {activeTab === 'profile' && (
        <ParentProfileTab
          userEmail={user?.email}
          userName={user?.full_name}
          childrenList={childrenList}
          onLinkChild={() => setIsLinkChildModalOpen(true)}
          selectedChild={selectedChild}
          onLogout={handleLogout}
        />
      )}

      <LinkChildModal
        visible={isLinkChildModalOpen}
        onClose={() => setIsLinkChildModalOpen(false)}
        onLinkChild={addChildByCodeOrPhone}
      />

      {FEATURE_FEES && (
        <>
          <RazorpayCheckoutModal />
          <FeeReceiptModal />
        </>
      )}
      <NotificationDrawer />
      <OnboardingWalkthroughModal role="parent" />
    </ScreenWrapper>
  );
}
