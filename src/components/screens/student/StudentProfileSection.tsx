import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Share, Alert, ActivityIndicator } from 'react-native';
import { Share2, LogOut, FileDown, Download, Trash2 } from 'lucide-react-native';
import { LanguageSwitcher } from '@/components/ui';
import { exportUserData, requestAccountDeletion } from '@/services/accountService';

interface StudentProfileSectionProps {
  name: string;
  email: string;
  rollNumber: string;
  parentLinkCode: string;
  batchName: string;
  /** Reserved for the real report card; not shown until results are published. */
  overallAttendance?: number;
  onSignOut: () => void;
}

/** Settings row in the account card. */
const Row: React.FC<{ label: string; value?: string; onPress: () => void; busy?: boolean; last?: boolean; icon: React.ReactNode }> = ({
  label,
  value,
  onPress,
  busy,
  last,
  icon,
}) => (
  <TouchableOpacity
    accessibilityRole="button"
    onPress={onPress}
    disabled={busy}
    className={`flex-row items-center gap-3 min-h-[56px] ${last ? '' : 'border-b border-hairline'}`}
  >
    <View className="w-9 h-9 rounded-full bg-paper items-center justify-center">{icon}</View>
    <Text className="flex-1 font-sans-semibold text-ink text-[15px]">{label}</Text>
    {busy ? <ActivityIndicator size="small" color="#1C1C1E" /> : value ? <Text className="font-sans text-muted text-sm">{value}</Text> : null}
  </TouchableOpacity>
);

export const StudentProfileSection: React.FC<StudentProfileSectionProps> = ({
  name,
  email,
  rollNumber,
  parentLinkCode,
  batchName,
  onSignOut,
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Parent Link Code for ${name}: ${parentLinkCode}\nUse this in the Acadly Parent App to link your account and track attendance, test results, and fee receipts.`,
      });
    } catch {
      // Ignored
    }
  };

  // The report card PDF used to be filled with invented marks and remarks.
  // Until it is generated from published results, say so honestly.
  const handleDownloadReportCard = async () => {
    setIsExportingPdf(true);
    try {
      Alert.alert('Coming soon', 'Your report card will be available here once your institute publishes term results.');
    } finally {
      setIsExportingPdf(false);
    }
  };


  const handleExportData = async () => {
    setIsExportingData(true);
    try {
      const data = await exportUserData();
      const jsonStr = JSON.stringify(data, null, 2);
      await Share.share({
        message: jsonStr,
        title: `Acadly_Data_Export_${rollNumber}.json`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      Alert.alert('Export Error', msg);
    } finally {
      setIsExportingData(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account & Personal Data? ⚠️',
      'This action will permanently anonymize your account profile, deactivate push notification tokens, and revoke class access according to app store privacy guidelines. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await requestAccountDeletion();
              Alert.alert('Account Deletion Complete', 'Your personal data has been erased.');
              onSignOut();
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Deletion failed';
              Alert.alert('Error', msg);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <View className="gap-5">
      {/* Who you are */}
      <View className="items-center gap-2">
        <View className="w-[92px] h-[92px] rounded-full bg-pastel-pink border-[3px] border-white items-center justify-center">
          <Text className="font-display text-ink text-[32px]">{initials || 'S'}</Text>
        </View>
        <Text className="font-display text-ink text-[28px]">{name}</Text>
        {email ? <Text className="font-sans text-muted text-sm">{email}</Text> : null}
      </View>

      {/* My class */}
      <View className="gap-2">
        <Text className="font-sans-bold text-muted text-[13px] px-1.5">My class</Text>
        <View className="bg-white rounded-3xl px-4 py-3 flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-2xl bg-pastel-sky items-center justify-center">
            <Text className="font-display text-ink">{(batchName || 'A').charAt(0)}</Text>
          </View>
          <View className="flex-1 min-w-0">
            <Text className="font-sans-bold text-ink text-[15px]" numberOfLines={1}>
              {batchName}
            </Text>
            {rollNumber ? <Text className="font-sans text-muted text-xs">Roll {rollNumber}</Text> : null}
          </View>
          <View className="px-2.5 py-1 rounded-xl bg-pastel-mint">
            <Text className="font-sans-bold text-ink text-xs">Active</Text>
          </View>
        </View>
      </View>

      {/* Invite a parent */}
      <View className="bg-pastel-lilac border-[1.5px] border-ink rounded-3xl px-4 py-4 flex-row items-center gap-3">
        <View className="flex-1 gap-1">
          <Text className="font-sans-bold text-[#3A2466] text-[13px]">Invite a parent</Text>
          <Text className="font-serif text-ink text-[26px] tracking-wide">{parentLinkCode || '—'}</Text>
          <Text className="font-sans text-[#3A2466] text-xs leading-4">
            {parentLinkCode ? 'They enter this in the Acadly parent app.' : 'Your code appears once your institute approves you.'}
          </Text>
        </View>
        {parentLinkCode ? (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleShareCode}
            className="h-11 px-4 rounded-full bg-ink flex-row items-center gap-1.5"
          >
            <Share2 size={14} color="#FFFFFF" />
            <Text className="font-sans-bold text-white text-sm">Share</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Settings */}
      <View className="gap-2">
        <Text className="font-sans-bold text-muted text-[13px] px-1.5">Language</Text>
        <LanguageSwitcher />
      </View>

      <View className="bg-white rounded-3xl px-4">
        <Row label="Report card" value="Soon" onPress={handleDownloadReportCard} busy={isExportingPdf} icon={<FileDown size={17} color="#1C1C1E" />} />
        <Row label="Download my data" onPress={handleExportData} busy={isExportingData} icon={<Download size={17} color="#1C1C1E" />} />
        <Row label="Delete account" onPress={handleDeleteAccount} busy={isDeleting} last icon={<Trash2 size={17} color="#B42318" />} />
      </View>

      <TouchableOpacity accessibilityRole="button" onPress={onSignOut} className="self-center min-h-[44px] flex-row items-center gap-2 px-4">
        <LogOut size={16} color="#B42318" />
        <Text className="font-sans-bold text-rose-700 text-[15px]">Sign out</Text>
      </TouchableOpacity>
    </View>
  );
};
