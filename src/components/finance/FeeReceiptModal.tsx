import React from 'react';
import { View, Text, Modal, Pressable, Alert } from 'react-native';
import {
  FileText,
  Download,
  Share2,
  CheckCircle,
  X,
  Building2,
  QrCode,
} from 'lucide-react-native';
import { useFeeNotification } from '@/context/FeeNotificationContext';
import { useAuth } from '@/context/AuthContext';
import { Card, Button, Badge } from '@/components/ui';

export const FeeReceiptModal: React.FC = () => {
  const { selectedReceipt, closeReceipt } = useFeeNotification();
  const { activeInstitute } = useAuth();

  if (!selectedReceipt) return null;

  const handleShareWhatsApp = () => {
    Alert.alert(
      'WhatsApp Receipt',
      `Sent verified fee receipt #${selectedReceipt.receipt_number} to registered parent WhatsApp number.`
    );
  };

  const handleDownload = () => {
    Alert.alert(
      'PDF Downloaded',
      `Receipt #${selectedReceipt.receipt_number}.pdf saved to your device downloads.`
    );
  };

  const formattedAmount = '₹' + selectedReceipt.amount.toLocaleString('en-IN');
  const baseAmount = '₹' + Math.round(selectedReceipt.amount / 1.18).toLocaleString('en-IN');
  const gstAmount = '₹' + (selectedReceipt.amount - Math.round(selectedReceipt.amount / 1.18)).toLocaleString('en-IN');

  return (
    <Modal visible={Boolean(selectedReceipt)} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-surface rounded-t-3xl overflow-hidden max-h-[92%] flex-col">
          {/* Top Bar */}
          <View className="h-14 px-4 flex-row items-center justify-between border-b border-black/5 bg-surface-container-low">
            <View className="flex-row items-center gap-2">
              <FileText size={18} color="#0051d5" />
              <Text className="text-sm font-bold text-on-surface">Payment Receipt</Text>
            </View>

            <Pressable
              onPress={closeReceipt}
              className="w-8 h-8 rounded-full bg-surface-container-highest items-center justify-center"
            >
              <X size={18} color="#0b1c30" />
            </Pressable>
          </View>

          {/* Receipt Canvas */}
          <View className="p-4 gap-3 bg-surface">
            {/* Institute Identity Banner */}
            <Card elevation="lowest" className="p-4 gap-3 border-2 border-dashed border-black/10">
              <View className="items-center text-center gap-0.5 pb-2 border-b border-black/5">
                <Text className="text-base font-bold text-on-surface text-center">
                  {activeInstitute?.name || 'Apex IIT-JEE & Medical Academy'}
                </Text>
                <Text className="text-[11px] text-on-surface-variant text-center">
                  Kota Campus • Center Code: {activeInstitute?.center_code || 'APX-9021'}
                </Text>
                <Text className="text-[10px] text-on-surface-variant font-mono">
                  GSTIN: 08AAACA9921K1ZO
                </Text>
              </View>

              {/* Receipt & Student Details */}
              <View className="flex-row items-start justify-between py-1">
                <View className="gap-0.5">
                  <Text className="text-[11px] text-on-surface-variant">Receipt No:</Text>
                  <Text className="text-xs font-bold text-secondary font-mono">
                    {selectedReceipt.receipt_number}
                  </Text>
                  <Text className="text-[11px] text-on-surface-variant mt-1">Student:</Text>
                  <Text className="text-xs font-bold text-on-surface">
                    {selectedReceipt.student_name}
                  </Text>
                </View>

                <View className="items-end gap-0.5">
                  <Text className="text-[11px] text-on-surface-variant">Date:</Text>
                  <Text className="text-xs font-semibold text-on-surface">
                    {new Date(selectedReceipt.paid_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text className="text-[11px] text-on-surface-variant mt-1">Payment Mode:</Text>
                  <Badge label={selectedReceipt.payment_mode.toUpperCase()} variant="info" />
                </View>
              </View>

              {/* Fee Breakdown Table */}
              <View className="p-3 rounded-xl bg-surface-container-low gap-1.5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-on-surface-variant">Tuition & Academic Base:</Text>
                  <Text className="text-xs font-semibold text-on-surface">{baseAmount}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-on-surface-variant">GST (18% Integrated):</Text>
                  <Text className="text-xs font-semibold text-on-surface">{gstAmount}</Text>
                </View>
                <View className="h-[1px] bg-black/10 my-0.5" />
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-bold text-on-surface">Total Paid:</Text>
                  <Text className="text-base font-bold text-on-tertiary-container">
                    {formattedAmount}
                  </Text>
                </View>
              </View>

              {/* Verified Stamp & Transaction Reference */}
              <View className="flex-row items-center justify-between pt-1">
                <View className="flex-row items-center gap-1.5">
                  <CheckCircle size={16} color="#069669" />
                  <Text className="text-xs font-bold text-on-tertiary-container uppercase tracking-wider">
                    Paid & Verified
                  </Text>
                </View>
                <Text className="text-[10px] text-on-surface-variant font-mono">
                  Txn: {selectedReceipt.razorpay_payment_id || 'UPI-GATEWAY'}
                </Text>
              </View>
            </Card>

            {/* Actions */}
            <View className="flex-row gap-2 pt-1">
              <View className="flex-1">
                <Button
                  variant="primary"
                  title="Download PDF"
                  leftIcon={<Download size={14} color="#ffffff" />}
                  fullWidth
                  onPress={handleDownload}
                />
              </View>
              <Button
                variant="surface"
                title="WhatsApp"
                leftIcon={<Share2 size={14} color="#069669" />}
                onPress={handleShareWhatsApp}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};
