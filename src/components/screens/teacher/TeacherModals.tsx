import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { X, Check, FileText } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { type Student360Profile } from '@/types/database';

// 1. Dual Mode Modal
interface DualModeModalProps {
  visible: boolean;
  onClose: () => void;
  teacherMode: 'solo' | 'coaching_faculty';
  linkedCoachingCode?: string;
  onSelectSolo: () => void;
  onLinkCoaching: (code: string) => Promise<{ success: boolean; instituteName?: string; error?: string }>;
}

export const DualModeModal: React.FC<DualModeModalProps> = ({
  visible,
  onClose,
  teacherMode,
  linkedCoachingCode,
  onSelectSolo,
  onLinkCoaching,
}) => {
  const [code, setCode] = useState(linkedCoachingCode || 'BLOOM2026');

  const handleLink = async () => {
    if (!code.trim()) {
      Alert.alert('Validation Error', 'Please enter a Coaching Invite Code.');
      return;
    }
    const res = await onLinkCoaching(code);
    if (res.success) {
      onClose();
      Alert.alert('Coaching Linked', `Connected as faculty to ${res.instituteName}`);
    } else {
      Alert.alert('Not Found', res.error || 'Could not verify that coaching code.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="bg-white rounded-t-3xl p-6 gap-3.5 max-h-[85%] border-t border-slate-200">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-extrabold text-slate-900">Teacher Workspace Mode</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-slate-500 leading-relaxed">
            Choose whether you operate as an independent Solo Tutor with direct student fees or connect to a Multi-Teacher Coaching Center.
          </Text>

          <TouchableOpacity
            onPress={() => {
              onSelectSolo();
              onClose();
              Alert.alert('Solo Mode Enabled', 'Operating as an Independent Tutor with your Teacher Code.');
            }}
            className={`p-4 rounded-2xl border-2 ${
              teacherMode === 'solo' ? 'bg-blue-50 border-blue-600' : 'bg-slate-50 border-slate-200'
            } flex-row items-center justify-between`}
          >
            <View className="flex-1 pr-2">
              <Text className="text-sm font-bold text-slate-900">Solo Tutor Mode</Text>
              <Text className="text-xs text-slate-500 mt-0.5">
                Direct student enrollment via your unique Teacher Code. Full ownership of schedule & fees.
              </Text>
            </View>
            {teacherMode === 'solo' && <Check size={18} color="#2563EB" />}
          </TouchableOpacity>

          <View
            className={`p-4 rounded-2xl border-2 ${
              teacherMode === 'coaching_faculty' ? 'bg-blue-50 border-blue-600' : 'bg-slate-50 border-slate-200'
            } gap-2.5`}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-bold text-slate-900">Coaching Center Faculty</Text>
              {teacherMode === 'coaching_faculty' && <Check size={18} color="#2563EB" />}
            </View>
            <Text className="text-xs text-slate-500">
              Link to an existing Coaching Center / Institute Admin using their Invite Code.
            </Text>
            <TextInput
              placeholder="Enter Coaching Code (e.g. BLOOM2026)"
              placeholderTextColor="#94a3b8"
              value={code}
              onChangeText={setCode}
              className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-bold"
            />
            <TouchableOpacity
              onPress={handleLink}
              className="bg-blue-600 py-2.5 rounded-xl items-center active:scale-98"
            >
              <Text className="text-xs font-bold text-white">Verify & Link Coaching Center</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// 2. Upload PDF Modal
interface UploadPdfModalProps {
  visible: boolean;
  onClose: () => void;
  onUpload: (data: {
    title: string;
    subject: string;
    category: 'notes' | 'formula_sheet' | 'pyq' | 'dpp';
    file: { name: string; size?: string; uri?: string };
  }) => Promise<void>;
}

export const UploadPdfModal: React.FC<UploadPdfModalProps> = ({
  visible,
  onClose,
  onUpload,
}) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [category, setCategory] = useState<'notes' | 'formula_sheet' | 'pyq' | 'dpp'>('notes');
  const [file, setFile] = useState<{ name: string; size?: string; uri?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePick = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const picked = res.assets[0];
        const sizeMb = picked.size ? `${(picked.size / (1024 * 1024)).toFixed(1)} MB` : '1.8 MB';
        setFile({ name: picked.name, size: sizeMb, uri: picked.uri });
        if (!title.trim()) {
          setTitle(picked.name.replace('.pdf', '').replace(/_/g, ' '));
        }
      }
    } catch {
      Alert.alert('Picker Error', 'Could not access documents.');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title for the study document.');
      return;
    }
    if (!file?.uri) {
      Alert.alert('Required', 'Please select a PDF document to upload.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onUpload({ title, subject, category, file });
      onClose();
      setTitle('');
      setFile(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      Alert.alert('Upload Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="bg-white rounded-t-3xl p-6 gap-3 max-h-[85%] border-t border-slate-200">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-extrabold text-slate-900">Upload PDF Study Material</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} className="gap-3" contentContainerStyle={{ paddingBottom: 60 }}>
            <View>
              <Text className="text-xs font-bold text-slate-700 mb-1">Document Title</Text>
              <TextInput
                placeholder="e.g. Rotational Mechanics Master Formula Sheet"
                placeholderTextColor="#94a3b8"
                value={title}
                onChangeText={setTitle}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-medium"
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-700 mb-1">Subject</Text>
              <View className="flex-row flex-wrap gap-1.5">
                {['Physics', 'Chemistry', 'Mathematics', 'Biology'].map((sub) => (
                  <TouchableOpacity
                    key={sub}
                    onPress={() => setSubject(sub)}
                    className={`px-3 py-1.5 rounded-xl border ${
                      subject === sub ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text className={`text-[11px] font-bold ${subject === sub ? 'text-white' : 'text-slate-700'}`}>
                      {sub}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-700 mb-1">Category</Text>
              <View className="flex-row flex-wrap gap-1.5">
                {[
                  { id: 'notes', label: 'Notes 📖' },
                  { id: 'formula_sheet', label: 'Formula Sheet 📐' },
                  { id: 'dpp', label: 'DPP ⚡' },
                  { id: 'pyq', label: 'PYQ 📝' },
                ].map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCategory(cat.id as any)}
                    className={`px-3 py-1.5 rounded-xl border ${
                      category === cat.id ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text className={`text-[10px] font-bold ${category === cat.id ? 'text-white' : 'text-slate-700'}`}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={handlePick}
              className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-2 flex-1 pr-2">
                <FileText size={18} color="#2563EB" />
                <Text className="text-xs font-bold text-slate-800" numberOfLines={1}>
                  {file ? file.name : 'Pick PDF File from Phone'}
                </Text>
              </View>
              <Text className="text-xs font-bold text-blue-600">Browse</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 py-3 rounded-2xl items-center shadow-xs mt-2 mb-4"
            >
              <Text className="text-xs font-bold text-white">
                {isSubmitting ? 'Uploading PDF...' : 'Publish PDF to Batch'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// 3. Exam Marks Modal
interface ExamMarksModalProps {
  visible: boolean;
  onClose: () => void;
  students: Student360Profile[];
  onSave: (examTitle: string, subject: string, maxScore: number, marksList: { studentId: string; score: number }[]) => Promise<void>;
}

export const ExamMarksModal: React.FC<ExamMarksModalProps> = ({
  visible,
  onClose,
  students,
  onSave,
}) => {
  const [testName, setTestName] = useState('Unit Assessment #04 (Mechanics)');
  const [subject, setSubject] = useState('Physics');
  const [maxScore, setMaxScore] = useState('100');
  const [scores, setScores] = useState<Record<string, string>>({});

  const handleSave = async () => {
    if (!testName.trim()) {
      Alert.alert('Required', 'Please enter assessment title.');
      return;
    }
    const max = Math.max(1, parseInt(maxScore, 10) || 100);
    const marksList = students.map((s) => {
      const raw = parseInt(scores[s.id] || '85', 10);
      return {
        studentId: s.id,
        score: isNaN(raw) ? 0 : Math.max(0, Math.min(raw, max)),
      };
    });
    await onSave(testName, subject, max, marksList);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="bg-white rounded-t-3xl p-6 gap-3 max-h-[85%] border-t border-slate-200">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-base font-extrabold text-slate-900">Record Test Marks & Auto-Rank</Text>
              <Text className="text-xs text-slate-500">Computes batch average, topper & ranks</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
            <View className="flex-row gap-2 mb-3">
              <View className="flex-1">
                <Text className="text-[11px] font-bold text-slate-700 mb-1">Test Title</Text>
                <TextInput
                  placeholder="e.g. Unit Mock Test 04"
                  placeholderTextColor="#94a3b8"
                  value={testName}
                  onChangeText={setTestName}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold"
                />
              </View>
              <View className="w-24">
                <Text className="text-[11px] font-bold text-slate-700 mb-1">Max Marks</Text>
                <TextInput
                  placeholder="100"
                  keyboardType="numeric"
                  placeholderTextColor="#94a3b8"
                  value={maxScore}
                  onChangeText={setMaxScore}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold"
                />
              </View>
            </View>

            <Text className="text-xs font-bold text-slate-700 mb-2">
              Enter Student Scores (out of {maxScore}):
            </Text>
            <View className="gap-2 mb-3">
              {students.map((st) => (
                <View
                  key={st.id}
                  className="flex-row items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <View className="flex-1 pr-2">
                    <Text className="text-xs font-bold text-slate-800">{st.name}</Text>
                    <Text className="text-[10px] text-slate-500 font-semibold">{st.rollNumber}</Text>
                  </View>

                  <View className="w-20">
                    <TextInput
                      placeholder="85"
                      keyboardType="numeric"
                      value={scores[st.id] ?? '85'}
                      onChangeText={(val) => setScores((prev) => ({ ...prev, [st.id]: val }))}
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 text-center font-bold"
                    />
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleSave}
              className="bg-blue-600 py-3 rounded-2xl items-center shadow-xs mb-4"
            >
              <Text className="text-xs font-bold text-white">Save Marks & Compute Ranks</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// 4. Grading Modal
interface GradingModalProps {
  visible: boolean;
  onClose: () => void;
  submissionId: string | null;
  initialScore?: number;
  initialFeedback?: string;
  aiScore?: number | null;
  aiFeedback?: string | null;
  aiStatus?: string | null;
  onGrade: (submissionId: string, score: number, feedback: string) => Promise<void>;
}

export const GradingModal: React.FC<GradingModalProps> = ({
  visible,
  onClose,
  submissionId,
  initialScore = 23,
  initialFeedback = 'Well attempted derivation steps.',
  aiScore,
  aiFeedback,
  aiStatus,
  onGrade,
}) => {
  const [score, setScore] = useState(
    aiStatus === 'pending_review' && aiScore !== null && aiScore !== undefined
      ? aiScore.toString()
      : initialScore.toString()
  );
  const [feedback, setFeedback] = useState(
    aiStatus === 'pending_review' && aiFeedback
      ? aiFeedback
      : initialFeedback
  );

  const handleConfirm = async () => {
    if (!submissionId) return;
    const num = Math.max(0, parseInt(score, 10) || 0);
    await onGrade(submissionId, num, feedback);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="bg-white rounded-t-3xl p-6 gap-3.5 max-h-[85%] border-t border-slate-200">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-extrabold text-slate-900">Grade Student Homework</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} className="gap-3.5" contentContainerStyle={{ paddingBottom: 60 }}>
            {/* AI Suggestion Box if available */}
            {aiStatus === 'pending_review' && aiScore !== null && aiScore !== undefined && (
              <View className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-black text-indigo-950">
                    🤖 Gemini Evaluation Suggestion
                  </Text>
                  <Text className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-100">
                    Pending Teacher Review
                  </Text>
                </View>

                <Text className="text-xs text-indigo-900 font-semibold">
                  Suggested Score: <Text className="font-black text-indigo-600">{aiScore} / 25</Text>
                </Text>

                {aiFeedback ? (
                  <Text className="text-[11px] text-indigo-800 italic bg-white/70 p-2 rounded-xl border border-indigo-100">
                    "{aiFeedback}"
                  </Text>
                ) : null}

                <Text className="text-[10px] text-indigo-600">
                  Privacy guaranteed: Zero student PII was shared with AI. Review or edit above inputs before approving.
                </Text>
              </View>
            )}

            <View>
              <Text className="text-xs font-bold text-slate-700 mb-1">Marks Awarded (out of 25)</Text>
              <TextInput
                placeholder="24"
                keyboardType="numeric"
                value={score}
                onChangeText={setScore}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-bold"
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-700 mb-1">Teacher Feedback / Observations</Text>
              <TextInput
                placeholder="Add teacher feedback or step correction..."
                placeholderTextColor="#94a3b8"
                value={feedback}
                onChangeText={setFeedback}
                multiline
                numberOfLines={3}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
              />
            </View>

            <TouchableOpacity
              onPress={handleConfirm}
              className="bg-emerald-600 py-3 rounded-2xl items-center shadow-xs mt-2 mb-4"
            >
              <Text className="text-xs font-bold text-white">Approve Grade & Publish to Student ✅</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// 5. Create Assignment Modal
interface CreateAssignmentModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    subject: string;
    maxMarks: number;
    dueDays: number;
    pdfName?: string;
  }) => Promise<void>;
}

export const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  visible,
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [maxMarks, setMaxMarks] = useState('25');
  const [dueDays, setDueDays] = useState('2');
  const [pdfName, setPdfName] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter assignment title.');
      return;
    }
    await onCreate({
      title,
      subject,
      maxMarks: parseInt(maxMarks, 10) || 25,
      dueDays: parseInt(dueDays, 10) || 2,
      pdfName: pdfName || undefined,
    });
    onClose();
    setTitle('');
    setPdfName(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="bg-white rounded-t-3xl p-6 gap-3 max-h-[85%] border-t border-slate-200">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-extrabold text-slate-900">Create New DPP / Assignment</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} className="gap-3" contentContainerStyle={{ paddingBottom: 60 }}>
            <View>
              <Text className="text-xs font-bold text-slate-700 mb-1">Title</Text>
              <TextInput
                placeholder="e.g. DPP 05: Rotational Torque & Angular Momentum"
                placeholderTextColor="#94a3b8"
                value={title}
                onChangeText={setTitle}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-bold"
              />
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="text-[11px] font-bold text-slate-700 mb-1">Subject</Text>
                <TextInput
                  placeholder="Physics"
                  value={subject}
                  onChangeText={setSubject}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold"
                />
              </View>
              <View className="w-24">
                <Text className="text-[11px] font-bold text-slate-700 mb-1">Max Marks</Text>
                <TextInput
                  placeholder="25"
                  keyboardType="numeric"
                  value={maxMarks}
                  onChangeText={setMaxMarks}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={async () => {
                try {
                  const res = await DocumentPicker.getDocumentAsync({
                    type: 'application/pdf',
                    copyToCacheDirectory: true,
                  });
                  if (!res.canceled && res.assets && res.assets.length > 0) {
                    setPdfName(res.assets[0].name);
                  }
                } catch {
                  Alert.alert('Picker Error', 'Could not open picker.');
                }
              }}
              className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex-row items-center justify-between"
            >
              <Text className="text-xs text-slate-700 font-medium" numberOfLines={1}>
                {pdfName || 'Attach Question Paper PDF (Optional)'}
              </Text>
              <Text className="text-xs font-bold text-blue-600">Pick</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              className="bg-blue-600 py-3 rounded-2xl items-center shadow-xs mt-2 mb-4"
            >
              <Text className="text-xs font-bold text-white">Publish Assignment to Batch</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// 6. Add Lecture Modal
interface AddLectureModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: { title: string; subject: string; videoId: string; duration: number }) => Promise<void>;
}

export const AddLectureModal: React.FC<AddLectureModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [videoId, setVideoId] = useState('');
  const [duration, setDuration] = useState('60');

  const handleSubmit = async () => {
    if (!title.trim() || !videoId.trim()) {
      Alert.alert('Validation Error', 'Title and YouTube Video ID are required.');
      return;
    }
    const cleanId = videoId
      .replace('https://youtu.be/', '')
      .replace('https://www.youtube.com/watch?v=', '');
    await onAdd({
      title,
      subject,
      videoId: cleanId,
      duration: parseInt(duration, 10) || 60,
    });
    onClose();
    setTitle('');
    setVideoId('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="bg-white rounded-t-3xl p-6 gap-3 max-h-[85%] border-t border-slate-200">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-extrabold text-slate-900">Link YouTube Lecture</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} className="gap-3" contentContainerStyle={{ paddingBottom: 60 }}>
            <View>
              <Text className="text-xs font-bold text-slate-700 mb-1">Lecture Title</Text>
              <TextInput
                placeholder="e.g. Kinematics Lecture 08: Projectile Motion"
                placeholderTextColor="#94a3b8"
                value={title}
                onChangeText={setTitle}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-bold"
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-700 mb-1">Subject</Text>
              <TextInput
                placeholder="Physics / Chemistry / Mathematics"
                placeholderTextColor="#94a3b8"
                value={subject}
                onChangeText={setSubject}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-bold"
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-700 mb-1">YouTube Video ID or Unlisted URL</Text>
              <TextInput
                placeholder="e.g. dQw4w9WgXcQ or https://youtu.be/..."
                placeholderTextColor="#94a3b8"
                value={videoId}
                onChangeText={setVideoId}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-bold"
              />
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              className="bg-blue-600 py-3 rounded-2xl items-center shadow-xs mt-2 mb-4"
            >
              <Text className="text-xs font-bold text-white">Publish Video Lecture</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
