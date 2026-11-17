import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FileQuestion, Plus, FileText, Video, Award } from 'lucide-react-native';
import { Badge } from '@/components/ui';
import { AssignmentsModule, StudyMaterialsViewer } from '@/components/academic';
import { DUMMY_PDF_CATALOG, type PDFDocumentContent } from '@/services/dummyPdfService';
import { type Assignment, type Submission } from '@/types/database';

interface TeacherPublishTabProps {
  submissions: Submission[];
  assignments: Assignment[];
  onOpenInteractiveDpp: () => void;
  onOpenUploadPdf: () => void;
  onOpenCreateAssignment: () => void;
  onOpenAddLecture: () => void;
  onSelectReaderDoc: (doc: PDFDocumentContent) => void;
  onOpenGrading: (submission: Submission) => void;
}

export const TeacherPublishTab: React.FC<TeacherPublishTabProps> = ({
  submissions,
  assignments,
  onOpenInteractiveDpp,
  onOpenUploadPdf,
  onOpenCreateAssignment,
  onOpenAddLecture,
  onSelectReaderDoc,
  onOpenGrading,
}) => {
  const pendingCount = submissions.filter((s) => s.status === 'submitted').length;

  return (
    <View className="gap-3.5">
      {/* Interactive DPP Builder Featured Card */}
      <View className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-3xl shadow-xs">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-xl bg-white/20 items-center justify-center">
              <FileQuestion size={18} color="#ffffff" />
            </View>
            <View>
              <Text className="text-sm font-display text-white">
                In-App Interactive DPP & Quiz Builder
              </Text>
              <Text className="text-[11px] text-blue-100">
                Create forms like Google Forms inside Acadly
              </Text>
            </View>
          </View>
          <View className="bg-white/20 px-2 py-0.5 rounded-full">
            <Text className="text-[10px] font-sans-bold text-white">MCQ & T/F</Text>
          </View>
        </View>
        <Text className="text-xs text-blue-50/90 leading-relaxed mb-3">
          Craft questions with multi-choice options, correct answers key, true/false, and short answer with instant marking.
        </Text>
        <TouchableOpacity
          onPress={onOpenInteractiveDpp}
          className="bg-white py-2.5 px-4 rounded-2xl items-center flex-row justify-center gap-2 shadow-xs active:scale-98"
        >
          <Plus size={16} color="#1C1C1E" />
          <Text className="text-xs font-display text-blue-600">
            Create In-App Interactive DPP →
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Upload Buttons */}
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={onOpenUploadPdf}
          className="flex-1 bg-white border border-slate-200/90 p-3.5 rounded-2xl items-center gap-2 shadow-xs active:scale-98"
        >
          <View className="w-9 h-9 rounded-xl bg-emerald-50 items-center justify-center">
            <FileText size={18} color="#059669" />
          </View>
          <Text className="text-xs font-sans-bold text-slate-800">+ Upload PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOpenCreateAssignment}
          className="flex-1 bg-white border border-slate-200/90 p-3.5 rounded-2xl items-center gap-2 shadow-xs active:scale-98"
        >
          <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center">
            <Plus size={18} color="#1C1C1E" />
          </View>
          <Text className="text-xs font-sans-bold text-slate-800">+ Offline DPP</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOpenAddLecture}
          className="flex-1 bg-white border border-slate-200/90 p-3.5 rounded-2xl items-center gap-2 shadow-xs active:scale-98"
        >
          <View className="w-9 h-9 rounded-xl bg-rose-50 items-center justify-center">
            <Video size={18} color="#e11d48" />
          </View>
          <Text className="text-xs font-sans-bold text-slate-800">+ Video Class</Text>
        </TouchableOpacity>
      </View>

      {/* Submissions Review & Grading Module */}
      <View className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Award size={16} color="#1C1C1E" />
            <Text className="text-sm font-sans-bold text-slate-900">Student Homework Submissions</Text>
          </View>
          <Badge label={`${pendingCount} Pending`} variant="warning" />
        </View>

        <View className="gap-2.5">
          {submissions.map((sub) => {
            const assignment = assignments.find((a) => a.id === sub.assignment_id);
            const isGraded = sub.status === 'graded';
            return (
              <View
                key={sub.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex-row items-center justify-between"
              >
                <View className="flex-1 pr-2">
                  <View className="flex-row items-center gap-2 mb-0.5">
                    <Text className="text-xs font-sans-bold text-slate-900">{sub.student_name}</Text>
                    <View
                      className={`px-2 py-0.5 rounded-md ${
                        isGraded ? 'bg-emerald-100' : 'bg-amber-100'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-sans-bold ${
                          isGraded ? 'text-emerald-800' : 'text-amber-800'
                        }`}
                      >
                        {isGraded
                          ? `${sub.marks_obtained}/${assignment?.max_marks || 25} Marks`
                          : 'Pending Review'}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-[11px] text-slate-600 font-sans" numberOfLines={1}>
                    {assignment?.title || 'Mechanics DPP 04'}
                  </Text>

                  {/* In-App Document Preview Button */}
                  <TouchableOpacity
                    onPress={() => {
                      const match =
                        DUMMY_PDF_CATALOG.find((d) =>
                          d.subject
                            .toLowerCase()
                            .includes(assignment?.subject?.toLowerCase() || 'physics')
                        ) || DUMMY_PDF_CATALOG[0];
                      onSelectReaderDoc(match);
                    }}
                    className="flex-row items-center gap-1.5 mt-1.5 self-start bg-blue-50 px-2 py-1 rounded-lg border border-blue-200/60 active:scale-95"
                  >
                    <FileText size={11} color="#1C1C1E" />
                    <Text className="text-[10px] font-sans-semibold text-blue-700" numberOfLines={1}>
                      Open & Review: {sub.file_name || 'handwritten_solution.pdf'} ↗
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => onOpenGrading(sub)}
                  className={`px-3 py-1.5 rounded-xl border ${
                    isGraded ? 'bg-white border-slate-200' : 'bg-blue-600 border-blue-600'
                  } active:scale-95`}
                >
                  <Text className={`text-xs font-sans-bold ${isGraded ? 'text-slate-700' : 'text-white'}`}>
                    {isGraded ? 'Re-grade' : 'Grade ✍️'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>

      {/* Assignments & Study Notes Modules */}
      <AssignmentsModule />
      <StudyMaterialsViewer />
    </View>
  );
};
