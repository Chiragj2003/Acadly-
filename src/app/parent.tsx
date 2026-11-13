import React, { useState } from 'react';
import { View, Text, Alert, ActivityIndicator } from 'react-native';
import { Home, Users, Wallet, ShieldCheck, Award } from 'lucide-react-native';
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
      label: FEATURE_FEES ? 'Fees & Invoices' : 'Progress Reports',
      icon: (color, size) => (FEATURE_FEES ? <Wallet color={color} size={size} /> : <Award color={color} size={size} />),
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
          <ActivityIndicator size="small" color="#2563EB" />
          <Text className="text-xs text-slate-500 mt-2 font-medium">Verifying authorization...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      headerProps={{
        title: 'Parent Portal',
        instituteName: currentInstitute?.name || 'Academy Hub',
        profileInitials: 'PR',
        onNotificationPress: openNotificationDrawer,
        onProfilePress: handleLogout,
        onLogoutPress: handleLogout,
        hasUnreadNotifications: unreadCount > 0,
      }}
      contentContainerClassName="gap-3.5 px-4 py-4"
      footer={
        <BottomTabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(key) => setActiveTab(key as any)}
          accentColor="#2563EB"
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

      {activeTab === 'fees_reports' && (
        <ParentFeesTab
          selectedChild={selectedChild}
          studentFees={studentFees}
          payments={payments}
          onOpenRazorpay={openRazorpayCheckout}
          onOpenReceipt={openReceipt}
          onDownloadInvoice={handleDownloadInvoice}
          onDownloadReport={handleDownloadInvoice}
        />
      )}

      {activeTab === 'profile' && (
        <ParentProfileTab
          userEmail={user?.email}
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
