import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ActivityIndicator, Alert } from 'react-native';
import {
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building,
  CheckCircle2,
  X,
  Lock,
} from 'lucide-react-native';
import { useFeeNotification } from '@/context/FeeNotificationContext';
import { Button, Badge, Card } from '@/components/ui';

export const RazorpayCheckoutModal: React.FC = () => {
  const { activeCheckoutFee, closeRazorpayCheckout, completeRazorpayPayment } = useFeeNotification();
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!activeCheckoutFee) return null;

  const amountFormatted = '₹' + activeCheckoutFee.pending_amount.toLocaleString('en-IN');

  const handlePay = async () => {
    setIsProcessing(true);
    setTimeout(async () => {
      setIsProcessing(false);
      await completeRazorpayPayment(activeCheckoutFee, selectedMethod === 'upi' ? 'upi' : 'razorpay');
    }, 1200);
  };

  return (
    <Modal visible={Boolean(activeCheckoutFee)} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-surface rounded-t-3xl overflow-hidden max-h-[90%] flex-col">
          {/* Razorpay Brand Header */}
          <View className="bg-primary-container p-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-lg bg-secondary items-center justify-center">
                <ShieldCheck size={18} color="#ffffff" />
              </View>
              <View>
                <Text className="text-sm font-bold text-surface-bright">Razorpay Trusted Gateway</Text>
                <Text className="text-[11px] text-primary-fixed-dim">256-Bit SSL Secured Checkout</Text>
              </View>
            </View>

            <Pressable
              onPress={closeRazorpayCheckout}
              disabled={isProcessing}
              className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
            >
              <X size={18} color="#ffffff" />
            </Pressable>
          </View>

          {/* Amount & Fee Summary */}
          <View className="p-4 gap-3.5 bg-surface">
            <Card elevation="lowest" className="p-3.5 flex-row items-center justify-between">
              <View className="flex-1 min-w-0 mr-2">
                <Text className="text-xs text-on-surface-variant font-medium">Payment For:</Text>
                <Text className="text-sm font-bold text-on-surface" numberOfLines={1}>
                  {activeCheckoutFee.title}
                </Text>
                <Text className="text-xs text-on-surface-variant">
                  Student: {activeCheckoutFee.student_name} ({activeCheckoutFee.roll_number})
                </Text>
              </View>

              <View className="items-end">
                <Text className="text-xl font-bold text-on-surface">{amountFormatted}</Text>
                <Badge label="Due Balance" variant="due" />
              </View>
            </Card>

            {/* Payment Method Selector */}
            <View className="gap-2">
              <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">
                Select Payment Mode
              </Text>

              {/* UPI Option */}
              <Pressable
                onPress={() => setSelectedMethod('upi')}
                className={`p-3.5 rounded-xl border flex-row items-center justify-between ${
                  selectedMethod === 'upi'
                    ? 'bg-secondary/10 border-secondary'
                    : 'bg-surface-container-low border-transparent'
                }`}
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-9 h-9 rounded-lg bg-surface-container items-center justify-center">
                    <Smartphone size={18} color="#0051d5" />
                  </View>
                  <View>
                    <Text className="text-sm font-bold text-on-surface">Instant UPI Apps</Text>
                    <Text className="text-xs text-on-surface-variant">Google Pay, PhonePe, Paytm, BHIM</Text>
                  </View>
                </View>
                {selectedMethod === 'upi' && <CheckCircle2 size={18} color="#0051d5" />}
              </Pressable>

              {/* Cards Option */}
              <Pressable
                onPress={() => setSelectedMethod('card')}
                className={`p-3.5 rounded-xl border flex-row items-center justify-between ${
                  selectedMethod === 'card'
                    ? 'bg-secondary/10 border-secondary'
                    : 'bg-surface-container-low border-transparent'
                }`}
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-9 h-9 rounded-lg bg-surface-container items-center justify-center">
                    <CreditCard size={18} color="#0051d5" />
                  </View>
                  <View>
                    <Text className="text-sm font-bold text-on-surface">Debit / Credit Cards</Text>
                    <Text className="text-xs text-on-surface-variant">Visa, MasterCard, RuPay</Text>
                  </View>
                </View>
                {selectedMethod === 'card' && <CheckCircle2 size={18} color="#0051d5" />}
              </Pressable>

              {/* Netbanking Option */}
              <Pressable
                onPress={() => setSelectedMethod('netbanking')}
                className={`p-3.5 rounded-xl border flex-row items-center justify-between ${
                  selectedMethod === 'netbanking'
                    ? 'bg-secondary/10 border-secondary'
                    : 'bg-surface-container-low border-transparent'
                }`}
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-9 h-9 rounded-lg bg-surface-container items-center justify-center">
                    <Building size={18} color="#0051d5" />
                  </View>
                  <View>
                    <Text className="text-sm font-bold text-on-surface">Net Banking</Text>
                    <Text className="text-xs text-on-surface-variant">HDFC, SBI, ICICI, Axis Bank</Text>
                  </View>
                </View>
                {selectedMethod === 'netbanking' && <CheckCircle2 size={18} color="#0051d5" />}
              </Pressable>
            </View>

            {/* Pay CTA */}
            <View className="pt-2 gap-2">
              <Button
                variant="primary"
                title={`Pay ${amountFormatted} via Razorpay`}
                leftIcon={<Lock size={16} color="#ffffff" />}
                loading={isProcessing}
                fullWidth
                onPress={handlePay}
              />

              <Text className="text-[11px] text-center text-on-surface-variant">
                Official digital receipt will be automatically generated upon payment.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};
