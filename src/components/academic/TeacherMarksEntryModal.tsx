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
import { X, Award, CheckCircle2, UserCheck, Calendar, BookOpen } from 'lucide-react-native';
import { useRecordExamMarks } from '@/hooks/queries/useAnalyticsQueries';

export interface StudentMarksEntryItem {
  studentId: string;
  name: string;
  rollNumber: string;
  marksObtained: number;
  isAbsent?: boolean;
  remarks?: string;
}

interface TeacherMarksEntryModalProps {
  visible: boolean;
  onClose: () => void;
  instituteId: string;
  batchId: string;
  batchName: string;
  students: { id: string; name: string; rollNumber: string }[];
  currentUserId?: string;
}

export const TeacherMarksEntryModal: React.FC<TeacherMarksEntryModalProps> = ({
  visible,
  onClose,
  instituteId,
  batchId,
  batchName,
  students,
  currentUserId,
}) => {
  const recordMutation = useRecordExamMarks();

  const [examTitle, setExamTitle] = useState('Unit Test 1');
  const [maxMarks, setMaxMarks] = useState('50');
  const [passingMarks, setPassingMarks] = useState('20');
  const [examDate, setExamDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Scores map: studentId -> string marks
  const [marksMap, setMarksMap] = useState<Record<string, string>>({});
  const [absentMap, setAbsentMap] = useState<Record<string, boolean>>({});
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});

  const handleScoreChange = (studentId: string, val: string) => {
    // Only allow positive numbers
    const clean = val.replace(/[^0-9.]/g, '');
    const num = parseFloat(clean);
    const max = parseFloat(maxMarks) || 100;

    if (!isNaN(num) && num > max) {
      setMarksMap((prev) => ({ ...prev, [studentId]: String(max) }));
      return;
    }

    setMarksMap((prev) => ({ ...prev, [studentId]: clean }));
  };

  const toggleAbsent = (studentId: string) => {
    setAbsentMap((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const handleSave = async () => {
    if (!examTitle.trim()) {
      Alert.alert('Required', 'Please enter an examination title.');
      return;
    }

    const totalMax = parseFloat(maxMarks) || 100;
    const totalPass = parseFloat(passingMarks) || Math.round(totalMax * 0.4);

    const marksPayload = students.map((s) => {
      const isAbsent = Boolean(absentMap[s.id]);
      const score = isAbsent ? 0 : parseFloat(marksMap[s.id] || '0') || 0;
      return {
        studentId: s.id,
        marksObtained: score,
        isAbsent,
        remarks: remarksMap[s.id]?.trim() || undefined,
      };
    });

    try {
      await recordMutation.mutateAsync({
        input: {
          instituteId,
          batchId,
          title: examTitle.trim(),
          examDate,
          maxMarks: totalMax,
          passingMarks: totalPass,
          marks: marksPayload,
        },
        recordedByUserId: currentUserId,
      });

      Alert.alert('Published! 📊', `Results for "${examTitle}" recorded for ${students.length} students.`);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record marks';
      Alert.alert('Error', msg);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/60"
      >
        <View className="bg-white rounded-t-3xl max-h-[90%] p-5 border-t border-slate-200">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
            <View>
              <Text className="text-base font-sans-bold text-slate-900">Record Examination Marks</Text>
              <Text className="text-xs text-slate-500">{batchName}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
            >
              <X size={18} color="#6E6A63" />
            </TouchableOpacity>
          </View>

          <ScrollView className="py-3" keyboardShouldPersistTaps="handled">
            {/* Exam Metadata */}
            <View className="bg-slate-50 p-4 rounded-2xl border border-slate-200 gap-3 mb-4">
              <Text className="text-xs font-sans-bold text-slate-700">Exam Details</Text>

              <View>
                <Text className="text-[11px] font-sans-semibold text-slate-600 mb-1">Title</Text>
                <TextInput
                  value={examTitle}
                  onChangeText={setExamTitle}
                  placeholder="e.g. Mid-Term Physics Exam"
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </View>

              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className="text-[11px] font-sans-semibold text-slate-600 mb-1">Max Marks</Text>
                  <TextInput
                    value={maxMarks}
                    onChangeText={setMaxMarks}
                    keyboardType="numeric"
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[11px] font-sans-semibold text-slate-600 mb-1">Passing Marks</Text>
                  <TextInput
                    value={passingMarks}
                    onChangeText={setPassingMarks}
                    keyboardType="numeric"
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[11px] font-sans-semibold text-slate-600 mb-1">Exam Date</Text>
                  <TextInput
                    value={examDate}
                    onChangeText={setExamDate}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </View>
              </View>
            </View>

            {/* Students Marks Entry Table */}
            <Text className="text-xs font-sans-bold text-slate-700 mb-2">
              Student Marks ({students.length} Enrolled)
            </Text>

            {students.length === 0 ? (
              <View className="p-6 items-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Text className="text-xs text-slate-500">No students enrolled in this batch yet.</Text>
              </View>
            ) : (
              students.map((s, idx) => {
                const isAbsent = Boolean(absentMap[s.id]);
                const score = marksMap[s.id] || '';

                return (
                  <View
                    key={s.id}
                    className="bg-white border border-slate-200 rounded-2xl p-3 mb-2 flex-row items-center justify-between"
                  >
                    <View className="flex-1 mr-3">
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-xs font-sans-bold text-slate-800">{s.name}</Text>
                        <Text className="text-xs text-slate-400">Roll: {s.rollNumber}</Text>
                      </View>
                      <TextInput
                        value={remarksMap[s.id] || ''}
                        onChangeText={(r) => setRemarksMap((prev) => ({ ...prev, [s.id]: r }))}
                        placeholder="Faculty remark / feedback..."
                        className="text-xs text-slate-500 mt-1 py-0.5"
                      />
                    </View>

                    <View className="flex-row items-center gap-2">
                      <TouchableOpacity
                        onPress={() => toggleAbsent(s.id)}
                        className={`px-2 py-1.5 rounded-lg border ${
                          isAbsent
                            ? 'bg-red-500 border-red-500'
                            : 'bg-slate-100 border-slate-200'
                        }`}
                      >
                        <Text
                          className={`text-xs font-sans-bold ${
                            isAbsent ?'text-white' :'text-slate-600'
                          }`}
                        >
                          Absent
                        </Text>
                      </TouchableOpacity>

                      <View className="w-16">
                        <TextInput
                          value={isAbsent ? '0' : score}
                          editable={!isAbsent}
                          onChangeText={(val) => handleScoreChange(s.id, val)}
                          placeholder="0"
                          keyboardType="numeric"
                          className={`text-center font-sans-bold text-xs py-1.5 px-2 rounded-xl border ${
                            isAbsent
                              ? 'bg-slate-100 border-slate-200 text-slate-400'
                              : 'bg-white border-blue-300 text-blue-700'
                          }`}
                        />
                      </View>
                      <Text className="text-[11px] font-sans-bold text-slate-400">/{maxMarks}</Text>
                    </View>
                  </View>
                );
              })
            )}

            <View className="pt-3">
              <TouchableOpacity
                onPress={handleSave}
                disabled={recordMutation.isPending || students.length === 0}
                className={`py-3.5 rounded-2xl items-center ${
                  students.length === 0 ?'bg-slate-300' :'bg-blue-600'
                }`}
              >
                <Text className="text-xs font-sans-bold text-white">
                  {recordMutation.isPending ? 'Publishing Marks...' : 'Publish & Persist Exam Results'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
