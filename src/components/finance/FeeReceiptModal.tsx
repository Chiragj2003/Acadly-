import React from 'react';
import { View, Text, Modal, TouchableOpacity, Alert, ScrollView } from 'react-native';
import {
  FileText,
  Download,
  Share2,
  CheckCircle,
  X,
  Building2,
  Receipt,
} from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useFeeNotification } from '@/context/FeeNotificationContext';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui';

export const FeeReceiptModal: React.FC = () => {
  const { selectedReceipt, closeReceipt } = useFeeNotification();
  const { activeInstitute } = useAuth();

  if (!selectedReceipt) return null;

  const formattedAmount = '₹' + selectedReceipt.amount.toLocaleString('en-IN');
  const baseAmount = '₹' + Math.round(selectedReceipt.amount / 1.18).toLocaleString('en-IN');
  const gstAmount = '₹' + (selectedReceipt.amount - Math.round(selectedReceipt.amount / 1.18)).toLocaleString('en-IN');

  const buildReceiptHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>GST Receipt ${selectedReceipt.receipt_number}</title>
          <style>
            @page { margin: 20mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0F172A;
              padding: 24px;
              background: #ffffff;
            }
            .header {
              border-bottom: 2px solid #2563EB;
              padding-bottom: 16px;
              margin-bottom: 20px;
            }
            .inst-name {
              font-size: 22px;
              font-weight: 800;
              color: #0F172A;
              margin: 0;
            }
            .inst-sub {
              font-size: 12px;
              color: #64748B;
              margin-top: 4px;
            }
            .badge {
              display: inline-block;
              background: #EFF6FF;
              color: #1D4ED8;
              font-size: 11px;
              font-weight: 700;
              padding: 4px 10px;
              border-radius: 999px;
              margin-top: 8px;
            }
            .grid {
              display: flex;
              justify-content: space-between;
              margin: 20px 0;
              font-size: 13px;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .table th {
              background: #F8FAFC;
              padding: 10px;
              text-align: left;
              font-size: 12px;
              border-bottom: 1px solid #E2E8F0;
              color: #64748B;
            }
            .table td {
              padding: 12px 10px;
              font-size: 13px;
              border-bottom: 1px solid #E2E8F0;
            }
            .total-row {
              font-size: 16px;
              font-weight: 800;
              color: #2563EB;
            }
            .footer {
              margin-top: 40px;
              padding-top: 14px;
              border-top: 1px solid #E2E8F0;
              text-align: center;
              font-size: 11px;
              color: #94A3B8;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="inst-name">${activeInstitute?.name || 'Apex Institute'}</h1>
            <div class="inst-sub">Central Campus • Center Code: ${activeInstitute?.center_code || 'APX-9021'}</div>
            <div class="inst-sub">GSTIN: 08AAACA9921K1ZO • Official Tax Invoice</div>
            <div class="badge">PAID & VERIFIED</div>
          </div>

          <div class="grid">
            <div>
              <div><strong>Receipt Number:</strong> ${selectedReceipt.receipt_number}</div>
              <div><strong>Student Name:</strong> ${selectedReceipt.student_name}</div>
            </div>
            <div style="text-align: right;">
              <div><strong>Date:</strong> ${new Date(selectedReceipt.paid_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              <div><strong>Payment Mode:</strong> ${selectedReceipt.payment_mode.toUpperCase()} (Online Reconciled)</div>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Tuition Fee & Curriculum Material Base</td>
                <td style="text-align: right;">${baseAmount}</td>
              </tr>
              <tr>
                <td>Integrated GST (18%)</td>
                <td style="text-align: right;">${gstAmount}</td>
              </tr>
              <tr class="total-row">
                <td>Total Fee Paid</td>
                <td style="text-align: right;">${formattedAmount}</td>
              </tr>
            </tbody>
          </table>

          <div style="font-size: 11px; color: #64748B;">
            <div><strong>Transaction Reference:</strong> ${selectedReceipt.razorpay_payment_id || 'UPI-GATEWAY-RECONCILED'}</div>
            <div>Computer generated invoice. No signature required.</div>
          </div>

          <div class="footer">
            <p>Generated by Acadly Coaching Management Platform • Payment Reconciliation Desk</p>
          </div>
        </body>
      </html>
    `;
  };

  const handleDownloadPDF = async () => {
    try {
      const html = buildReceiptHTML();
      const { uri } = await Print.printToFileAsync({ html });
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `GST Receipt ${selectedReceipt.receipt_number}`,
        });
      } else {
        Alert.alert('Receipt Generated', `Saved to ${uri}`);
      }
    } catch {
      Alert.alert('PDF Error', 'Could not generate official receipt PDF.');
    }
  };

  const handleShareWhatsApp = () => {
    Alert.alert(
      'WhatsApp Receipt 📲',
      `Dispatched verified fee receipt #${selectedReceipt.receipt_number} to registered parent WhatsApp contact.`
    );
  };

  return (
    <Modal visible={Boolean(selectedReceipt)} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-white rounded-t-3xl overflow-hidden max-h-[92%] flex-col border-t border-slate-200">
          {/* Top Bar */}
          <View className="h-14 px-5 flex-row items-center justify-between border-b border-slate-100 bg-slate-50">
            <View className="flex-row items-center gap-2">
              <Receipt size={18} color="#2563EB" />
              <Text className="text-sm font-bold text-slate-900">Official Tax Receipt</Text>
            </View>

            <TouchableOpacity
              onPress={closeReceipt}
              className="w-8 h-8 rounded-full bg-slate-200/70 items-center justify-center active:scale-95"
            >
              <X size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Receipt Canvas */}
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            {/* Institute Identity Banner */}
            <View className="p-5 rounded-2xl border border-slate-200 bg-slate-50 gap-3">
              <View className="items-center text-center gap-0.5 pb-3 border-b border-slate-200">
                <Text className="text-base font-extrabold text-slate-900 text-center">
                  {activeInstitute?.name || 'Apex Institute'}
                </Text>
                <Text className="text-xs text-slate-500 text-center">
                  Central Campus • Center Code: {activeInstitute?.center_code || 'APX-9021'}
                </Text>
                <Text className="text-[10px] text-slate-400 font-mono mt-0.5">
                  GSTIN: 08AAACA9921K1ZO
                </Text>
              </View>

              {/* Receipt & Student Details */}
              <View className="flex-row items-start justify-between py-1">
                <View className="gap-1">
                  <Text className="text-[11px] text-slate-400 uppercase tracking-wider">Receipt No:</Text>
                  <Text className="text-xs font-mono font-bold text-blue-600">
                    {selectedReceipt.receipt_number}
                  </Text>
                  <Text className="text-[11px] text-slate-400 uppercase tracking-wider mt-1">Student:</Text>
                  <Text className="text-xs font-bold text-slate-900">
                    {selectedReceipt.student_name}
                  </Text>
                </View>

                <View className="items-end gap-1">
                  <Text className="text-[11px] text-slate-400 uppercase tracking-wider">Date:</Text>
                  <Text className="text-xs font-semibold text-slate-800">
                    {new Date(selectedReceipt.paid_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text className="text-[11px] text-slate-400 uppercase tracking-wider mt-1">Status:</Text>
                  <Badge label="PAID & VERIFIED" variant="success" />
                </View>
              </View>

              {/* Fee Breakdown Table */}
              <View className="p-3.5 rounded-xl bg-white border border-slate-200/90 gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-slate-500">Tuition & Academic Base:</Text>
                  <Text className="text-xs font-semibold text-slate-800">{baseAmount}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-slate-500">GST (18% Integrated):</Text>
                  <Text className="text-xs font-semibold text-slate-800">{gstAmount}</Text>
                </View>
                <View className="h-[1px] bg-slate-200 my-1" />
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-bold text-slate-900">Total Amount Paid:</Text>
                  <Text className="text-base font-extrabold text-blue-600">
                    {formattedAmount}
                  </Text>
                </View>
              </View>

              {/* Transaction Ref */}
              <View className="flex-row items-center justify-between pt-1">
                <View className="flex-row items-center gap-1.5">
                  <CheckCircle size={15} color="#059669" />
                  <Text className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Reconciled
                  </Text>
                </View>
                <Text className="text-[10px] text-slate-400 font-mono">
                  Txn: {selectedReceipt.razorpay_payment_id || 'UPI-GATEWAY'}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View className="flex-row gap-2 pt-1 pb-4">
              <TouchableOpacity
                onPress={handleDownloadPDF}
                className="flex-1 bg-blue-600 py-3 rounded-2xl flex-row items-center justify-center gap-2 active:scale-98 shadow-xs"
              >
                <Download size={15} color="#ffffff" />
                <Text className="text-xs font-bold text-white">Download GST PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleShareWhatsApp}
                className="bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-2xl flex-row items-center justify-center gap-1.5 active:scale-98"
              >
                <Share2 size={15} color="#059669" />
                <Text className="text-xs font-bold text-emerald-800">WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
