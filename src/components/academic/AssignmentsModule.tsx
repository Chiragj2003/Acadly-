import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import {
  FileCheck,
  Calendar,
  Clock,
  Upload,
  CheckCircle,
  Plus,
  X,
  Award,
  FileText,
  Download,
  Sparkles,
  BarChart3,
  TrendingUp,
  Bot,
  ShieldCheck,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import {
  useAssignments,
  useCreateAssignment,
  useSubmissions,
  useSubmitHomework,
  useGradeSubmission,
} from '@/hooks/queries/useAssignmentQueries';
import { useGradeSubmissionWithAI, useTeacherAiQuota } from '@/hooks/queries/useAiQueries';
import { useBatches } from '@/hooks/queries/useBatchQueries';
import { Card, Button, Input, Badge, ListEmptyState, ListLoadingSkeleton } from '@/components/ui';
import { QuizRunner } from './QuizRunner';
import {
  getQuizAnalytics,
  type QuizAnalyticsSummary,
} from '@/services/submissionService';
import { type Assignment } from '@/types/database';

const SUBJECT_TILES = ['bg-pastel-lilac', 'bg-pastel-mint', 'bg-pastel-peach', 'bg-pastel-pink', 'bg-pastel-sky', 'bg-pastel-butter'];

/** "Due today" / "Due tomorrow" / "Due Fri" from a real due date. */
const relativeDue = (iso?: string): { label: string; short: string; urgent: boolean } => {
  if (!iso) return { label: 'No due date', short: '', urgent: false };
  const due = new Date(iso);
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((start(due) - start(new Date())) / 86400000);
  if (days < 0) return { label: 'Overdue', short: 'Overdue', urgent: true };
  if (days === 0) return { label: 'Due today', short: 'Today', urgent: true };
  if (days === 1) return { label: 'Due tomorrow', short: 'Tomorrow', urgent: true };
  const weekday = due.toLocaleDateString('en-IN', { weekday: 'short' });
  if (days < 7) return { label: `Due ${weekday}`, short: weekday, urgent: false };
  const date = due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return { label: `Due ${date}`, short: date, urgent: false };
};

interface AssignmentsModuleProps {
  /**
   * Batch to show. Students pass their enrolled batch; without it the module
   * falls back to the staff-selected batch (previously students silently saw
   * the institute's first batch instead of their own).
   */
  batchId?: string;
  /** Student's students.id; required for submitting homework and quizzes. */
  studentRecordId?: string;
}

export const AssignmentsModule: React.FC<AssignmentsModuleProps> = ({ batchId, studentRecordId }) => {
  const { user, userRole, activeInstitute } = useAuth();
  const { selectedBatchId } = useUI();

  const { data: batches = [] } = useBatches(batchId ? undefined : activeInstitute?.id);
  const activeBatch = batchId
    ? batches.find((b) => b.id === batchId)
    : batches.find((b) => b.id === selectedBatchId) || batches[0];
  const activeBatchId = batchId ?? activeBatch?.id;

  const {
    data: assignments = [],
    isLoading: isAssignmentsLoading,
  } = useAssignments(activeBatchId);

  const [activeTab, setActiveTab] = useState<'pending' | 'submitted'>('pending');

  // Create Assignment Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [asgTitle, setAsgTitle] = useState('');
  const [asgSubject, setAsgSubject] = useState('Physics');
  const [asgInstructions, setAsgInstructions] = useState('');
  const [asgMarks, setAsgMarks] = useState('100');
  const [asgAttachedPdfName, setAsgAttachedPdfName] = useState<string | null>(null);

  // Submit Solution Modal
  const [selectedAsgId, setSelectedAsgId] = useState<string | null>(null);
  const [solutionNotes, setSolutionNotes] = useState('');
  const [pickedFileName, setPickedFileName] = useState('');
  const [pickedFileUri, setPickedFileUri] = useState<string | null>(null);

  // Submissions Query for the selected assignment (or first available)
  const currentAssignmentForSubmissions = selectedAsgId || assignments[0]?.id;
  const {
    data: submissions = [],
    isLoading: isSubmissionsLoading,
  } = useSubmissions(currentAssignmentForSubmissions);

  // Grade Modal
  const [gradingSubId, setGradingSubId] = useState<string | null>(null);
  // Start empty: a pre-filled "85 / Solid derivation…" grade was easy to publish by accident.
  const [gradeMarks, setGradeMarks] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');

  // Quiz Runner & Analytics State
  const [activeQuizForRunner, setActiveQuizForRunner] = useState<Assignment | null>(null);
  const [activeQuizAnalytics, setActiveQuizAnalytics] = useState<QuizAnalyticsSummary | null>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  const createAssignmentMutation = useCreateAssignment();
  const submitHomeworkMutation = useSubmitHomework();
  const gradeSubmissionMutation = useGradeSubmission();
  const gradeWithAiMutation = useGradeSubmissionWithAI();
  const { data: aiQuota } = useTeacherAiQuota(user?.id);

  const handleRequestAiGrading = async (subId: string) => {
    try {
      const res = await gradeWithAiMutation.mutateAsync({
        submissionId: subId,
      });

      setGradingSubId(subId);
      setGradeMarks(String(res.aiScore));
      setGradeFeedback(res.aiFeedback);

      Alert.alert(
        'AI Evaluation Received 🤖',
        `Gemini suggested ${res.aiScore}/${res.maxScore} marks.\n\nYou can review, adjust the score/feedback, and approve to publish the final grade.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI grading failed';
      Alert.alert('AI Grading Error', msg);
    }
  };

  const handleOpenAnalytics = async (asgId: string) => {
    setIsAnalyticsLoading(true);
    try {
      const data = await getQuizAnalytics(asgId);
      if (data) {
        setActiveQuizAnalytics(data);
      } else {
        Alert.alert('Analytics', 'No quiz submission analytics available yet.');
      }
    } catch {
      Alert.alert('Error', 'Failed to load quiz analytics.');
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  const handlePickQuestionPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setAsgAttachedPdfName(res.assets[0].name);
      }
    } catch {
      Alert.alert('File Picker', 'Unable to pick PDF document.');
    }
  };

  const handlePickSolutionDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setPickedFileName(res.assets[0].name);
        setPickedFileUri(res.assets[0].uri);
        Alert.alert('File Attached', `Attached: ${res.assets[0].name}`);
      }
    } catch {
      Alert.alert('File Picker', 'Unable to select file.');
    }
  };

  const handleCreateAssignment = async () => {
    if (!asgTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter assignment title.');
      return;
    }

    if (!activeBatchId || !user || !activeInstitute) {
      Alert.alert('Error', 'Please select an active batch.');
      return;
    }

    try {
      await createAssignmentMutation.mutateAsync({
        institute_id: activeInstitute.id,
        batch_id: activeBatchId,
        title: asgTitle.trim(),
        subject: 'General',
        instructions: asgInstructions.trim() || 'Solve all questions and upload your working.',
        description: asgInstructions.trim() || 'Solve all questions and upload your working.',
        due_date: new Date(Date.now() + 86400000 * 7).toISOString(),
        due_label: 'Due in 7 Days',
        total_marks: parseInt(asgMarks, 10) || 100,
        type: 'file',
        question_count: 5,
        created_by: user.id,
      });

      setIsCreateOpen(false);
      setAsgTitle('');
      setAsgInstructions('');
      setAsgAttachedPdfName(null);
      Alert.alert('Assignment Created', 'Assignment and question sheet published to batch.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create assignment';
      Alert.alert('Error', msg);
    }
  };

  const handleSubmitSolution = async () => {
    if (!selectedAsgId || !user) return;
    if (!studentRecordId) {
      Alert.alert('Not enrolled', 'Join your batch before submitting work.');
      return;
    }

    try {
      await submitHomeworkMutation.mutateAsync({
        assignmentId: selectedAsgId,
        // submissions.student_id references students.id, not the auth user id.
        studentId: studentRecordId,
        notes: solutionNotes.trim() || 'Solution PDF submission',
        fileUri: pickedFileUri || undefined,
        fileName: pickedFileName || undefined,
      });

      setSelectedAsgId(null);
      setSolutionNotes('');
      setPickedFileName('');
      setPickedFileUri(null);
      Alert.alert('Solution Submitted', 'Your assignment has been submitted to faculty for evaluation.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      Alert.alert('Submission Error', msg);
    }
  };

  const handleGrade = async () => {
    if (!gradingSubId || !user) return;
    if (gradeMarks.trim() === '' || Number.isNaN(Number(gradeMarks))) {
      Alert.alert('Marks needed', 'Enter the marks before saving.');
      return;
    }

    try {
      await gradeSubmissionMutation.mutateAsync({
        submissionId: gradingSubId,
        marks: parseFloat(gradeMarks) || 0,
        feedback: gradeFeedback.trim(),
        graderId: user.id,
      });

      setGradingSubId(null);
      Alert.alert('Graded & Saved', 'Marks and feedback published to student profile.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Grading failed';
      Alert.alert('Grading Error', msg);
    }
  };

  return (
    <View className="gap-3">
      {/* Header & Tabs */}
      <View className="flex-row items-center justify-between gap-2">
        <View accessibilityRole="tablist" className="flex-row items-center gap-2">
          {([
            ['pending', userRole === 'student' ? 'To do' : 'Assignments', assignments.length],
            ['submitted', userRole === 'student' ? 'Submitted' : 'Submissions', submissions.length],
          ] as const).map(([key, label, count]) => {
            const selected = activeTab === key;
            return (
              <Pressable
                key={key}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setActiveTab(key)}
                className={`h-10 px-4 rounded-full justify-center ${selected ? 'bg-ink' : 'bg-white'}`}
              >
                <Text className={`text-sm font-sans-bold ${selected ? 'text-white' : 'text-ink'}`}>
                  {label} · {count}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {(userRole === 'admin' || userRole === 'teacher') && (
          <Button size="sm" variant="primary" title="New" leftIcon={<Plus size={16} color="#FFFFFF" />} onPress={() => setIsCreateOpen(true)} />
        )}
      </View>

      {/* Loading State */}
      {isAssignmentsLoading && <ListLoadingSkeleton count={3} height={84} />}

      {/* TAB 1: ASSIGNMENTS */}
      {!isAssignmentsLoading && activeTab === 'pending' && (
        <View className="gap-2.5">
          {assignments.length === 0 ? (
            <ListEmptyState
              title={userRole === 'student' ? 'Nothing due right now' : 'No assignments yet'}
              message={
                userRole === 'student'
                  ? 'New DPPs and homework from your teachers show up here first.'
                  : 'Create a DPP, quiz or homework for this batch.'
              }
            />
          ) : (
            assignments.map((asg, index) => {
              const isHero = index === 0;
              const tile = SUBJECT_TILES[(asg.subject || 'X').charCodeAt(0) % SUBJECT_TILES.length];
              const meta = [
                asg.subject,
                asg.type === 'quiz' ? `${asg.question_count || 0} MCQs` : 'Upload',
                asg.total_marks ? `${asg.total_marks} marks` : null,
              ]
                .filter(Boolean)
                .join(' · ');
              const due = relativeDue(asg.due_date);
              const studentAction =
                userRole === 'student'
                  ? asg.type === 'quiz'
                    ? { label: 'Start quiz', onPress: () => setActiveQuizForRunner(asg) }
                    : { label: 'Submit work', onPress: () => setSelectedAsgId(asg.id) }
                  : null;

              return (
                <View
                  key={asg.id}
                  className={`rounded-[26px] p-4 gap-3 ${isHero ? 'bg-pastel-sky border-[1.5px] border-ink' : 'bg-white'}`}
                >
                  <View className="flex-row items-center gap-3.5">
                    {!isHero && (
                      <View className={`w-[52px] h-[52px] rounded-[18px] items-center justify-center ${tile}`}>
                        <Text className="font-display text-ink text-xl">{(asg.subject || asg.title).charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                    <View className="flex-1 min-w-0 gap-0.5">
                      {isHero && (
                        <View className="self-start px-3 py-1 rounded-xl bg-pastel-sky-soft mb-1">
                          <Text className="font-sans-bold text-ink text-[13px]">{due.label}</Text>
                        </View>
                      )}
                      <Text className={`font-display text-ink ${isHero ? 'text-2xl leading-7' : 'text-base'}`} numberOfLines={2}>
                        {asg.title}
                      </Text>
                      <Text className="font-sans text-slate-600 text-[13px]" numberOfLines={1}>
                        {meta}
                      </Text>
                    </View>
                    {!isHero && due.short ? (
                      <Text className={`font-sans-bold text-[13px] ${due.urgent ? 'text-rose-700' : 'text-slate-600'}`}>{due.short}</Text>
                    ) : null}
                  </View>

                  {studentAction && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${studentAction.label}: ${asg.title}`}
                      onPress={studentAction.onPress}
                      className={`min-h-[48px] rounded-full items-center justify-center ${isHero ? 'bg-ink' : 'bg-paper'}`}
                    >
                      <Text className={`font-sans-bold text-[15px] ${isHero ? 'text-white' : 'text-ink'}`}>{studentAction.label}</Text>
                    </Pressable>
                  )}

                  {(userRole === 'teacher' || userRole === 'admin') && (
                    <View className="flex-row items-center gap-2">
                      {asg.type === 'quiz' && (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => handleOpenAnalytics(asg.id)}
                          className="h-10 px-4 rounded-full bg-paper flex-row items-center gap-1.5"
                        >
                          <BarChart3 size={14} color="#1C1C1E" />
                          <Text className="text-sm font-sans-bold text-ink">Analytics</Text>
                        </Pressable>
                      )}
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          setSelectedAsgId(asg.id);
                          setActiveTab('submitted');
                        }}
                        className={`h-10 px-4 rounded-full justify-center ${isHero ? 'bg-ink' : 'bg-paper'}`}
                      >
                        <Text className={`text-sm font-sans-bold ${isHero ? 'text-white' : 'text-ink'}`}>Review submissions</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}

      {/* TAB 2: SUBMISSIONS */}
      {!isAssignmentsLoading && activeTab === 'submitted' && (
        <View className="gap-2.5">
          {isSubmissionsLoading ? (
            <ActivityIndicator size="small" color="#1C1C1E" className="my-4" />
          ) : submissions.length === 0 ? (
            <View className="p-8 items-center justify-center bg-white rounded-2xl border border-slate-200">
              <FileText size={28} color="#8C877E" />
              <Text className="text-sm font-sans-bold text-slate-800 mt-2">No Submissions Yet</Text>
              <Text className="text-xs text-slate-500 text-center mt-1">
                Student homework uploads will display here for review and grading.
              </Text>
            </View>
          ) : (
            submissions.map((sub) => (
              <Card key={sub.id} elevation="lowest" className="gap-2.5">
                <View className="flex-row items-start justify-between">
                  <View>
                    <View className="flex-row items-center gap-1.5 mb-0.5">
                      <Badge
                        label={sub.status === 'graded' ? 'Graded' : 'Pending Review'}
                        variant={sub.status === 'graded' ? 'success' : 'warning'}
                      />
                      <Text className="text-[11px] text-slate-500 font-sans">
                        Roll {sub.roll_number || '#01'}
                      </Text>
                    </View>
                    <Text className="text-sm font-display text-slate-900">{sub.student_name}</Text>
                  </View>

                  {sub.status === 'graded' && sub.score !== undefined && sub.score !== null ? (
                    <View className="items-end">
                      <Text className="text-base font-display text-blue-600">{sub.score} Marks</Text>
                      <Text className="text-[10px] text-emerald-600 font-sans-bold">Evaluated</Text>
                    </View>
                  ) : sub.ai_status === 'pending_review' ? (
                    <View className="items-end">
                      <View className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex-row items-center gap-1">
                        <Bot size={11} color="#D97706" />
                        <Text className="text-[10px] font-sans-bold text-amber-800">
                          AI-checked, awaiting teacher review
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View className="items-end">
                      <Text className="text-[10px] text-slate-500 font-sans-semibold">Under Evaluation</Text>
                    </View>
                  )}
                </View>

                {sub.status === 'graded' && sub.feedback ? (
                  <View className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <Text className="text-[11px] text-slate-600 italic">"{sub.feedback}"</Text>
                  </View>
                ) : null}

                {(userRole === 'teacher' || userRole === 'admin') && (
                  <View className="gap-2 pt-2 border-t border-slate-100">
                    {sub.ai_status === 'pending_review' && sub.ai_score !== undefined && sub.ai_score !== null && (
                      <View className="bg-indigo-50 border border-indigo-200 p-2.5 rounded-xl flex-row items-center justify-between">
                        <View className="flex-1 mr-2">
                          <View className="flex-row items-center gap-1">
                            <Sparkles size={11} color="#4F46E5" />
                            <Text className="text-[10px] font-sans-bold text-indigo-950">
                              Gemini Suggestion: {sub.ai_score} Marks
                            </Text>
                          </View>
                          {sub.ai_feedback ? (
                            <Text className="text-[10px] text-indigo-700 italic mt-0.5" numberOfLines={1}>
                              "{sub.ai_feedback}"
                            </Text>
                          ) : null}
                        </View>
                        <Text className="text-[9px] font-sans-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-100">
                          Pending Approval
                        </Text>
                      </View>
                    )}

                    <View className="flex-row items-center justify-end gap-2">
                      {sub.ai_status !== 'pending_review' && sub.status !== 'graded' && (
                        <TouchableOpacity
                          disabled={gradeWithAiMutation.isPending}
                          onPress={() => handleRequestAiGrading(sub.id)}
                          className={`px-2.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 flex-row items-center gap-1 active:scale-95 ${
                            gradeWithAiMutation.isPending ? 'opacity-50' : ''
                          }`}
                        >
                          <Sparkles size={12} color="#4F46E5" />
                          <Text className="text-xs font-sans-bold text-indigo-700">AI Suggest</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        onPress={() => {
                          setGradingSubId(sub.id);
                          if (sub.ai_status === 'pending_review' && sub.ai_score !== null && sub.ai_score !== undefined) {
                            setGradeMarks(String(sub.ai_score));
                            if (sub.ai_feedback) setGradeFeedback(sub.ai_feedback);
                          } else {
                            setGradeMarks(sub.score !== undefined && sub.score !== null ? String(sub.score) : '');
                            setGradeFeedback(sub.feedback ?? '');
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 active:scale-95"
                      >
                        <Text className="text-xs font-sans-bold text-white">
                          {sub.status === 'graded'
                            ? 'Edit Marks'
                            : sub.ai_status === 'pending_review'
                            ? 'Review & Approve'
                            : 'Grade Submission'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </Card>
            ))
          )}
        </View>
      )}

      {/* ================= MODAL 1: CREATE ASSIGNMENT ================= */}
      <Modal visible={isCreateOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 bg-black/50 justify-end"
        >
          <View className="bg-white rounded-t-3xl p-5 gap-3.5 max-h-[85%]">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-display text-slate-900">Create Batch Assignment</Text>
              <TouchableOpacity onPress={() => setIsCreateOpen(false)}>
                <X size={20} color="#6E6A63" />
              </TouchableOpacity>
            </View>

            <View className="gap-1">
              <Text className="text-xs font-sans-bold text-slate-700">Assignment Title</Text>
              <TextInput
                value={asgTitle}
                onChangeText={setAsgTitle}
                placeholder="e.g. Gauss Law & Electric Flux Numerical DPP"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-sans"
              />
            </View>

            <View className="gap-1">
              <Text className="text-xs font-sans-bold text-slate-700">Instructions</Text>
              <TextInput
                value={asgInstructions}
                onChangeText={setAsgInstructions}
                placeholder="Instructions for students (due date, step by step requirements)..."
                multiline
                numberOfLines={2}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-sans"
              />
            </View>

            <View className="gap-1">
              <Text className="text-xs font-sans-bold text-slate-700">Total Marks</Text>
              <TextInput
                value={asgMarks}
                onChangeText={setAsgMarks}
                keyboardType="numeric"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-sans"
              />
            </View>

            <TouchableOpacity
              onPress={handlePickQuestionPdf}
              className="p-3 rounded-xl border border-dashed border-slate-200 items-center justify-center bg-slate-50"
            >
              <Text className="text-xs font-sans-bold text-blue-600">
                {asgAttachedPdfName ? `Attached: ${asgAttachedPdfName}` : '+ Attach Question Sheet PDF'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCreateAssignment}
              disabled={createAssignmentMutation.isPending}
              className={`py-3.5 bg-blue-600 rounded-xl items-center justify-center ${
                createAssignmentMutation.isPending ? 'opacity-60' : ''
              }`}
            >
              {createAssignmentMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-sm font-display text-white">Publish Assignment</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL 2: SUBMIT HOMEWORK ================= */}
      <Modal visible={Boolean(selectedAsgId)} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 bg-black/50 justify-end"
        >
          <View className="bg-white rounded-t-3xl p-5 gap-3.5 max-h-[85%]">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-display text-slate-900">Submit Solutions</Text>
              <TouchableOpacity onPress={() => setSelectedAsgId(null)}>
                <X size={20} color="#6E6A63" />
              </TouchableOpacity>
            </View>

            <View className="gap-1">
              <Text className="text-xs font-sans-bold text-slate-700">Submission Notes (Optional)</Text>
              <TextInput
                value={solutionNotes}
                onChangeText={setSolutionNotes}
                placeholder="Notes for faculty evaluation..."
                multiline
                numberOfLines={2}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-sans"
              />
            </View>

            <TouchableOpacity
              onPress={handlePickSolutionDocument}
              className="p-4 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 items-center justify-center"
            >
              <Upload size={24} color="#1C1C1E" />
              <Text className="text-xs font-sans-bold text-blue-600 mt-1">
                {pickedFileName ? pickedFileName : 'Attach Solution PDF'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmitSolution}
              disabled={submitHomeworkMutation.isPending}
              className={`py-3.5 bg-blue-600 rounded-xl items-center justify-center ${
                submitHomeworkMutation.isPending ? 'opacity-60' : ''
              }`}
            >
              {submitHomeworkMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-sm font-display text-white">Upload & Submit Homework</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL 3: GRADE SUBMISSION ================= */}
      <Modal visible={Boolean(gradingSubId)} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 bg-black/50 justify-end"
        >
          <View className="bg-white rounded-t-3xl p-5 gap-3.5 max-h-[85%]">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-display text-slate-900">Evaluate Homework</Text>
              <TouchableOpacity onPress={() => setGradingSubId(null)}>
                <X size={20} color="#6E6A63" />
              </TouchableOpacity>
            </View>

            {/* Privacy & Quota Helper Banner */}
            <View className="bg-indigo-50 border border-indigo-200 p-2.5 rounded-xl gap-1">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  <ShieldCheck size={13} color="#4338CA" />
                  <Text className="text-[10px] font-sans-bold text-indigo-900">
                    AI Assistance (Optional)
                  </Text>
                </View>
                <Text className="text-[9px] font-sans-semibold text-indigo-700">
                  Quota: {aiQuota?.remaining ?? 25}/25 left
                </Text>
              </View>
              <Text className="text-[10px] text-indigo-700">
                Acadly uses Gemini to suggest scores from rubrics. No student PII is shared. The final grade is always yours.
              </Text>
              {gradingSubId && (
                <TouchableOpacity
                  disabled={gradeWithAiMutation.isPending}
                  onPress={() => handleRequestAiGrading(gradingSubId)}
                  className="mt-1 bg-indigo-600 py-1.5 rounded-lg items-center flex-row justify-center gap-1"
                >
                  {gradeWithAiMutation.isPending ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Sparkles size={11} color="#FFFFFF" />
                      <Text className="text-[10px] font-sans-bold text-white">
                        Fetch Gemini Evaluation Suggestion
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <View className="gap-1">
              <Text className="text-xs font-sans-bold text-slate-700">Score / Marks</Text>
              <TextInput
                value={gradeMarks}
                onChangeText={setGradeMarks}
                keyboardType="numeric"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-sans-bold"
              />
            </View>

            <View className="gap-1">
              <Text className="text-xs font-sans-bold text-slate-700">Faculty Feedback</Text>
              <TextInput
                value={gradeFeedback}
                onChangeText={setGradeFeedback}
                multiline
                numberOfLines={3}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-sans"
              />
            </View>

            <TouchableOpacity
              onPress={handleGrade}
              disabled={gradeSubmissionMutation.isPending}
              className={`py-3.5 bg-blue-600 rounded-xl items-center justify-center ${
                gradeSubmissionMutation.isPending ? 'opacity-60' : ''
              }`}
            >
              {gradeSubmissionMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-sm font-display text-white">Save Evaluation & Notify Student</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* QUIZ RUNNER MODAL FOR STUDENTS */}
      <QuizRunner
        assignment={activeQuizForRunner}
        visible={Boolean(activeQuizForRunner)}
        onClose={() => setActiveQuizForRunner(null)}
        studentId={studentRecordId}
      />

      {/* QUIZ ANALYTICS MODAL FOR TEACHERS */}
      <Modal
        visible={Boolean(activeQuizAnalytics)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveQuizAnalytics(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 bg-slate-900"
        >
          <View className="bg-slate-900 border-b border-slate-800 px-4 py-3.5 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-xl bg-purple-500/20 items-center justify-center border border-purple-500/40">
                <BarChart3 size={16} color="#C084FC" />
              </View>
              <View>
                <Text className="text-sm font-display text-white">Quiz Analytics</Text>
                <Text className="text-[11px] text-slate-400">
                  {activeQuizAnalytics?.assignmentTitle || 'Assignment Overview'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setActiveQuizAnalytics(null)}
              className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center border border-slate-700"
            >
              <X size={16} color="#8C877E" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-4 py-5" contentContainerStyle={{ paddingBottom: 60 }}>
            {activeQuizAnalytics && (
              <View className="gap-5">
                {/* Metrics Cards */}
                <View className="flex-row gap-3">
                  <View className="flex-1 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80">
                    <Text className="text-[11px] text-slate-400 font-sans-bold uppercase">Submissions</Text>
                    <Text className="text-xl font-display text-white mt-1">
                      {activeQuizAnalytics.submittedCount}
                    </Text>
                    <Text className="text-[10px] text-slate-500 mt-0.5">Students Completed</Text>
                  </View>

                  <View className="flex-1 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80">
                    <Text className="text-[11px] text-slate-400 font-sans-bold uppercase">Average Score</Text>
                    <Text className="text-xl font-display text-purple-400 mt-1">
                      {activeQuizAnalytics.averageScore}
                    </Text>
                    <Text className="text-[10px] text-slate-500 mt-0.5">Batch Mean</Text>
                  </View>

                  <View className="flex-1 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80">
                    <Text className="text-[11px] text-slate-400 font-sans-bold uppercase">Pass Rate</Text>
                    <Text className="text-xl font-display text-emerald-400 mt-1">
                      {activeQuizAnalytics.passRate}%
                    </Text>
                    <Text className="text-[10px] text-slate-500 mt-0.5">≥40% Threshold</Text>
                  </View>
                </View>

                {/* Per-Question Accuracy Breakdown */}
                <View className="gap-3">
                  <Text className="text-xs font-sans-bold uppercase tracking-wider text-slate-400">
                    Per-Question Performance
                  </Text>

                  {activeQuizAnalytics.questions.map((q, idx) => (
                    <View
                      key={q.questionId || idx}
                      className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 gap-2"
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className="text-xs font-sans-bold text-purple-400">
                          Question #{idx + 1}
                        </Text>
                        <Badge
                          label={`${q.percentCorrect}% Accuracy`}
                          variant={q.percentCorrect >= 70 ? 'success' : q.percentCorrect >= 40 ? 'warning' : 'error'}
                          size="sm"
                        />
                      </View>

                      <Text className="text-sm font-sans-semibold text-white leading-relaxed">
                        {q.questionText}
                      </Text>

                      <View className="mt-1 gap-1">
                        <View className="flex-row justify-between text-[11px]">
                          <Text className="text-[11px] text-emerald-400 font-sans-bold">
                            {q.correctCount} Correct
                          </Text>
                          <Text className="text-[11px] text-rose-400 font-sans-bold">
                            {q.incorrectCount} Incorrect
                          </Text>
                        </View>
                        <View className="w-full h-2 bg-slate-700/80 rounded-full overflow-hidden flex-row">
                          <View
                            className="h-full bg-emerald-500"
                            style={{ width: `${q.percentCorrect}%` }}
                          />
                          <View
                            className="h-full bg-rose-500"
                            style={{ width: `${100 - q.percentCorrect}%` }}
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};
