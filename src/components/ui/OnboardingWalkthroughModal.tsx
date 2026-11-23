import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sparkles, CheckCircle2, ArrowRight, X, Shield, BookOpen, Clock, Users } from 'lucide-react-native';

export interface OnboardingWalkthroughModalProps {
  role: 'student' | 'teacher' | 'parent' | 'admin';
  visible?: boolean;
  onClose?: () => void;
}

interface WalkthroughStep {
  title: string;
  description: string;
  icon: (color: string) => React.ReactNode;
}

const roleSteps: Record<'student' | 'teacher' | 'parent' | 'admin', WalkthroughStep[]> = {
  student: [
    {
      title: 'Your Academic Schedule',
      description: 'Check daily lectures, view timetable rooms, and join class discussions with your faculty.',
      icon: (c) => <Clock size={24} color={c} />,
    },
    {
      title: 'Practice DPPs & Quizzes',
      description: 'Solve interactive multiple-choice questions and upload step-by-step written homework solutions.',
      icon: (c) => <BookOpen size={24} color={c} />,
    },
    {
      title: 'Attendance & Mastery Reports',
      description: 'Monitor your monthly attendance trends, download official term report cards, and celebrate milestones.',
      icon: (c) => <Sparkles size={24} color={c} />,
    },
  ],
  teacher: [
    {
      title: 'Single-Tap Attendance',
      description: 'Mark attendance quickly, record immutable corrections with reason codes, and batch-notify parents.',
      icon: (c) => <CheckCircle2 size={24} color={c} />,
    },
    {
      title: 'AI-Assisted Quiz Builder',
      description: 'Generate conceptual multiple-choice drafts from lecture notes with Google Gemini. You review and publish.',
      icon: (c) => <Sparkles size={24} color={c} />,
    },
    {
      title: 'Formative Grading Assistant',
      description: 'Receive AI-suggested marks for written student derivations. The final evaluation is always in your control.',
      icon: (c) => <BookOpen size={24} color={c} />,
    },
  ],
  parent: [
    {
      title: 'Link Your Child with Code',
      description: 'Connect your child’s enrollment in seconds using their institute roll code. Access is 100% free.',
      icon: (c) => <Users size={24} color={c} />,
    },
    {
      title: 'Batched Attendance Notices',
      description: 'Receive instant push alerts whenever attendance is marked absent or late, keeping you informed daily.',
      icon: (c) => <Clock size={24} color={c} />,
    },
    {
      title: 'Term Progress Cards (PDF)',
      description: 'Download and print verified PDF term reports detailing your child’s marks, remarks, and growth.',
      icon: (c) => <Shield size={24} color={c} />,
    },
  ],
  admin: [
    {
      title: 'Institute & Batch Control',
      description: 'Create coaching institutes, define batch timings, assign teachers, and manage pending student admissions.',
      icon: (c) => <Users size={24} color={c} />,
    },
    {
      title: 'Fee Collection & Records',
      description: 'Track monthly tuition fees, monitor outstanding dues, and generate direct Razorpay payment links.',
      icon: (c) => <CheckCircle2 size={24} color={c} />,
    },
    {
      title: 'Audit & Compliance',
      description: 'Inspect immutable attendance logs, enforce row-level security isolation, and maintain institutional records.',
      icon: (c) => <Shield size={24} color={c} />,
    },
  ],
};

export const OnboardingWalkthroughModal: React.FC<OnboardingWalkthroughModalProps> = ({
  role,
  visible: forcedVisible,
  onClose: customOnClose,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const storageKey = `@acadly_walkthrough_seen_${role}`;
  const steps = roleSteps[role] || roleSteps.student;

  useEffect(() => {
    if (forcedVisible !== undefined) {
      setIsOpen(forcedVisible);
      return;
    }

    AsyncStorage.getItem(storageKey)
      .then((seen) => {
        if (!seen) {
          setIsOpen(true);
        }
      })
      .catch(() => null);
  }, [forcedVisible, storageKey]);

  const handleFinish = async () => {
    setIsOpen(false);
    try {
      await AsyncStorage.setItem(storageKey, 'true');
    } catch {
      // Storage error ignored
    }
    if (customOnClose) {
      customOnClose();
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  if (!isOpen) return null;

  const step = steps[currentStep];

  return (
    <Modal visible={isOpen} transparent animationType="fade">
      <View className="flex-1 bg-black/60 items-center justify-center p-4">
        <View className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm shadow-xl gap-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              {steps.map((_, i) => (
                <View
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentStep
                      ?'w-6 bg-blue-600'
                      :'w-2 bg-slate-200'
                  }`}
                />
              ))}
            </View>
            <TouchableOpacity
              onPress={handleFinish}
              accessibilityRole="button"
              accessibilityLabel="Skip Walkthrough"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
            >
              <X size={16} color="#6E6A63" />
            </TouchableOpacity>
          </View>

          <View className="items-center py-4 gap-3">
            <View className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 items-center justify-center">
              {step.icon('#1C1C1E')}
            </View>
            <Text className="text-lg font-display text-slate-900 text-center">
              {step.title}
            </Text>
            <Text className="text-xs text-slate-600 text-center leading-relaxed">
              {step.description}
            </Text>
          </View>

          <View className="flex-row items-center gap-2 pt-2 border-t border-slate-100">
            {currentStep > 0 && (
              <TouchableOpacity
                onPress={() => setCurrentStep(currentStep - 1)}
                accessibilityRole="button"
                accessibilityLabel="Previous Step"
                className="px-4 py-3 rounded-xl border border-slate-200 items-center justify-center min-h-[44px]"
              >
                <Text className="text-xs font-sans-bold text-slate-700">Back</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleNext}
              accessibilityRole="button"
              accessibilityLabel={currentStep === steps.length - 1 ? 'Get Started' : 'Next Step'}
              className="flex-1 bg-blue-600 py-3 rounded-xl items-center justify-center flex-row gap-1.5 min-h-[44px] active:scale-98"
            >
              <Text className="text-xs font-sans-bold text-white">
                {currentStep === steps.length - 1 ? 'Get Started →' : 'Next'}
              </Text>
              {currentStep < steps.length - 1 && <ArrowRight size={14} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
