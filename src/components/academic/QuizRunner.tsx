import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  X,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  Award,
  Sparkles,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react-native';
import { Badge, Button } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import {
  getAssignmentForTaking,
  getStudentSubmission,
  submitQuiz,
  type QuizSubmissionResult,
} from '@/services/submissionService';
import { type Assignment } from '@/types/database';

interface QuizQuestion {
  id: string;
  question?: string;
  questionText?: string;
  title?: string;
  type?: 'mcq' | 'text' | 'boolean' | 'true_false' | string;
  options?: string[];
  points?: number;
  marks?: number;
}

interface QuizRunnerProps {
  assignment: Assignment | null;
  visible: boolean;
  onClose: () => void;
  onCompleted?: (result: QuizSubmissionResult) => void;
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({
  assignment,
  visible,
  onClose,
  onCompleted,
}) => {
  const { user, activeInstitute } = useAuth();

  const [loading, setLoading] = useState(true);
  const [sanitizedAssignment, setSanitizedAssignment] = useState<Assignment | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QuizSubmissionResult | null>(null);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  // Load sanitized assignment and check previous submissions
  useEffect(() => {
    if (!visible || !assignment || !user) return;

    let timer: ReturnType<typeof setInterval> | null = null;
    let isMounted = true;

    const init = async () => {
      setLoading(true);
      setCurrentIndex(0);
      setAnswers({});
      setResult(null);
      setElapsedSeconds(0);
      setAlreadyCompleted(false);

      try {
        // Check existing submission
        const existing = await getStudentSubmission(assignment.id, user.id);
        if (existing && existing.status === 'graded') {
          setAlreadyCompleted(true);
          // If already completed, set past score
          setResult({
            submissionId: existing.id,
            totalScore: Number(existing.score) || 0,
            totalMarks: Number(assignment.total_marks) || 100,
            percentage: Math.round(
              ((Number(existing.score) || 0) / (Number(assignment.total_marks) || 100)) * 100
            ),
            isPassed: (Number(existing.score) || 0) >= (Number(assignment.total_marks) || 100) * 0.4,
            status: 'graded',
            questions: [],
          });
          setLoading(false);
          return;
        }

        // Fetch sanitized questions
        const secureAsg = await getAssignmentForTaking(assignment.id);
        if (isMounted) {
          setSanitizedAssignment((secureAsg as unknown as Assignment) || assignment);
        }
      } catch (err) {
        console.warn('Could not load secure quiz:', err);
        if (isMounted) setSanitizedAssignment(assignment);
      } finally {
        if (isMounted) setLoading(false);
      }

      // Start elapsed timer (only in non-test runtime)
      if (process.env.NODE_ENV !== 'test') {
        timer = setInterval(() => {
          setElapsedSeconds((prev) => prev + 1);
        }, 1000);
      }
    };

    init();

    return () => {
      isMounted = false;
      if (timer) clearInterval(timer);
    };
  }, [visible, assignment, user]);

  if (!visible || !assignment) return null;

  const rawQuestions: QuizQuestion[] = Array.isArray(sanitizedAssignment?.questions)
    ? (sanitizedAssignment.questions as unknown as QuizQuestion[])
    : Array.isArray(assignment?.questions)
    ? (assignment.questions as unknown as QuizQuestion[])
    : [];

  const currentQ = rawQuestions[currentIndex];
  const totalQuestions = rawQuestions.length;
  const progressPercent = totalQuestions > 0 ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 0;
  const answeredCount = Object.keys(answers).length;

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleConfirmSubmit = () => {
    const unattempted = totalQuestions - answeredCount;
    if (unattempted > 0) {
      Alert.alert(
        'Incomplete Quiz',
        `You have ${unattempted} unanswered question${unattempted > 1 ? 's' : ''}. Do you still want to finish and submit?`,
        [
          { text: 'Keep Answering', style: 'cancel' },
          { text: 'Submit Anyway', style: 'destructive', onPress: executeSubmission },
        ]
      );
    } else {
      Alert.alert(
        'Submit Quiz',
        'Are you ready to submit your answers? You cannot re-attempt once submitted.',
        [
          { text: 'Review', style: 'cancel' },
          { text: 'Submit Now', style: 'default', onPress: executeSubmission },
        ]
      );
    }
  };

  const executeSubmission = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const gradedResult = await submitQuiz({
        assignmentId: assignment.id,
        studentId: user.id,
        instituteId: activeInstitute?.id,
        answers,
      });

      setResult(gradedResult);
      if (onCompleted) {
        onCompleted(gradedResult);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit quiz';
      Alert.alert('Submission Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-slate-900"
      >
        {/* Top Header */}
        <View className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2 flex-1 mr-2">
            <View className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 items-center justify-center">
              <Sparkles size={16} color="#A855F7" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-extrabold text-white" numberOfLines={1}>
                {assignment.title}
              </Text>
              <Text className="text-[11px] text-slate-400">
                {assignment.subject || 'Academic Quiz'} • {totalQuestions} Questions
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            {!result && (
              <View className="flex-row items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
                <Clock size={12} color="#94A3B8" />
                <Text className="text-xs font-mono font-bold text-slate-300">
                  {formatTimer(elapsedSeconds)}
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center border border-slate-700"
            >
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center p-6">
            <ActivityIndicator size="large" color="#A855F7" />
            <Text className="text-xs text-slate-400 mt-3 font-medium">Preparing quiz questions...</Text>
          </View>
        ) : result ? (
          /* ================= RESULT SCREEN ================= */
          <ScrollView className="flex-1 px-4 py-6" contentContainerStyle={{ paddingBottom: 60 }}>
            {/* Score Banner */}
            <View className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 items-center gap-3">
              <View className="w-16 h-16 rounded-full bg-purple-500/20 border-2 border-purple-400 items-center justify-center">
                <Award size={32} color="#C084FC" />
              </View>

              <View className="items-center">
                <Badge
                  label={result.isPassed ? 'QUIZ COMPLETED • PASSED' : 'QUIZ COMPLETED • REVISION NEEDED'}
                  variant={result.isPassed ? 'success' : 'warning'}
                />
                <Text className="text-3xl font-black text-white mt-2">
                  {result.totalScore} / {result.totalMarks}
                </Text>
                <Text className="text-xs text-slate-400 mt-0.5">
                  Accuracy Score: <Text className="font-bold text-purple-400">{result.percentage}%</Text> • Time: {formatTimer(elapsedSeconds)}
                </Text>
              </View>

              {alreadyCompleted && (
                <Text className="text-[11px] text-amber-400 font-semibold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                  You already submitted this quiz previously.
                </Text>
              )}
            </View>

            {/* Questions Detailed Breakdown */}
            {result.questions && result.questions.length > 0 && (
              <View className="mt-6 gap-3">
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Question Breakdown & Explanations
                </Text>

                {result.questions.map((rq, idx) => {
                  const isCorrect = rq.isCorrect === true;
                  const isSubjective = rq.type === 'short_answer';

                  return (
                    <View
                      key={rq.id || idx}
                      className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 gap-2.5"
                    >
                      <View className="flex-row items-start justify-between gap-2">
                        <Text className="text-xs font-bold text-purple-400">
                          Question #{idx + 1} ({rq.maxMarks} Marks)
                        </Text>
                        {isSubjective ? (
                          <Badge label="Pending Review" variant="warning" size="sm" />
                        ) : isCorrect ? (
                          <Badge label={`+${rq.marksObtained} Correct`} variant="success" size="sm" />
                        ) : (
                          <Badge label="Incorrect" variant="error" size="sm" />
                        )}
                      </View>

                      <Text className="text-sm font-bold text-white leading-relaxed">
                        {rq.questionText}
                      </Text>

                      {rq.options && rq.options.length > 0 && (
                        <View className="gap-1.5 mt-1">
                          {rq.options.map((opt: string, optIdx: number) => {
                            const isStudentChoice = rq.studentAnswer === optIdx;
                            const isCorrectChoice = rq.correctOptionIndex === optIdx;

                            let optBg = 'bg-slate-900/60 border-slate-700/60';
                            let optTextColor = 'text-slate-300';

                            if (isCorrectChoice) {
                              optBg = 'bg-emerald-950/60 border-emerald-500/60';
                              optTextColor = 'text-emerald-300 font-bold';
                            } else if (isStudentChoice && !isCorrect) {
                              optBg = 'bg-rose-950/60 border-rose-500/60';
                              optTextColor = 'text-rose-300 font-bold';
                            }

                            return (
                              <View
                                key={optIdx}
                                className={`px-3 py-2 rounded-xl border flex-row items-center justify-between ${optBg}`}
                              >
                                <Text className={`text-xs ${optTextColor}`}>
                                  {String.fromCharCode(65 + optIdx)}. {opt}
                                </Text>
                                {isCorrectChoice && <CheckCircle2 size={14} color="#34D399" />}
                                {isStudentChoice && !isCorrectChoice && <XCircle size={14} color="#F87171" />}
                              </View>
                            );
                          })}
                        </View>
                      )}

                      {rq.explanation ? (
                        <View className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 mt-1">
                          <Text className="text-[11px] text-slate-400">
                            <Text className="font-bold text-purple-300">Explanation: </Text>
                            {rq.explanation}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}

            <View className="mt-6">
              <Button
                variant="primary"
                title="Return to Study Vault"
                fullWidth
                onPress={onClose}
              />
            </View>
          </ScrollView>
        ) : (
          /* ================= RUNNER SCREEN ================= */
          <View className="flex-1">
            {/* Progress Bar */}
            <View className="bg-slate-800/80 px-4 py-2.5 flex-row items-center justify-between border-b border-slate-800">
              <Text className="text-xs font-bold text-slate-300">
                Question {currentIndex + 1} of {totalQuestions}
              </Text>
              <Text className="text-xs font-semibold text-purple-400">
                {answeredCount}/{totalQuestions} Answered
              </Text>
            </View>
            <View className="w-full h-1 bg-slate-800">
              <View
                className="h-full bg-purple-500"
                style={{ width: `${progressPercent}%` }}
              />
            </View>

            {/* Question Body */}
            <ScrollView
              className="flex-1 px-4 py-5"
              contentContainerStyle={{ paddingBottom: 80 }}
            >
              {currentQ ? (
                <View className="gap-4">
                  {/* Question Meta */}
                  <View className="flex-row items-center justify-between">
                    <Badge
                      label={
                        currentQ.type === 'mcq'
                          ? 'MULTIPLE CHOICE'
                          : currentQ.type === 'true_false'
                          ? 'TRUE / FALSE'
                          : 'SHORT ANSWER'
                      }
                      variant="pro"
                    />
                    <Text className="text-xs font-extrabold text-slate-400">
                      {String(currentQ.marks || 1)} Marks
                    </Text>
                  </View>

                  {/* Question Prompt */}
                  <Text className="text-base font-extrabold text-white leading-relaxed">
                    {String(currentQ.questionText || currentQ.question || '')}
                  </Text>

                  {/* Options List */}
                  {currentQ.type === 'mcq' || currentQ.type === 'true_false' ? (
                    <View className="gap-2.5 mt-2">
                      {currentQ.options?.map((optionText: string, optIndex: number) => {
                        const questionId = currentQ.id || `q-${currentIndex}`;
                        const isSelected = answers[questionId] === optIndex;
                        return (
                          <TouchableOpacity
                            key={optIndex}
                            activeOpacity={0.8}
                            onPress={() => handleSelectOption(questionId, optIndex)}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: isSelected }}
                            className={`p-3.5 rounded-2xl border flex-row items-center justify-between ${
                              isSelected
                                ? 'bg-purple-950/70 border-purple-500 shadow-xs'
                                : 'bg-slate-800/60 border-slate-700/80 active:bg-slate-800'
                            }`}
                          >
                            <View className="flex-row items-center gap-3 flex-1 mr-2">
                              <View
                                className={`w-7 h-7 rounded-xl items-center justify-center border font-bold text-xs ${
                                  isSelected
                                    ? 'bg-purple-600 border-purple-400 text-white'
                                    : 'bg-slate-800 border-slate-700 text-slate-400'
                                }`}
                              >
                                <Text
                                  className={`text-xs font-black ${
                                    isSelected ? 'text-white' : 'text-slate-400'
                                  }`}
                                >
                                  {String.fromCharCode(65 + optIndex)}
                                </Text>
                              </View>
                              <Text
                                className={`text-sm font-semibold flex-1 ${
                                  isSelected ? 'text-white' : 'text-slate-200'
                                }`}
                              >
                                {optionText}
                              </Text>
                            </View>

                            <View
                              className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                                isSelected
                                  ? 'border-purple-400 bg-purple-600'
                                  : 'border-slate-600 bg-transparent'
                              }`}
                            >
                              {isSelected && <View className="w-2 h-2 rounded-full bg-white" />}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              ) : (
                <View className="items-center justify-center p-8">
                  <Text className="text-xs text-slate-400">No question data available.</Text>
                </View>
              )}
            </ScrollView>

            {/* Bottom Navigation Dock */}
            <View className="bg-slate-900 border-t border-slate-800 px-4 py-3 flex-row items-center justify-between">
              <TouchableOpacity
                onPress={handlePrev}
                disabled={currentIndex === 0}
                className={`flex-row items-center gap-1 px-4 py-2.5 rounded-xl border ${
                  currentIndex === 0
                    ? 'border-slate-800 opacity-40'
                    : 'border-slate-700 bg-slate-800 active:bg-slate-700'
                }`}
              >
                <ChevronLeft size={16} color="#E2E8F0" />
                <Text className="text-xs font-bold text-slate-200">Previous</Text>
              </TouchableOpacity>

              {currentIndex === totalQuestions - 1 ? (
                <Button
                  variant="primary"
                  title="Submit Quiz"
                  loading={isSubmitting}
                  onPress={handleConfirmSubmit}
                />
              ) : (
                <TouchableOpacity
                  onPress={handleNext}
                  className="flex-row items-center gap-1 px-4 py-2.5 rounded-xl bg-purple-600 active:bg-purple-700"
                >
                  <Text className="text-xs font-bold text-white">Next</Text>
                  <ChevronRight size={16} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};
