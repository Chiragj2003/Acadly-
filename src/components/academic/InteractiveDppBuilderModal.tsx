import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Clock,
  Award,
  Sparkles,
  FileQuestion,
  ChevronDown,
} from 'lucide-react-native';
import { Badge } from '@/components/ui';

export type QuestionType = 'mcq' | 'true_false' | 'short_answer';

export interface InteractiveQuestion {
  id: string;
  type: QuestionType;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  expectedAnswerText?: string;
  marks: number;
}

interface InteractiveDppBuilderModalProps {
  visible: boolean;
  onClose: () => void;
  onPublish: (dppData: {
    title: string;
    subject: string;
    batchId: string;
    totalMarks: number;
    questions: InteractiveQuestion[];
  }) => Promise<void>;
  defaultBatchName?: string;
  defaultSubject?: string;
}

export const InteractiveDppBuilderModal: React.FC<InteractiveDppBuilderModalProps> = ({
  visible,
  onClose,
  onPublish,
  defaultBatchName = 'Class 12 • JEE Advanced (Morning)',
  defaultSubject = 'Physics',
}) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(defaultSubject);
  const [dueDays, setDueDays] = useState('2');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Questions array
  const [questions, setQuestions] = useState<InteractiveQuestion[]>([
    {
      id: 'q-1',
      type: 'mcq',
      questionText: 'What is the moment of inertia of a uniform solid sphere of mass M and radius R about its diameter?',
      options: ['(2/5) M R²', '(2/3) M R²', '(1/2) M R²', '(7/5) M R²'],
      correctOptionIndex: 0,
      marks: 4,
    },
    {
      id: 'q-2',
      type: 'true_false',
      questionText: 'The angular momentum of a system of particles about a point is conserved if net external torque is zero.',
      options: ['True', 'False'],
      correctOptionIndex: 0,
      marks: 2,
    },
  ]);

  const handleAddQuestion = (type: QuestionType) => {
    const newId = `q-${Date.now()}`;
    if (type === 'mcq') {
      setQuestions([
        ...questions,
        {
          id: newId,
          type: 'mcq',
          questionText: '',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctOptionIndex: 0,
          marks: 4,
        },
      ]);
    } else if (type === 'true_false') {
      setQuestions([
        ...questions,
        {
          id: newId,
          type: 'true_false',
          questionText: '',
          options: ['True', 'False'],
          correctOptionIndex: 0,
          marks: 2,
        },
      ]);
    } else {
      setQuestions([
        ...questions,
        {
          id: newId,
          type: 'short_answer',
          questionText: '',
          options: [],
          correctOptionIndex: 0,
          expectedAnswerText: '',
          marks: 5,
        },
      ]);
    }
  };

  const handleRemoveQuestion = (id: string) => {
    if (questions.length <= 1) {
      Alert.alert('Notice', 'A DPP must contain at least one question.');
      return;
    }
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleUpdateQuestionText = (id: string, text: string) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, questionText: text } : q)));
  };

  const handleUpdateOption = (qId: string, optIndex: number, text: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id !== qId) return q;
        const nextOpts = [...q.options];
        nextOpts[optIndex] = text;
        return { ...q, options: nextOpts };
      })
    );
  };

  const handleSelectCorrectOption = (qId: string, optIndex: number) => {
    setQuestions(
      questions.map((q) => (q.id === qId ? { ...q, correctOptionIndex: optIndex } : q))
    );
  };

  const totalCalculatedMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

  const handleConfirmPublish = async () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a title for the interactive DPP.');
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].questionText.trim()) {
        Alert.alert('Incomplete Question', `Please fill in Question #${i + 1} text before publishing.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onPublish({
        title: title.trim(),
        subject,
        batchId: 'batch-01',
        totalMarks: totalCalculatedMarks,
        questions,
      });
      setTitle('');
      onClose();
    } catch {
      Alert.alert('Error', 'Could not publish interactive DPP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-slate-900"
      >
        {/* Header Bar */}
        <View className="bg-slate-900 border-b border-slate-800 px-4 py-3.5 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5 flex-1 min-w-0 mr-2">
            <View className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 items-center justify-center shrink-0">
              <FileQuestion size={16} color="#60A5FA" />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-sm font-bold text-white" numberOfLines={1}>
                In-App Form & DPP Builder
              </Text>
              <Text className="text-[11px] text-slate-300 font-medium" numberOfLines={1}>
                Create Interactive MCQ, True/False & Numerical Forms
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center active:scale-95"
          >
            <X size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Scrollable Form Body */}
        <ScrollView
          className="flex-1 bg-[#F8FAFC]"
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Metadata Card */}
          <View className="bg-white border border-slate-200/90 rounded-2xl p-4 gap-3 shadow-xs mb-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                1. Assignment Settings
              </Text>
              <Badge label={`${totalCalculatedMarks} Total Marks`} variant="primary" />
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-800 mb-1">Assignment Title</Text>
              <TextInput
                placeholder="e.g. Unit Test #05: Rotational Mechanics"
                placeholderTextColor="#94a3b8"
                value={title}
                onChangeText={setTitle}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold"
              />
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-800 mb-1">Subject</Text>
                <TextInput
                  value={subject}
                  onChangeText={setSubject}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-semibold"
                />
              </View>

              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-800 mb-1">Due in (Days)</Text>
                <TextInput
                  keyboardType="numeric"
                  value={dueDays}
                  onChangeText={setDueDays}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-semibold"
                />
              </View>
            </View>

            <View className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/70 flex-row items-center gap-2">
              <Clock size={13} color="#2563EB" />
              <Text className="text-[11px] text-blue-800 font-medium flex-1">
                Target Batch: <Text className="font-bold">{defaultBatchName}</Text>
              </Text>
            </View>
          </View>

          {/* Questions Section */}
          <View className="flex-row items-center justify-between mb-2.5 px-1">
            <Text className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              2. Questions ({questions.length})
            </Text>
            <Text className="text-[11px] text-slate-500 font-medium">
              Tap radio button to select correct answer
            </Text>
          </View>

          <View className="gap-3">
            {questions.map((q, qIndex) => (
              <View
                key={q.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 gap-3 shadow-xs"
              >
                {/* Question Header */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View className="w-6 h-6 rounded-lg bg-blue-100 items-center justify-center">
                      <Text className="text-xs font-black text-blue-700">{qIndex + 1}</Text>
                    </View>
                    <View className="bg-slate-100 px-2 py-0.5 rounded-md">
                      <Text className="text-[10px] font-bold text-slate-700 uppercase">
                        {q.type.replace('_', ' ')}
                      </Text>
                    </View>
                    <Text className="text-[11px] font-bold text-slate-500">
                      ({q.marks} Marks)
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleRemoveQuestion(q.id)}
                    className="p-1 rounded-lg active:scale-95"
                  >
                    <Trash2 size={14} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                {/* Question Statement */}
                <TextInput
                  placeholder="Enter problem statement or question..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  value={q.questionText}
                  onChangeText={(txt) => handleUpdateQuestionText(q.id, txt)}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-medium min-h-[56px]"
                />

                {/* Options List (for MCQ / True-False) */}
                {(q.type === 'mcq' || q.type === 'true_false') && (
                  <View className="gap-2">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = q.correctOptionIndex === optIdx;
                      return (
                        <View
                          key={optIdx}
                          className={`flex-row items-center gap-2 p-2 rounded-xl border ${
                            isCorrect
                              ? 'bg-emerald-50/70 border-emerald-300'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <TouchableOpacity
                            onPress={() => handleSelectCorrectOption(q.id, optIdx)}
                            className={`w-5 h-5 rounded-full border items-center justify-center ${
                              isCorrect
                                ? 'bg-emerald-600 border-emerald-600'
                                : 'bg-white border-slate-300'
                            }`}
                          >
                            {isCorrect && <CheckCircle2 size={13} color="#FFFFFF" />}
                          </TouchableOpacity>

                          {q.type === 'mcq' ? (
                            <TextInput
                              value={opt}
                              onChangeText={(val) => handleUpdateOption(q.id, optIdx, val)}
                              className="flex-1 text-xs text-slate-800 font-medium py-1"
                            />
                          ) : (
                            <Text className="flex-1 text-xs font-bold text-slate-800">
                              {opt}
                            </Text>
                          )}

                          {isCorrect && (
                            <Text className="text-[10px] font-bold text-emerald-700">
                              Correct Key
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Short Answer / Numerical */}
                {q.type === 'short_answer' && (
                  <View className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl gap-1">
                    <Text className="text-[10px] font-bold text-slate-500 uppercase">
                      Expected Answer Key / Value
                    </Text>
                    <TextInput
                      placeholder="e.g. 9.8 m/s² or Derivation proof"
                      placeholderTextColor="#94a3b8"
                      value={q.expectedAnswerText}
                      onChangeText={(txt) => {
                        setQuestions(
                          questions.map((item) =>
                            item.id === q.id ? { ...item, expectedAnswerText: txt } : item
                          )
                        );
                      }}
                      className="text-xs text-slate-800 font-semibold"
                    />
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Add Question Buttons */}
          <View className="flex-row gap-2 mt-4">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleAddQuestion('mcq')}
              className="flex-1 bg-white border border-slate-200 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5 active:scale-95 shadow-xs"
            >
              <Plus size={13} color="#2563EB" />
              <Text className="text-xs font-bold text-blue-600">+ MCQ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleAddQuestion('true_false')}
              className="flex-1 bg-white border border-slate-200 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5 active:scale-95 shadow-xs"
            >
              <Plus size={13} color="#059669" />
              <Text className="text-xs font-bold text-emerald-600">+ True / False</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleAddQuestion('short_answer')}
              className="flex-1 bg-white border border-slate-200 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5 active:scale-95 shadow-xs"
            >
              <Plus size={13} color="#7C3AED" />
              <Text className="text-xs font-bold text-purple-600">+ Numerical</Text>
            </TouchableOpacity>
          </View>

          {/* Confirm Publish Button */}
          <TouchableOpacity
            activeOpacity={0.88}
            disabled={isSubmitting}
            onPress={handleConfirmPublish}
            className="mt-6 bg-blue-600 py-3.5 rounded-2xl items-center shadow-xs active:scale-98"
          >
            <Text className="text-xs font-extrabold text-white tracking-wide">
              {isSubmitting ? 'Publishing Form...' : `Publish DPP Form (${questions.length} Questions) →`}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};
