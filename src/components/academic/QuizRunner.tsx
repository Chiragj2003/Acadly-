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
import { Button, ListEmptyState, ListErrorState, Mascot } from '@/components/ui';
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
  /** students.id of the person taking the quiz (not the auth user id). */
  studentId?: string;
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({
  assignment,
  visible,
  onClose,
  onCompleted,
  studentId,
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
  const [loadError, setLoadError] = useState<string | null>(null);

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
      setLoadError(null);

      try {
        // Check existing submission
        // Look up by students.id (the auth user id never matched, so past attempts were missed).
        const existing = studentId ? await getStudentSubmission(assignment.id, studentId) : null;
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
        // Never fall back to the raw assignment: it can include the answer key.
        console.warn('Could not load secure quiz:', err);
        if (isMounted) setLoadError('Check your connection and open the quiz again.');
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
  }, [visible, assignment, user, studentId]);

  if (!visible || !assignment) return null;

  // Only ever render the server-sanitized questions (no answer key on the client).
  const rawQuestions: QuizQuestion[] = Array.isArray(sanitizedAssignment?.questions)
    ? (sanitizedAssignment.questions as unknown as QuizQuestion[])
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
    if (!studentId) {
      Alert.alert('Not enrolled', 'Join your batch before taking quizzes.');
      return;
    }
    setIsSubmitting(true);

    try {
      const gradedResult = await submitQuiz({
        assignmentId: assignment.id,
        // The RPC and the submissions insert policy both expect students.id;
        // sending the auth user id made every quiz submission fail.
        studentId,
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

  const questionId = currentQ ? currentQ.id || `q-${currentIndex}` : '';
  const isLast = currentIndex === totalQuestions - 1;
  // Short option texts sit in a 2×2 grid of chunky cards; longer ones stack.
  const optionsAreShort = (currentQ?.options ?? []).every((o) => String(o).length <= 14);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-paper">
        {/* Top bar: segmented progress + close */}
        <View className="px-5 pt-12 pb-2 flex-row items-center gap-3.5">
          {!result && !loading && totalQuestions > 0 ? (
            <View
              accessibilityRole="progressbar"
              accessibilityLabel={`Question ${currentIndex + 1} of ${totalQuestions}`}
              className="flex-1 flex-row gap-1"
            >
              {rawQuestions.map((q, i) => {
                const id = q.id || `q-${i}`;
                const color = i === currentIndex ? 'bg-ink' : answers[id] !== undefined ? 'bg-go' : 'bg-slate-300';
                return <View key={id} className={`flex-1 h-1.5 rounded-full ${color}`} />;
              })}
            </View>
          ) : (
            <View className="flex-1" />
          )}
          {!result && !loading ? (
            <Text className="font-sans-semibold text-muted text-xs">{formatTimer(elapsedSeconds)}</Text>
          ) : null}
          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close quiz"
            className="w-11 h-11 items-end justify-center"
          >
            <X size={24} color="#1C1C1E" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center p-6 gap-4">
            <Mascot mood="studying" size="lg" />
            <Text className="text-sm text-muted font-sans">Getting your questions ready…</Text>
          </View>
        ) : loadError ? (
          <View className="flex-1 justify-center px-5">
            <ListErrorState title="Couldn't open this quiz" message={loadError} />
          </View>
        ) : result ? (
          /* ================= RESULT ================= */
          <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48, gap: 18 }}>
            <View className="items-center gap-2 mt-2">
              <Text className="font-sans-semibold text-muted text-sm">
                {alreadyCompleted ? 'You already finished this quiz' : result.isPassed ? 'Nicely done' : 'Good effort'}
              </Text>
              <Mascot mood={result.isPassed ? 'celebrating' : 'curious'} size="xl" />
              <Text
                accessibilityLabel={`Score ${result.totalScore} out of ${result.totalMarks}`}
                className="font-serif text-ink"
                style={{ fontSize: 72, lineHeight: 80 }}
              >
                {result.totalScore}
                <Text style={{ fontSize: 28 }}>/{result.totalMarks}</Text>
              </Text>
              <Text className="font-sans text-slate-600 text-[15px]">
                {result.percentage}% · {formatTimer(elapsedSeconds)}
              </Text>
            </View>

            {result.questions?.map((rq, idx) => {
              const isCorrect = rq.isCorrect === true;
              const isSubjective = rq.type === 'short_answer';
              return (
                <View key={rq.id || idx} className="bg-white rounded-3xl p-4 gap-2.5">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className="font-sans-bold text-muted text-xs">
                      Question {idx + 1} · {rq.maxMarks} marks
                    </Text>
                    <View
                      className={`px-2.5 py-1 rounded-xl ${
                        isSubjective ? 'bg-pastel-butter' : isCorrect ? 'bg-pastel-mint' : 'bg-pastel-pink'
                      }`}
                    >
                      <Text className="font-sans-bold text-ink text-xs">
                        {isSubjective ? 'Teacher will review' : isCorrect ? `+${rq.marksObtained}` : 'Not quite'}
                      </Text>
                    </View>
                  </View>
                  <Text className="font-sans-bold text-ink text-[15px] leading-5">{rq.questionText}</Text>
                  {rq.options?.map((opt: string, optIdx: number) => {
                    const isStudentChoice = rq.studentAnswer === optIdx;
                    const isCorrectChoice = rq.correctOptionIndex === optIdx;
                    const tone = isCorrectChoice
                      ? 'bg-pastel-mint border-ink'
                      : isStudentChoice && !isCorrect
                        ? 'bg-pastel-pink border-ink'
                        : 'bg-paper border-transparent';
                    return (
                      <View key={optIdx} className={`px-3.5 min-h-[44px] rounded-2xl border-[1.5px] flex-row items-center justify-between ${tone}`}>
                        <Text className="font-sans text-ink text-sm flex-1">
                          {String.fromCharCode(65 + optIdx)}. {opt}
                        </Text>
                        {isCorrectChoice ? <CheckCircle2 size={16} color="#1C1C1E" /> : null}
                        {isStudentChoice && !isCorrectChoice ? <XCircle size={16} color="#1C1C1E" /> : null}
                      </View>
                    );
                  })}
                  {rq.explanation ? (
                    <View className="bg-paper rounded-2xl p-3">
                      <Text className="font-sans-bold text-muted text-xs mb-0.5">Why</Text>
                      <Text className="font-serif-medium text-ink text-base leading-6">{rq.explanation}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}

            <Button variant="primary" size="lg" title="Done" fullWidth onPress={onClose} />
          </ScrollView>
        ) : (
          /* ================= RUNNER ================= */
          <View className="flex-1">
            <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24 }}>
              {currentQ ? (
                <View className="gap-3">
                  <Text className="font-sans-semibold text-muted text-sm text-center">
                    {[assignment.subject, `question ${currentIndex + 1} of ${totalQuestions}`, `${currentQ.marks || 1} marks`]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                  <Text accessibilityRole="header" className="font-display text-ink text-[25px] leading-[31px] text-center">
                    {String(currentQ.questionText || currentQ.question || '')}
                  </Text>

                  {currentQ.type === 'mcq' || currentQ.type === 'true_false' ? (
                    <View accessibilityRole="radiogroup" className={`mt-5 gap-3 ${optionsAreShort ? 'flex-row flex-wrap' : ''}`}>
                      {currentQ.options?.map((optionText: string, optIndex: number) => {
                        const isSelected = answers[questionId] === optIndex;
                        return (
                          <TouchableOpacity
                            key={optIndex}
                            activeOpacity={0.85}
                            onPress={() => handleSelectOption(questionId, optIndex)}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: isSelected }}
                            style={
                              isSelected
                                ? { shadowColor: '#1C1C1E', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }
                                : undefined
                            }
                            className={`rounded-3xl border-[1.5px] ${
                              optionsAreShort ? 'basis-[47%] grow h-[104px] items-center justify-center' : 'min-h-[60px] px-4 py-3 flex-row items-center gap-3'
                            } ${isSelected ? 'bg-pastel-sky border-ink' : 'bg-white border-hairline'}`}
                          >
                            <Text className="font-sans-bold text-muted text-[13px]">{String.fromCharCode(65 + optIndex)}</Text>
                            <Text
                              className={`text-ink ${optionsAreShort ? 'font-serif text-[28px] text-center' : 'font-sans-semibold text-base flex-1'}`}
                            >
                              {optionText}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              ) : (
                <ListEmptyState title="No questions yet" message="Your teacher hasn't added questions to this quiz." />
              )}
            </ScrollView>

            {/* Bottom dock */}
            <View className="px-5 pt-3 pb-8 flex-row items-center gap-3">
              <TouchableOpacity
                onPress={handlePrev}
                disabled={currentIndex === 0}
                accessibilityRole="button"
                accessibilityLabel="Previous question"
                className={`w-14 h-14 rounded-full bg-white items-center justify-center ${currentIndex === 0 ? 'opacity-40' : ''}`}
              >
                <ChevronLeft size={22} color="#1C1C1E" />
              </TouchableOpacity>
              {isLast ? (
                <Button
                  variant="primary"
                  size="lg"
                  title="Submit Quiz"
                  loading={isSubmitting}
                  onPress={handleConfirmSubmit}
                  className="flex-1"
                />
              ) : (
                <TouchableOpacity
                  onPress={handleNext}
                  accessibilityRole="button"
                  className="flex-1 h-14 rounded-full bg-ink flex-row items-center justify-center gap-1.5 active:opacity-90"
                >
                  <Text className="font-sans-bold text-white text-[17px]">Next</Text>
                  <ChevronRight size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};
