import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, Alert, Share, ActivityIndicator } from 'react-native';
import { Home, LogOut, FileDown, Download, Trash2 } from 'lucide-react-native';
import { Badge, LanguageSwitcher } from '@/components/ui';
import { exportStudentReportCardPDF } from '@/services/reportCardService';
import { exportUserData, requestAccountDeletion } from '@/services/accountService';
import { type ChildStudent } from '@/stores/useChildStore';

interface ParentProfileTabProps {
  userEmail?: string;
  selectedChild?: ChildStudent | null;
  onLogout: () => void;
}

export const ParentProfileTab: React.FC<ParentProfileTabProps> = ({
  userEmail,
  selectedChild,
  onLogout,
}) => {
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [waDailyDigest, setWaDailyDigest] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDownloadReportCard = async () => {
    if (!selectedChild) {
      Alert.alert('No Child Selected', 'Please link or select a child first.');
      return;
    }

    setIsExportingPdf(true);
    try {
      await exportStudentReportCardPDF({
        studentName: selectedChild.full_name,
        rollNumber: selectedChild.admission_number,
        batchName: selectedChild.batch_name || 'Enrolled Batch',
        instituteName: 'Acadly Academy Hub',
        overallAttendanceRate: 94,
        grade: selectedChild.grade || 'Class 12',
        board: 'CBSE',
        results: [
          {
            examTitle: 'Quarterly Physics & Chemistry Review',
            subject: 'Physics',
            marksObtained: 92,
            maxMarks: 100,
            percentage: 92,
            grade: 'A+',
            remarks: 'Exemplary performance across theoretical and practical questions.',
          },
        ],
        teacherRemarks: [
          'Excellent attendance and punctuality in online morning lectures.',
          'Consistently completes weekly assignments with high precision.',
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
        title: 'Acadly_Parent_Data_Export.json',
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
      'Delete Parent Account & Data? ⚠️',
      'This will permanently anonymize your account profile, remove child links, and stop all notifications in compliance with app store privacy policies. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await requestAccountDeletion();
              Alert.alert('Account Deletion Complete', 'Your account has been deleted.');
              onLogout();
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
    <View className="gap-3.5">
      <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3.5">
        <View className="flex-row items-center gap-3.5">
          <View className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 items-center justify-center">
            <Home size={28} color="#1C1C1E" />
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-lg font-display text-slate-900">Primary Guardian</Text>
            <Text className="text-xs text-slate-500">Verified Parent Portal</Text>
            <Badge label="Free Parent Access" variant="success" />
          </View>
        </View>

        <View className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 gap-2">
          <View className="flex-row justify-between">
            <Text className="text-xs text-slate-500">Registered Email:</Text>
            <Text className="text-xs font-sans-bold text-slate-800">
              {userEmail || 'parent@tuition.app'}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-slate-500">Account Type:</Text>
            <Text className="text-xs font-sans-bold text-blue-600">Parent / Guardian (Free)</Text>
          </View>
          {selectedChild && (
            <View className="flex-row justify-between pt-1 border-t border-slate-200">
              <Text className="text-xs text-slate-500">Active Ward:</Text>
              <Text className="text-xs font-sans-bold text-slate-900">{selectedChild.full_name}</Text>
            </View>
          )}
        </View>

        {/* Academic Documents & PDF Export */}
        <View className="gap-2 pt-2 border-t border-slate-100">
          <Text className="text-xs font-sans-bold text-slate-500 uppercase tracking-wider">
            Ward Academic Documents
          </Text>

          <TouchableOpacity
            onPress={handleDownloadReportCard}
            disabled={isExportingPdf}
            className="bg-blue-50 border border-blue-200 p-3 rounded-2xl flex-row items-center justify-between active:scale-98"
          >
            <View className="flex-row items-center gap-2">
              <FileDown size={16} color="#1C1C1E" />
              <Text className="text-xs font-sans-bold text-blue-900">
                Download {selectedChild ? `${selectedChild.full_name}'s ` : ''}Report Card (PDF)
              </Text>
            </View>
            {isExportingPdf ? <ActivityIndicator size="small" color="#1C1C1E" /> : null}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleExportData}
            disabled={isExportingData}
            className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex-row items-center justify-between active:scale-98"
          >
            <View className="flex-row items-center gap-2">
              <Download size={16} color="#4A463F" />
              <Text className="text-xs font-sans-bold text-slate-700">Export Parent Account Records (JSON)</Text>
            </View>
            {isExportingData ? <ActivityIndicator size="small" color="#4A463F" /> : null}
          </TouchableOpacity>
        </View>

        {/* Notification Preferences */}
        <View className="gap-2 pt-2 border-t border-slate-100">
          <Text className="text-xs font-sans-bold text-slate-500 uppercase tracking-wider">
            Notification Preferences
          </Text>

          <View className="flex-row items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <View className="flex-1 pr-2">
              <Text className="text-xs font-sans-bold text-slate-800">Batched Attendance Alerts</Text>
              <Text className="text-[11px] text-slate-500">Receive in-app alerts when roll call is committed</Text>
            </View>
            <Switch
              value={waDailyDigest}
              onValueChange={setWaDailyDigest}
              trackColor={{ false: '#D8D3CA', true: '#1C1C1E' }}
            />
          </View>

          <View className="flex-row items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <View className="flex-1 pr-2">
              <Text className="text-xs font-sans-bold text-slate-800">Academic Score Updates</Text>
              <Text className="text-[11px] text-slate-500">Instant notification when new test results are published</Text>
            </View>
            <Switch
              value={smsAlerts}
              onValueChange={setSmsAlerts}
              trackColor={{ false: '#D8D3CA', true: '#1C1C1E' }}
            />
          </View>
        </View>

        {/* App Language Switcher */}
        <LanguageSwitcher className="mt-3 mb-1" />

        {/* Account Deletion & Sign Out */}
        <View className="gap-2 pt-2 border-t border-slate-100">
          <TouchableOpacity
            onPress={handleDeleteAccount}
            disabled={isDeleting}
            className="p-3 rounded-2xl flex-row items-center justify-center gap-2 active:scale-98"
          >
            <Trash2 size={14} color="#dc2626" />
            <Text className="text-xs font-sans-bold text-rose-600">Delete Account & Data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onLogout}
            className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex-row items-center justify-center gap-2 active:scale-98"
          >
            <LogOut size={16} color="#e11d48" />
            <Text className="text-xs font-sans-bold text-rose-700">Sign Out of Parent Portal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
