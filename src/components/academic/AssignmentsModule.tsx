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
import { Card, Button, Input, Badge } from '@/components/ui';
import { QuizRunner } from './QuizRunner';
import {
  getQuizAnalytics,
  type QuizAnalyticsSummary,
} from '@/services/submissionService';
import { type Assignment } from '@/types/database';

export const AssignmentsModule: React.FC = () => {
  const { user, userRole, activeInstitute } = useAuth();
  const { selectedBatchId } = useUI();

  const { data: batches = [] } = useBatches(activeInstitute?.id);
  const activeBatch = batches.find((b) => b.id === selectedBatchId) || batches[0];
  const activeBatchId = activeBatch?.id;

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
  const [gradeMarks, setGradeMarks] = useState('85');
  const [gradeFeedback, setGradeFeedback] = useState('Solid derivation and accurate final answer.');

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

    try {
      await submitHomeworkMutation.mutateAsync({
        assignmentId: selectedAsgId,
        studentId: user.id,
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
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-xl ${
              activeTab === 'pending' ? 'bg-blue-600' : 'bg-slate-100'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === 'pending' ? 'text-white' : 'text-slate-600'
              }`}
            >
              Assignments ({assignments.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('submitted')}
            className={`px-3 py-1.5 rounded-xl ${
              activeTab === 'submitted' ? 'bg-blue-600' : 'bg-slate-100'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === 'submitted' ? 'text-white' : 'text-slate-600'
              }`}
            >
              Submissions ({submissions.length})
            </Text>
          </Pressable>
        </View>

        {(userRole === 'admin' || userRole === 'teacher') && (
          <Button
            size="sm"
            variant="surface"
            title="+ Assignment"
            onPress={() => setIsCreateOpen(true)}
          />
        )}
      </View>

      {/* Loading State */}
      {isAssignmentsLoading && (
        <View className="p-8 items-center justify-center bg-white rounded-2xl border border-slate-200">
          <ActivityIndicator size="small" color="#2563EB" />
          <Text className="text-xs text-slate-500 mt-2 font-medium">Loading batch assignments...</Text>
        </View>
      )}

      {/* TAB 1: ASSIGNMENTS */}
      {!isAssignmentsLoading && activeTab === 'pending' && (
        <View className="gap-2.5">
          {assignments.length === 0 ? (
            <View className="p-8 items-center justify-center bg-white rounded-2xl border border-slate-200">
              <FileCheck size={28} color="#94A3B8" />
              <Text className="text-sm font-bold text-slate-800 mt-2">No Assignments Created</Text>
              <Text className="text-xs text-slate-500 text-center mt-1">
                Active assignments published by faculty will appear here.
              </Text>
            </View>
          ) : (
            assignments.map((asg) => (
              <Card key={asg.id} elevation="lowest" className="gap-2.5 border border-slate-200/80">
                <View className="flex-row items-start justify-between gap-2">
                  <View className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 items-center justify-center shrink-0">
                    <FileCheck size={18} color="#2563EB" />
                  </View>

                  <View className="flex-1 min-w-0">
                    <View className="flex-row items-center gap-1.5 mb-0.5">
                      <Badge
                        label={asg.due_label || 'Due Soon'}
                        variant={asg.due_label?.includes('Tomorrow') ? 'due' : 'neutral'}
                      />
                      <Text className="text-[11px] text-slate-500 font-medium">
                        Total {asg.total_marks} Marks
                      </Text>
                    </View>
                    <Text className="text-sm font-extrabold text-slate-900">{asg.title}</Text>
                    {asg.description ? (
                      <Text className="text-xs text-slate-500 mt-0.5 leading-relaxed" numberOfLines={2}>
                        {asg.description}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View className="flex-row items-center justify-between pt-2 border-t border-slate-100">
                  <Text className="text-[11px] text-slate-500 font-medium">
                    Max Marks: <Text className="font-bold text-slate-800">{asg.total_marks}</Text>
                  </Text>

                  {userRole === 'student' && asg.type === 'quiz' && (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => setActiveQuizForRunner(asg)}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 shadow-xs flex-row items-center gap-1.5"
                    >
                      <Sparkles size={13} color="#FFFFFF" />
                      <Text className="text-xs font-bold text-white">Start Quiz</Text>
                    </TouchableOpacity>
                  )}

                  {userRole === 'student' && asg.type !== 'quiz' && (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => setSelectedAsgId(asg.id)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 shadow-xs"
                    >
                      <Text className="text-xs font-bold text-white">Submit Work</Text>
                    </TouchableOpacity>
                  )}

                  {(userRole === 'teacher' || userRole === 'admin') && (
                    <View className="flex-row items-center gap-2">
                      {asg.type === 'quiz' && (
                        <TouchableOpacity
                          onPress={() => handleOpenAnalytics(asg.id)}
                          className="px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 flex-row items-center gap-1 active:scale-95"
                        >
                          <BarChart3 size={12} color="#7C3AED" />
                          <Text className="text-[11px] font-bold text-purple-700">Analytics</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedAsgId(asg.id);
                          setActiveTab('submitted');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 active:scale-95"
                      >
                        <Text className="text-[11px] font-bold text-blue-600">Review Submissions →</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </Card>
            ))
          )}
        </View>
      )}

      {/* TAB 2: SUBMISSIONS */}
      {!isAssignmentsLoading && activeTab === 'submitted' && (
        <View className="gap-2.5">
          {isSubmissionsLoading ? (
            <ActivityIndicator size="small" color="#2563EB" className="my-4" />
          ) : submissions.length === 0 ? (
            <View className="p-8 items-center justify-center bg-white rounded-2xl border border-slate-200">
              <FileText size={28} color="#94A3B8" />
              <Text className="text-sm font-bold text-slate-800 mt-2">No Submissions Yet</Text>
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
                      <Text className="text-[11px] text-slate-500 font-medium">
                        Roll {sub.roll_number || '#01'}
                      </Text>
                    </View>
                    <Text className="text-sm font-extrabold text-slate-900">{sub.student_name}</Text>
                  </View>

                  {sub.status === 'graded' && sub.score !== undefined && sub.score !== null ? (
                    <View className="items-end">
                      <Text className="text-base font-black text-blue-600">{sub.score} Marks</Text>
                      <Text className="text-[10px] text-emerald-600 font-bold">Evaluated</Text>
                    </View>
                  ) : sub.ai_status === 'pending_review' ? (
                    <View className="items-end">
                      <View className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex-row items-center gap-1">
                        <Bot size={11} color="#D97706" />
                        <Text className="text-[10px] font-bold text-amber-800">
                          AI-checked, awaiting teacher review
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View className="items-end">
                      <Text className="text-[10px] text-slate-500 font-semibold">Under Evaluation</Text>
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
                            <Text className="text-[10px] font-bold text-indigo-950">
                              Gemini Suggestion: {sub.ai_score} Marks
                            </Text>
                          </View>
                          {sub.ai_feedback ? (
                            <Text className="text-[10px] text-indigo-700 italic mt-0.5" numberOfLines={1}>
                              "{sub.ai_feedback}"
                            </Text>
                          ) : null}
                        </View>
                        <Text className="text-[9px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-100">
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
                          <Text className="text-xs font-bold text-indigo-700">AI Suggest</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        onPress={() => {
                          setGradingSubId(sub.id);
                          if (sub.ai_status === 'pending_review' && sub.ai_score !== null && sub.ai_score !== undefined) {
                            setGradeMarks(String(sub.ai_score));
                            if (sub.ai_feedback) setGradeFeedback(sub.ai_feedback);
                          } else {
                            if (sub.score) setGradeMarks(String(sub.score));
                            if (sub.feedback) setGradeFeedback(sub.feedback);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 active:scale-95"
                      >
                        <Text className="text-xs font-bold text-white">
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
              <Text className="text-base font-black text-slate-900">Create Batch Assignment</Text>
              <TouchableOpacity onPress={() => setIsCreateOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View className="gap-1">
              <Text className="text-xs font-bold text-slate-700">Assignment Title</Text>
              <TextInput
                value={asgTitle}
                onChangeText={setAsgTitle}
                placeholder="e.g. Gauss Law & Electric Flux Numerical DPP"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
              />
            </View>

            <View className="gap-1">
              <Text className="text-xs font-bold text-slate-700">Instructions</Text>
              <TextInput
                value={asgInstructions}
                onChangeText={setAsgInstructions}
                placeholder="Instructions for students (due date, step by step requirements)..."
                multiline
                numberOfLines={2}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
              />
            </View>

            <View className="gap-1">
              <Text className="text-xs font-bold text-slate-700">Total Marks</Text>
              <TextInput
                value={asgMarks}
                onChangeText={setAsgMarks}
                keyboardType="numeric"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
              />
            </View>

            <TouchableOpacity
              onPress={handlePickQuestionPdf}
              className="p-3 rounded-xl border border-dashed border-slate-200 items-center justify-center bg-slate-50"
            >
              <Text className="text-xs font-bold text-blue-600">
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
                <Text className="text-sm font-black text-white">Publish Assignment</Text>
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
              <Text className="text-base font-black text-slate-900">Submit Solutions</Text>
              <TouchableOpacity onPress={() => setSelectedAsgId(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View className="gap-1">
              <Text className="text-xs font-bold text-slate-700">Submission Notes (Optional)</Text>
              <TextInput
                value={solutionNotes}
                onChangeText={setSolutionNotes}
                placeholder="Notes for faculty evaluation..."
                multiline
                numberOfLines={2}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
              />
            </View>

            <TouchableOpacity
              onPress={handlePickSolutionDocument}
              className="p-4 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 items-center justify-center"
            >
              <Upload size={24} color="#2563EB" />
              <Text className="text-xs font-bold text-blue-600 mt-1">
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
                <Text className="text-sm font-black text-white">Upload & Submit Homework</Text>
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
              <Text className="text-base font-black text-slate-900">Evaluate Homework</Text>
              <TouchableOpacity onPress={() => setGradingSubId(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Privacy & Quota Helper Banner */}
            <View className="bg-indigo-50 border border-indigo-200 p-2.5 rounded-xl gap-1">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  <ShieldCheck size={13} color="#4338CA" />
                  <Text className="text-[10px] font-bold text-indigo-900">
                    AI Assistance (Optional)
                  </Text>
                </View>
                <Text className="text-[9px] font-semibold text-indigo-700">
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
                      <Text className="text-[10px] font-bold text-white">
                        Fetch Gemini Evaluation Suggestion
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <View className="gap-1">
              <Text className="text-xs font-bold text-slate-700">Score / Marks</Text>
              <TextInput
                value={gradeMarks}
                onChangeText={setGradeMarks}
                keyboardType="numeric"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold"
              />
            </View>

            <View className="gap-1">
              <Text className="text-xs font-bold text-slate-700">Faculty Feedback</Text>
              <TextInput
                value={gradeFeedback}
                onChangeText={setGradeFeedback}
                multiline
                numberOfLines={3}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
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
                <Text className="text-sm font-black text-white">Save Evaluation & Notify Student</Text>
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
                <Text className="text-sm font-extrabold text-white">Quiz Analytics</Text>
                <Text className="text-[11px] text-slate-400">
                  {activeQuizAnalytics?.assignmentTitle || 'Assignment Overview'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setActiveQuizAnalytics(null)}
              className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center border border-slate-700"
            >
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-4 py-5" contentContainerStyle={{ paddingBottom: 60 }}>
            {activeQuizAnalytics && (
              <View className="gap-5">
                {/* Metrics Cards */}
                <View className="flex-row gap-3">
                  <View className="flex-1 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80">
                    <Text className="text-[11px] text-slate-400 font-bold uppercase">Submissions</Text>
                    <Text className="text-xl font-black text-white mt-1">
                      {activeQuizAnalytics.submittedCount}
                    </Text>
                    <Text className="text-[10px] text-slate-500 mt-0.5">Students Completed</Text>
                  </View>

                  <View className="flex-1 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80">
                    <Text className="text-[11px] text-slate-400 font-bold uppercase">Average Score</Text>
                    <Text className="text-xl font-black text-purple-400 mt-1">
                      {activeQuizAnalytics.averageScore}
                    </Text>
                    <Text className="text-[10px] text-slate-500 mt-0.5">Batch Mean</Text>
                  </View>

                  <View className="flex-1 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80">
                    <Text className="text-[11px] text-slate-400 font-bold uppercase">Pass Rate</Text>
                    <Text className="text-xl font-black text-emerald-400 mt-1">
                      {activeQuizAnalytics.passRate}%
                    </Text>
                    <Text className="text-[10px] text-slate-500 mt-0.5">≥40% Threshold</Text>
                  </View>
                </View>

                {/* Per-Question Accuracy Breakdown */}
                <View className="gap-3">
                  <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Per-Question Performance
                  </Text>

                  {activeQuizAnalytics.questions.map((q, idx) => (
                    <View
                      key={q.questionId || idx}
                      className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 gap-2"
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className="text-xs font-bold text-purple-400">
                          Question #{idx + 1}
                        </Text>
                        <Badge
                          label={`${q.percentCorrect}% Accuracy`}
                          variant={q.percentCorrect >= 70 ? 'success' : q.percentCorrect >= 40 ? 'warning' : 'error'}
                          size="sm"
                        />
                      </View>

                      <Text className="text-sm font-semibold text-white leading-relaxed">
                        {q.questionText}
                      </Text>

                      <View className="mt-1 gap-1">
                        <View className="flex-row justify-between text-[11px]">
                          <Text className="text-[11px] text-emerald-400 font-bold">
                            {q.correctCount} Correct
                          </Text>
                          <Text className="text-[11px] text-rose-400 font-bold">
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
