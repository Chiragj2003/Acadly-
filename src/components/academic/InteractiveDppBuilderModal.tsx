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
  ActivityIndicator,
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
  ShieldCheck,
  Bot,
} from 'lucide-react-native';
import { Badge } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useGenerateQuizDraft, useTeacherAiQuota } from '@/hooks/queries/useAiQueries';

export type QuestionType = 'mcq' | 'true_false' | 'short_answer';

export interface InteractiveQuestion {
  id: string;
  type: QuestionType;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  expectedAnswerText?: string;
  marks: number;
  [key: string]: unknown;
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
  batchId?: string;
  defaultBatchName?: string;
  defaultSubject?: string;
}

export const InteractiveDppBuilderModal: React.FC<InteractiveDppBuilderModalProps> = ({
  visible,
  onClose,
  onPublish,
  batchId,
  defaultBatchName = 'Class 12 • JEE Advanced (Morning)',
  defaultSubject = 'Physics',
}) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(defaultSubject);
  const [dueDays, setDueDays] = useState('2');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gemini AI Draft Generator State
  const { user } = useAuth();
  const { data: aiQuota } = useTeacherAiQuota(user?.id);
  const generateQuizMutation = useGenerateQuizDraft();
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [aiNotes, setAiNotes] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState('5');

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

  const handleGenerateAiQuiz = async () => {
    if (!aiNotes.trim() && !aiTopic.trim()) {
      Alert.alert('Missing Input', 'Please paste lecture notes or enter a topic for Gemini.');
      return;
    }

    try {
      const parsedCount = Math.min(Math.max(1, parseInt(aiCount, 10) || 5), 15);
      const res = await generateQuizMutation.mutateAsync({
        notesText: aiNotes.trim() || `Core principles and numericals of ${aiTopic}`,
        topic: aiTopic.trim() || subject,
        count: parsedCount,
        batchId,
      });

      if (res.questions && res.questions.length > 0) {
        setQuestions(res.questions);
        if (!title.trim() && aiTopic.trim()) {
          setTitle(`${aiTopic} - Conceptual Practice DPP`);
        }
        setIsAiPanelOpen(false);
        Alert.alert(
          'Draft Questions Generated! 🤖',
          `Gemini generated ${res.questions.length} draft MCQs. You can now review, tweak the options/correct keys, and add or delete questions before publishing.`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate quiz draft';
      Alert.alert('AI Quiz Generation Error', msg);
    }
  };

  const handleConfirmPublish = async () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a title for the interactive DPP.');
      return;
    }

    if (!questions || questions.length === 0) {
      Alert.alert('Validation Error', 'A quiz must contain at least 1 question.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        Alert.alert('Incomplete Question', `Please fill in Question #${i + 1} text before publishing.`);
        return;
      }

      if (!q.marks || Number(q.marks) <= 0) {
        Alert.alert('Invalid Marks', `Question #${i + 1} must have marks greater than 0.`);
        return;
      }

      if (q.type === 'mcq') {
        if (!q.options || q.options.length < 2) {
          Alert.alert('Invalid MCQ', `Question #${i + 1} must have at least 2 options.`);
          return;
        }
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].trim()) {
            Alert.alert('Incomplete Option', `Option ${String.fromCharCode(65 + j)} for Question #${i + 1} cannot be blank.`);
            return;
          }
        }
        if (q.correctOptionIndex < 0 || q.correctOptionIndex >= q.options.length) {
          Alert.alert('Invalid Correct Option', `Please select a valid correct option for Question #${i + 1}.`);
          return;
        }
      } else if (q.type === 'true_false') {
        if (!q.options || q.options.length !== 2) {
          Alert.alert('Invalid True/False', `Question #${i + 1} must have exactly 2 options (True and False).`);
          return;
        }
        if (q.correctOptionIndex !== 0 && q.correctOptionIndex !== 1) {
          Alert.alert('Invalid Correct Option', `Please select True or False for Question #${i + 1}.`);
          return;
        }
      }
    }

    if (totalCalculatedMarks <= 0) {
      Alert.alert('Invalid Marks', 'Total quiz marks must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onPublish({
        title: title.trim(),
        subject,
        batchId: batchId || 'b0000000-0000-0000-0000-000000000001',
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
              <Text className="text-sm font-sans-bold text-white" numberOfLines={1}>
                In-App Form & DPP Builder
              </Text>
              <Text className="text-[11px] text-slate-300 font-sans" numberOfLines={1}>
                Create Interactive MCQ, True/False & Numerical Forms
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center active:scale-95"
          >
            <X size={16} color="#8C877E" />
          </TouchableOpacity>
        </View>

        {/* Scrollable Form Body */}
        <ScrollView
          className="flex-1 bg-[#F3F1EC]"
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Metadata Card */}
          <View className="bg-white border border-slate-200/90 rounded-2xl p-4 gap-3 shadow-xs mb-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-sans-bold text-slate-600 uppercase tracking-wider">
                1. Assignment Settings
              </Text>
              <Badge label={`${totalCalculatedMarks} Total Marks`} variant="primary" />
            </View>

            <View>
              <Text className="text-xs font-sans-bold text-slate-800 mb-1">Assignment Title</Text>
              <TextInput
                placeholder="e.g. Unit Test #05: Rotational Mechanics"
                placeholderTextColor="#8C877E"
                value={title}
                onChangeText={setTitle}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-sans-semibold"
              />
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="text-xs font-sans-bold text-slate-800 mb-1">Subject</Text>
                <TextInput
                  value={subject}
                  onChangeText={setSubject}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-sans-semibold"
                />
              </View>

              <View className="flex-1">
                <Text className="text-xs font-sans-bold text-slate-800 mb-1">Due in (Days)</Text>
                <TextInput
                  keyboardType="numeric"
                  value={dueDays}
                  onChangeText={setDueDays}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-sans-semibold"
                />
              </View>
            </View>

            <View className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/70 flex-row items-center gap-2">
              <Clock size={13} color="#1C1C1E" />
              <Text className="text-[11px] text-blue-800 font-sans flex-1">
                Target Batch: <Text className="font-sans-bold">{defaultBatchName}</Text>
              </Text>
            </View>
          </View>

          {/* AI Quiz Draft Generator Card */}
          <View className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 gap-3 shadow-xs mb-4">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setIsAiPanelOpen(!isAiPanelOpen)}
              className="flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-2">
                <View className="w-7 h-7 rounded-lg bg-indigo-600 items-center justify-center">
                  <Bot size={15} color="#FFFFFF" />
                </View>
                <View>
                  <Text className="text-xs font-display text-indigo-950">
                    Generate Quiz Draft with Gemini AI
                  </Text>
                  <Text className="text-[10px] text-indigo-700 font-sans">
                    Upload or paste lecture notes to auto-generate draft MCQs
                  </Text>
                </View>
              </View>
              <ChevronDown
                size={16}
                color="#4338CA"
                style={{ transform: [{ rotate: isAiPanelOpen ? '180deg' : '0deg' }] }}
              />
            </TouchableOpacity>

            {isAiPanelOpen && (
              <View className="gap-2.5 pt-2 border-t border-indigo-200/70">
                <View>
                  <Text className="text-[11px] font-sans-bold text-indigo-900 mb-1">
                    Topic / Concept Focus
                  </Text>
                  <TextInput
                    placeholder="e.g. Gauss's Law, Electric Dipoles & Flux"
                    placeholderTextColor="#818CF8"
                    value={aiTopic}
                    onChangeText={setAiTopic}
                    className="bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-sans"
                  />
                </View>

                <View>
                  <Text className="text-[11px] font-sans-bold text-indigo-900 mb-1">
                    Lecture Notes / Syllabus Excerpt
                  </Text>
                  <TextInput
                    placeholder="Paste notes, textbook definitions, formula rules, or key concepts here..."
                    placeholderTextColor="#818CF8"
                    value={aiNotes}
                    onChangeText={setAiNotes}
                    multiline
                    numberOfLines={4}
                    className="bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-sans"
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-[11px] font-sans-bold text-indigo-900">Questions:</Text>
                    {['3', '5', '8', '10'].map((cnt) => (
                      <TouchableOpacity
                        key={cnt}
                        onPress={() => setAiCount(cnt)}
                        className={`px-2.5 py-1 rounded-lg border ${
                          aiCount === cnt
                            ? 'bg-indigo-600 border-indigo-600'
                            : 'bg-white border-indigo-200'
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-sans-bold ${
                            aiCount === cnt ? 'text-white' : 'text-indigo-800'
                          }`}
                        >
                          {cnt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View className="flex-row items-center gap-1">
                    <Sparkles size={11} color="#6366F1" />
                    <Text className="text-[10px] text-indigo-800 font-sans-semibold">
                      Quota: {aiQuota?.remaining ?? 25}/25 left
                    </Text>
                  </View>
                </View>

                {/* Privacy Disclosure Banner */}
                <View className="bg-indigo-100/60 p-2 rounded-xl flex-row items-center gap-1.5">
                  <ShieldCheck size={13} color="#4338CA" />
                  <Text className="text-[10px] text-indigo-900 font-sans flex-1">
                    Privacy Guaranteed: Gemini processes only academic notes. Zero student PII is transmitted.
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={generateQuizMutation.isPending}
                  onPress={handleGenerateAiQuiz}
                  className={`py-2.5 rounded-xl bg-indigo-600 flex-row items-center justify-center gap-1.5 active:scale-98 ${
                    generateQuizMutation.isPending ? 'opacity-60' : ''
                  }`}
                >
                  {generateQuizMutation.isPending ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Sparkles size={13} color="#FFFFFF" />
                      <Text className="text-xs font-sans-bold text-white">
                        Generate Draft Questions ({aiCount} MCQs)
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Questions Section */}
          <View className="flex-row items-center justify-between mb-2.5 px-1">
            <Text className="text-xs font-sans-bold text-slate-600 uppercase tracking-wider">
              2. Questions ({questions.length})
            </Text>
            <Text className="text-[11px] text-slate-500 font-sans">
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
                      <Text className="text-xs font-display text-blue-700">{qIndex + 1}</Text>
                    </View>
                    <View className="bg-slate-100 px-2 py-0.5 rounded-md">
                      <Text className="text-[10px] font-sans-bold text-slate-700 uppercase">
                        {q.type.replace('_', ' ')}
                      </Text>
                    </View>
                    <Text className="text-[11px] font-sans-bold text-slate-500">
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
                  placeholderTextColor="#8C877E"
                  multiline
                  value={q.questionText}
                  onChangeText={(txt) => handleUpdateQuestionText(q.id, txt)}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-sans min-h-[56px]"
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
                              className="flex-1 text-xs text-slate-800 font-sans py-1"
                            />
                          ) : (
                            <Text className="flex-1 text-xs font-sans-bold text-slate-800">
                              {opt}
                            </Text>
                          )}

                          {isCorrect && (
                            <Text className="text-[10px] font-sans-bold text-emerald-700">
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
                    <Text className="text-[10px] font-sans-bold text-slate-500 uppercase">
                      Expected Answer Key / Value
                    </Text>
                    <TextInput
                      placeholder="e.g. 9.8 m/s² or Derivation proof"
                      placeholderTextColor="#8C877E"
                      value={q.expectedAnswerText}
                      onChangeText={(txt) => {
                        setQuestions(
                          questions.map((item) =>
                            item.id === q.id ? { ...item, expectedAnswerText: txt } : item
                          )
                        );
                      }}
                      className="text-xs text-slate-800 font-sans-semibold"
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
              <Plus size={13} color="#1C1C1E" />
              <Text className="text-xs font-sans-bold text-blue-600">+ MCQ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleAddQuestion('true_false')}
              className="flex-1 bg-white border border-slate-200 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5 active:scale-95 shadow-xs"
            >
              <Plus size={13} color="#059669" />
              <Text className="text-xs font-sans-bold text-emerald-600">+ True / False</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleAddQuestion('short_answer')}
              className="flex-1 bg-white border border-slate-200 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5 active:scale-95 shadow-xs"
            >
              <Plus size={13} color="#7C3AED" />
              <Text className="text-xs font-sans-bold text-purple-600">+ Numerical</Text>
            </TouchableOpacity>
          </View>

          {/* Confirm Publish Button */}
          <TouchableOpacity
            activeOpacity={0.88}
            disabled={isSubmitting}
            onPress={handleConfirmPublish}
            className="mt-6 bg-blue-600 py-3.5 rounded-2xl items-center shadow-xs active:scale-98"
          >
            <Text className="text-xs font-display text-white tracking-wide">
              {isSubmitting ? 'Publishing Form...' : `Publish DPP Form (${questions.length} Questions) →`}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};
