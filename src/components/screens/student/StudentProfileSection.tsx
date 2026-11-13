import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Share, Alert, ActivityIndicator } from 'react-native';
import { GraduationCap, Share2, LogOut, FileDown, Download, Trash2 } from 'lucide-react-native';
import { LanguageSwitcher } from '@/components/ui';
import { exportStudentReportCardPDF } from '@/services/reportCardService';
import { exportUserData, requestAccountDeletion } from '@/services/accountService';

interface StudentProfileSectionProps {
  name: string;
  email: string;
  rollNumber: string;
  parentLinkCode: string;
  batchName: string;
  overallAttendance?: number;
  onSignOut: () => void;
}

export const StudentProfileSection: React.FC<StudentProfileSectionProps> = ({
  name,
  email,
  rollNumber,
  parentLinkCode,
  batchName,
  overallAttendance = 92,
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

  const handleDownloadReportCard = async () => {
    setIsExportingPdf(true);
    try {
      await exportStudentReportCardPDF({
        studentName: name,
        rollNumber,
        batchName,
        instituteName: 'Acadly Academy Hub',
        overallAttendanceRate: overallAttendance,
        grade: 'Class 12',
        board: 'CBSE',
        results: [
          {
            examTitle: 'Term 1 Mid-Term Assessment',
            subject: 'Physics & Maths',
            marksObtained: 88,
            maxMarks: 100,
            percentage: 88,
            grade: 'A',
            remarks: 'Strong conceptual clarity in vectors & calculus.',
          },
        ],
        teacherRemarks: [
          'Demonstrates consistent engagement in live problem-solving sessions.',
          'Daily homework submissions submitted on time with clear derivations.',
        ],
      });
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

  return (
    <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3.5">
      <View className="flex-row items-center gap-3">
        <View className="w-14 h-14 rounded-2xl bg-blue-100 border border-blue-200 items-center justify-center">
          <GraduationCap size={28} color="#2563eb" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-black text-slate-900">{name}</Text>
          <Text className="text-xs text-slate-500">{email}</Text>
          <Text className="text-[11px] text-blue-600 font-bold mt-0.5">{batchName}</Text>
        </View>
      </View>

      {/* Parent Link Code Card */}
      <View className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-bold text-slate-600 uppercase">Parent Link Code</Text>
          <TouchableOpacity
            onPress={handleShareCode}
            className="flex-row items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg"
          >
            <Share2 size={12} color="#2563eb" />
            <Text className="text-[11px] font-bold text-blue-600">Share with Parent</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-lg font-black text-slate-900 tracking-wider">
          {parentLinkCode || 'STU-LINK-CODE'}
        </Text>
        <Text className="text-[11px] text-slate-500">
          Your parent or guardian enters this code in their Acadly Parent Portal to view your daily attendance and term report cards.
        </Text>
      </View>

      {/* Data Export & Report Card Actions */}
      <View className="gap-2 pt-2 border-t border-slate-100">
        <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Academic Documents & Data
        </Text>

        <TouchableOpacity
          onPress={handleDownloadReportCard}
          disabled={isExportingPdf}
          className="bg-blue-50 border border-blue-200 p-3 rounded-2xl flex-row items-center justify-between active:scale-98"
        >
          <View className="flex-row items-center gap-2">
            <FileDown size={16} color="#2563EB" />
            <Text className="text-xs font-bold text-blue-900">Download Term Report Card (PDF)</Text>
          </View>
          {isExportingPdf ? <ActivityIndicator size="small" color="#2563EB" /> : null}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleExportData}
          disabled={isExportingData}
          className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex-row items-center justify-between active:scale-98"
        >
          <View className="flex-row items-center gap-2">
            <Download size={16} color="#475569" />
            <Text className="text-xs font-bold text-slate-700">Export My Academic Records (JSON)</Text>
          </View>
          {isExportingData ? <ActivityIndicator size="small" color="#475569" /> : null}
        </TouchableOpacity>
      </View>

      <LanguageSwitcher className="mt-1" />

      {/* Account Deletion & Sign Out */}
      <View className="gap-2 pt-2 border-t border-slate-100">
        <TouchableOpacity
          onPress={handleDeleteAccount}
          disabled={isDeleting}
          className="p-3 rounded-2xl flex-row items-center justify-center gap-2 active:scale-98"
        >
          <Trash2 size={14} color="#dc2626" />
          <Text className="text-xs font-bold text-rose-600">Delete Account & Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSignOut}
          className="bg-rose-50 border border-rose-200 py-3 rounded-2xl flex-row items-center justify-center gap-2 active:scale-98"
        >
          <LogOut size={16} color="#be123c" />
          <Text className="text-xs font-bold text-rose-700">Sign Out of Student Portal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
