import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import {
  TrendingUp,
  FileSpreadsheet,
  Download,
  CheckCircle,
  Users,
  Wallet,
  CalendarCheck,
  Building2,
} from 'lucide-react-native';
import { useFeeNotification } from '@/context/FeeNotificationContext';
import { useAuth } from '@/context/AuthContext';
import { Card, Button, Badge } from '@/components/ui';

export const AdminAnalyticsView: React.FC = () => {
  const { analytics } = useFeeNotification();
  const { activeInstitute } = useAuth();

  const totalFeePool = analytics.total_collected_amount + analytics.total_pending_dues;
  const collectionRate = Math.round((analytics.total_collected_amount / totalFeePool) * 100);

  const handleExportReport = (reportName: string) => {
    Alert.alert(
      'Report Exported',
      `Generated "${reportName}_${activeInstitute?.center_code || 'APX'}_${new Date().toISOString().split('T')[0]}.csv". Sent to admin email.`
    );
  };

  return (
    <View className="gap-3.5">
      {/* Financial Health & Fee Recovery Progress */}
      <Card elevation="lowest" className="p-4 gap-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Institute Revenue Realization
            </Text>
            <Text className="text-xl font-bold text-on-surface mt-0.5">
              ₹{(analytics.total_collected_amount / 10000000).toFixed(2)} Cr
              <Text className="text-xs text-on-surface-variant font-medium"> / ₹{(totalFeePool / 10000000).toFixed(2)} Cr</Text>
            </Text>
          </View>
          <Badge label={`${collectionRate}% Collected`} variant="success" />
        </View>

        {/* Visual Progress Bar */}
        <View className="w-full h-3 rounded-full bg-surface-container overflow-hidden flex-row">
          <View
            style={{ width: `${collectionRate}%` }}
            className="h-full bg-on-tertiary-container rounded-full"
          />
        </View>

        <View className="flex-row items-center justify-between pt-1 text-xs">
          <View className="flex-row items-center gap-1.5">
            <View className="w-2.5 h-2.5 rounded-full bg-on-tertiary-container" />
            <Text className="text-xs text-on-surface-variant">
              Collected: ₹{(analytics.total_collected_amount / 100000).toFixed(1)}L
            </Text>
          </View>

          <View className="flex-row items-center gap-1.5">
            <View className="w-2.5 h-2.5 rounded-full bg-error" />
            <Text className="text-xs text-on-surface-variant">
              Pending Dues: ₹{(analytics.total_pending_dues / 100000).toFixed(2)}L
            </Text>
          </View>
        </View>
      </Card>

      {/* Attendance & Faculty Roll Metrics */}
      <Card elevation="lowest" className="p-4 gap-2.5">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            Daily Academic Operations
          </Text>
          <Badge label="Kota Campus" variant="info" />
        </View>

        <View className="flex-row gap-2 pt-1">
          <View className="flex-1 p-3 rounded-xl bg-surface-container-low items-center">
            <Text className="text-lg font-bold text-on-tertiary-container">{analytics.present_count}</Text>
            <Text className="text-[11px] text-on-surface-variant font-medium">Present Today</Text>
          </View>

          <View className="flex-1 p-3 rounded-xl bg-surface-container-low items-center">
            <Text className="text-lg font-bold text-error">{analytics.absent_count}</Text>
            <Text className="text-[11px] text-on-surface-variant font-medium">Unexcused Absences</Text>
          </View>

          <View className="flex-1 p-3 rounded-xl bg-surface-container-low items-center">
            <Text className="text-lg font-bold text-secondary">{analytics.faculty_count}</Text>
            <Text className="text-[11px] text-on-surface-variant font-medium">Active Faculty</Text>
          </View>
        </View>
      </Card>

      {/* Official Audit Report Exports */}
      <View className="gap-2">
        <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">
          Generate Institutional Reports
        </Text>

        <View className="gap-2">
          <Pressable
            onPress={() => handleExportReport('Daily_Attendance_Audit')}
            className="p-3.5 rounded-2xl bg-surface-container-lowest border border-black/5 flex-row items-center justify-between shadow-xs active:bg-surface-container-high"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-lg bg-surface-container items-center justify-center">
                <FileSpreadsheet size={18} color="#069669" />
              </View>
              <View>
                <Text className="text-xs font-bold text-on-surface">Daily Attendance Audit Report</Text>
                <Text className="text-[11px] text-on-surface-variant">Roll call, timings, and parent WhatsApp dispatch logs</Text>
              </View>
            </View>
            <Download size={16} color="#0051d5" />
          </Pressable>

          <Pressable
            onPress={() => handleExportReport('Batch_Fee_Collections_Ledger')}
            className="p-3.5 rounded-2xl bg-surface-container-lowest border border-black/5 flex-row items-center justify-between shadow-xs active:bg-surface-container-high"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-lg bg-surface-container items-center justify-center">
                <FileSpreadsheet size={18} color="#0051d5" />
              </View>
              <View>
                <Text className="text-xs font-bold text-on-surface">Fee Collection & Dues Ledger</Text>
                <Text className="text-[11px] text-on-surface-variant">Razorpay order IDs, GST breakdown, pending 34 accounts</Text>
              </View>
            </View>
            <Download size={16} color="#0051d5" />
          </Pressable>

          <Pressable
            onPress={() => handleExportReport('Student_AIR_Mock_Scores')}
            className="p-3.5 rounded-2xl bg-surface-container-lowest border border-black/5 flex-row items-center justify-between shadow-xs active:bg-surface-container-high"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-lg bg-surface-container items-center justify-center">
                <FileSpreadsheet size={18} color="#ba1a1a" />
              </View>
              <View>
                <Text className="text-xs font-bold text-on-surface">All-India Rank Mock Performance</Text>
                <Text className="text-[11px] text-on-surface-variant">Batch-wise percentile scores and top-rank tracking</Text>
              </View>
            </View>
            <Download size={16} color="#0051d5" />
          </Pressable>
        </View>
      </View>
    </View>
  );
};
