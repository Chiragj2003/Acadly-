import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Wallet, CreditCard, FileText, Download, Award } from 'lucide-react-native';
import { Badge } from '@/components/ui';
import { FEATURE_FEES } from '@/config/features';
import { ChildStudent } from '@/context/ChildContext';
import { type StudentFee, type PaymentRecord } from '@/types/database';

interface ParentFeesTabProps {
  selectedChild: ChildStudent | null;
  studentFees: StudentFee[];
  payments: PaymentRecord[];
  onOpenRazorpay: (fee: StudentFee) => void;
  onOpenReceipt: (payment: PaymentRecord) => void;
  onDownloadInvoice: () => void;
  onDownloadReport: () => void;
}

export const ParentFeesTab: React.FC<ParentFeesTabProps> = ({
  selectedChild,
  studentFees,
  payments,
  onOpenRazorpay,
  onOpenReceipt,
  onDownloadInvoice,
  onDownloadReport,
}) => {
  const currentFee = studentFees[0];
  const lastPayment = payments[0];

  return (
    <View className="gap-3.5">
      {FEATURE_FEES ? (
        <>
          {/* Tuition Fee Ledger Card */}
          <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3.5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Wallet size={18} color="#1C1C1E" />
                <Text className="text-sm font-sans-bold text-slate-900">Tuition Fee Ledger</Text>
              </View>
              <Badge label="Due in 12 Days" variant="warning" />
            </View>

            <View className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 gap-2">
              <View className="flex-row justify-between">
                <Text className="text-xs text-slate-500">Academic Term Plan</Text>
                <Text className="text-xs font-sans-bold text-slate-800">
                  {selectedChild?.batch_name || 'Full Term Academic'}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-slate-500">Gross Term Fee</Text>
                <Text className="text-xs font-sans-bold text-slate-800">₹45,000</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-slate-500">Scholarship Concession</Text>
                <Text className="text-xs font-sans-bold text-emerald-700">- ₹5,000</Text>
              </View>
              <View className="pt-2 border-t border-slate-200 flex-row justify-between items-center">
                <Text className="text-sm font-sans-bold text-slate-900">Remaining Balance Due</Text>
                <Text className="text-xl font-display text-blue-600">₹15,000</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => currentFee && onOpenRazorpay(currentFee)}
              className="bg-blue-600 py-3 rounded-2xl flex-row items-center justify-center gap-2 shadow-xs active:scale-98"
            >
              <CreditCard size={16} color="#ffffff" />
              <Text className="text-xs font-sans-bold text-white">Pay Online via UPI / Netbanking</Text>
            </TouchableOpacity>
          </View>

          {/* Official Tax Invoices & Receipts */}
          <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <FileText size={18} color="#059669" />
                <Text className="text-sm font-sans-bold text-slate-900">Payment Invoices & Receipts</Text>
              </View>
              <Badge label="GST Compliant" variant="neutral" />
            </View>

            {lastPayment && (
              <View className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1 pr-2">
                  <View className="w-10 h-10 rounded-xl bg-white border border-slate-200 items-center justify-center">
                    <FileText size={18} color="#1C1C1E" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-sans-bold text-slate-900">{lastPayment.receipt_number}</Text>
                    <Text className="text-[11px] text-slate-500">
                      Paid ₹{lastPayment.amount.toLocaleString()} • Razorpay UPI
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-1.5">
                  <TouchableOpacity
                    onPress={() => onOpenReceipt(lastPayment)}
                    className="bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl active:scale-95"
                  >
                    <Text className="text-xs font-sans-bold text-blue-600">View</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={onDownloadInvoice}
                    className="bg-blue-600 px-2.5 py-1.5 rounded-xl flex-row items-center gap-1 active:scale-95"
                  >
                    <Download size={12} color="#ffffff" />
                    <Text className="text-xs font-sans-bold text-white">PDF</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </>
      ) : (
        /* Progress Reports Mode */
        <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3.5">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Award size={18} color="#1C1C1E" />
              <Text className="text-sm font-sans-bold text-slate-900">Official Term Report Card</Text>
            </View>
            <Badge label="Term 1 Evaluated" variant="success" />
          </View>

          <View className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 gap-2.5">
            <View className="flex-row justify-between">
              <Text className="text-xs text-slate-500">Student Name</Text>
              <Text className="text-xs font-sans-bold text-slate-800">{selectedChild?.full_name || 'Student'}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-slate-500">Assigned Batch</Text>
              <Text className="text-xs font-sans-bold text-slate-800">{selectedChild?.batch_name || 'General'}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onDownloadReport}
            className="bg-blue-600 py-3 rounded-2xl flex-row items-center justify-center gap-2 shadow-xs active:scale-98"
          >
            <Download size={16} color="#ffffff" />
            <Text className="text-xs font-sans-bold text-white">Download Term Report Card (PDF)</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
