import React, { useState } from 'react';
import { View, Text, Pressable, Modal, Alert, TouchableOpacity } from 'react-native';
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
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAcademic } from '@/context/AcademicContext';
import { useAuth } from '@/context/AuthContext';
import { Card, Button, Input, Badge, type BadgeVariant } from '@/components/ui';
import { generateAndSharePDF } from '@/services/dummyPdfService';

export const AssignmentsModule: React.FC = () => {
  const { assignments, submissions, createAssignment, submitAssignment, gradeSubmission } = useAcademic();
  const { userRole } = useAuth();

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
  const [pickedFileName, setPickedFileName] = useState('amelia_gauss_solution.pdf');
  const [pickedFileUri, setPickedFileUri] = useState<string | null>(null);

  // Grade Modal
  const [gradingSubId, setGradingSubId] = useState<string | null>(null);
  const [gradeMarks, setGradeMarks] = useState('54');
  const [gradeFeedback, setGradeFeedback] = useState('Excellent spherical shell derivations and step-by-step clarity.');

  const handlePickQuestionPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setAsgAttachedPdfName(res.assets[0].name);
      }
    } catch {
      Alert.alert('File Picker', 'Selected demo Question Sheet PDF.');
      setAsgAttachedPdfName('Physics_DPP_Question_Sheet.pdf');
    }
  };

  const handlePickSolutionDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setPickedFileName(res.assets[0].name);
        setPickedFileUri(res.assets[0].uri);
        Alert.alert('File Attached 📄', `Attached: ${res.assets[0].name}`);
      }
    } catch {
      setPickedFileName('amelia_gauss_solution.pdf');
    }
  };

  const handleCreateAssignment = async () => {
    if (!asgTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter assignment title.');
      return;
    }

    await createAssignment({
      batch_id: 'batch-01',
      title: asgTitle,
      subject: asgSubject,
      instructions: asgInstructions || 'Solve all questions and upload work.',
      due_date: new Date(Date.now() + 86400000 * 7).toISOString(),
      due_label: 'Due in 7 Days',
      due_date_formatted: 'Due in 7 Days',
      total_marks: parseInt(asgMarks, 10) || 100,
      max_marks: parseInt(asgMarks, 10) || 100,
      question_count: 20,
      created_by: userRole === 'teacher' ? 'Er. Rakesh Verma' : 'Director Sharma',
    });

    setIsCreateOpen(false);
    setAsgTitle('');
    setAsgInstructions('');
    setAsgAttachedPdfName(null);
    Alert.alert('Assignment Created 🎉', 'Assignment and question sheet published to batch.');
  };

  const handleSubmitSolution = async () => {
    if (!selectedAsgId) return;

    await submitAssignment(selectedAsgId, solutionNotes || 'Submitted solutions PDF', pickedFileName, pickedFileUri || undefined);
    setSelectedAsgId(null);
    setSolutionNotes('');
    Alert.alert('Solution Submitted 🎉', 'Your assignment has been submitted to faculty for evaluation.');
  };

  const handleGrade = async () => {
    if (!gradingSubId) return;

    await gradeSubmission(gradingSubId, parseFloat(gradeMarks) || 54, gradeFeedback);
    setGradingSubId(null);
    Alert.alert('Graded & Saved ⭐', 'Marks and feedback published to student profile.');
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
              Pending ({assignments.filter((a) => a.submission_status !== 'submitted').length})
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

      {/* TAB 1: PENDING ASSIGNMENTS */}
      {activeTab === 'pending' && (
        <View className="gap-2.5">
          {assignments.map((asg) => {
            const isSubmitted = asg.submission_status === 'submitted';
            return (
              <Card key={asg.id} elevation="lowest" className="gap-2.5 border border-slate-200/80">
                <View className="flex-row items-start justify-between gap-2">
                  <View className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 items-center justify-center shrink-0">
                    <FileCheck size={18} color="#2563EB" />
                  </View>

                  <View className="flex-1 min-w-0">
                    <View className="flex-row items-center gap-1.5 mb-0.5">
                      <Badge
                        label={asg.due_label}
                        variant={asg.due_label.includes('Tomorrow') ? 'due' : 'neutral'}
                      />
                      <Text className="text-[11px] text-slate-500 font-medium">
                        {asg.subject} • {asg.question_count} Questions
                      </Text>
                    </View>
                    <Text className="text-sm font-extrabold text-slate-900">{asg.title}</Text>
                    <Text className="text-xs text-slate-500 mt-0.5 leading-relaxed" numberOfLines={2}>
                      {asg.instructions}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between pt-2 border-t border-slate-100">
                  <Text className="text-[11px] text-slate-500 font-medium">
                    Total Marks: <Text className="font-bold text-slate-800">{asg.total_marks}</Text>
                  </Text>

                  {userRole === 'student' && (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={isSubmitted}
                      onPress={() => setSelectedAsgId(asg.id)}
                      className={`px-3 py-1.5 rounded-xl ${
                        isSubmitted ? 'bg-emerald-50 border border-emerald-200' : 'bg-blue-600 shadow-xs'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isSubmitted ? 'text-emerald-700' : 'text-white'
                        }`}
                      >
                        {isSubmitted ? 'Submitted ✓' : 'Submit Work'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {(userRole === 'teacher' || userRole === 'admin') && (
                    <Badge label={`Assigned by ${asg.created_by}`} variant="info" />
                  )}
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {/* TAB 2: SUBMISSIONS */}
      {activeTab === 'submitted' && (
        <View className="gap-2.5">
          {submissions.map((sub) => (
            <Card key={sub.id} elevation="lowest" className="gap-2.5">
              <View className="flex-row items-start justify-between">
                <View>
                  <View className="flex-row items-center gap-1.5 mb-0.5">
                    <Badge
                      label={sub.status === 'graded' ? 'Graded' : 'Pending Review'}
                      variant={sub.status === 'graded' ? 'success' : 'warning'}
                    />
                    <Text className="text-[11px] text-on-surface-variant">{sub.roll_number}</Text>
                  </View>
                  <Text className="text-sm font-bold text-on-surface">{sub.student_name}</Text>
                </View>

                {sub.marks_obtained !== undefined && (
                  <View className="items-end">
                    <Text className="text-base font-bold text-on-tertiary-container">
                      {sub.marks_obtained} / 100
                    </Text>
                    <Text className="text-[11px] text-on-surface-variant">Score</Text>
                  </View>
                )}
              </View>

              <Text className="text-xs text-on-surface-variant bg-surface-container-low p-2 rounded-lg">
                "{sub.submission_text}"
              </Text>

              {sub.file_name && (
                <View className="flex-row items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <View className="flex-row items-center gap-1.5 flex-1 min-w-0 pr-2">
                    <FileText size={14} color="#2563EB" />
                    <Text className="text-xs font-semibold text-slate-800" numberOfLines={1}>
                      {sub.file_name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      generateAndSharePDF({
                        id: sub.id,
                        title: `${sub.student_name} - ${sub.file_name}`,
                        subtitle: `Coursework Submission • Roll: ${sub.roll_number}`,
                        subject: 'Physics',
                        author: sub.student_name,
                        category: 'dpp',
                        date: sub.submitted_at_formatted || 'Recently',
                        sections: [
                          {
                            heading: 'Student Submission Notes & Solution Work',
                            items: [
                              sub.submission_text || 'Submitted homework solution sheet.',
                              `Submission ID: ${sub.id}`,
                              `Status: ${sub.status === 'graded' ? `Graded (${sub.marks_obtained}/100)` : 'Pending Faculty Review'}`,
                              sub.feedback ? `Faculty Feedback: ${sub.feedback}` : 'No instructor notes yet.',
                            ],
                          },
                        ],
                      })
                    }
                    className="bg-blue-600 px-2.5 py-1 rounded-lg flex-row items-center gap-1 active:scale-95 shadow-xs"
                  >
                    <Download size={11} color="#ffffff" />
                    <Text className="text-[10px] font-bold text-white">Open File</Text>
                  </TouchableOpacity>
                </View>
              )}

              {sub.feedback && (
                <View className="p-2 rounded-lg bg-tertiary-fixed/30 flex-row items-center gap-1.5">
                  <Award size={14} color="#069669" />
                  <Text className="text-xs text-on-tertiary-container font-medium">
                    Faculty Feedback: {sub.feedback}
                  </Text>
                </View>
              )}

              {(userRole === 'teacher' || userRole === 'admin') && sub.status !== 'graded' && (
                <Button
                  size="sm"
                  variant="secondary"
                  title="Review & Grade"
                  fullWidth
                  onPress={() => setGradingSubId(sub.id)}
                />
              )}
            </Card>
          ))}
        </View>
      )}

      {/* MODAL 1: CREATE ASSIGNMENT */}
      <Modal visible={isCreateOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface rounded-t-3xl p-5 gap-3 max-h-[85%]">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-on-surface">Create Batch Assignment</Text>
              <Pressable onPress={() => setIsCreateOpen(false)}>
                <X size={20} color="#0b1c30" />
              </Pressable>
            </View>

            <Input
              label="Assignment Title"
              placeholder="e.g. Kinematics Daily Practice Problem #05"
              value={asgTitle}
              onChangeText={setAsgTitle}
            />

            <Input
              label="Subject Domain"
              placeholder="Physics / Chemistry / Mathematics"
              value={asgSubject}
              onChangeText={setAsgSubject}
            />

            <Input
              label="Instructions & Focus Topics"
              placeholder="e.g. Complete questions 1 to 30. Show diagrams for problem 12."
              value={asgInstructions}
              onChangeText={setAsgInstructions}
              multiline
              numberOfLines={3}
            />

            <Input
              label="Total Marks"
              placeholder="100"
              keyboardType="numeric"
              value={asgMarks}
              onChangeText={setAsgMarks}
            />

            <Button
              variant="primary"
              title="Publish Assignment"
              fullWidth
              onPress={handleCreateAssignment}
            />
          </View>
        </View>
      </Modal>

      {/* MODAL 2: SUBMIT WORK */}
      <Modal visible={Boolean(selectedAsgId)} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface rounded-t-3xl p-5 gap-3 max-h-[85%]">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-on-surface">Submit Assignment Work</Text>
              <Pressable onPress={() => setSelectedAsgId(null)}>
                <X size={20} color="#0b1c30" />
              </Pressable>
            </View>

            <Input
              label="Submission Notes / Steps"
              placeholder="Brief summary of derivations, steps or attached solution sheets"
              value={solutionNotes}
              onChangeText={setSolutionNotes}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              onPress={handlePickSolutionDocument}
              activeOpacity={0.8}
              className="bg-cute-peach-light border border-cute-peach p-3 rounded-2xl flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-2">
                <FileCheck size={18} color="#ff7d6b" />
                <View>
                  <Text className="text-xs font-bold text-cute-cocoa">{pickedFileName}</Text>
                  <Text className="text-[10px] text-cute-muted">Tap to pick another PDF or photo</Text>
                </View>
              </View>
              <Badge label="Pick File 📄" variant="primary" />
            </TouchableOpacity>

            <Button
              variant="primary"
              title="Confirm & Submit Solution"
              fullWidth
              onPress={handleSubmitSolution}
            />
          </View>
        </View>
      </Modal>

      {/* MODAL 3: GRADE SUBMISSION */}
      <Modal visible={Boolean(gradingSubId)} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface rounded-t-3xl p-5 gap-3 max-h-[85%]">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-on-surface">Grade Student Submission</Text>
              <Pressable onPress={() => setGradingSubId(null)}>
                <X size={20} color="#0b1c30" />
              </Pressable>
            </View>

            <Input
              label="Marks Awarded (out of 100)"
              placeholder="e.g. 95"
              keyboardType="numeric"
              value={gradeMarks}
              onChangeText={setGradeMarks}
            />

            <Input
              label="Faculty Feedback & Remark"
              placeholder="e.g. Great technique. Revise question 14 formula."
              value={gradeFeedback}
              onChangeText={setGradeFeedback}
              multiline
              numberOfLines={3}
            />

            <Button
              variant="primary"
              title="Publish Grade & Notify Student"
              fullWidth
              onPress={handleGrade}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};
