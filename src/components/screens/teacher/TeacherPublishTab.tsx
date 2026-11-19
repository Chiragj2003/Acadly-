import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ListChecks, FileText, BookOpen, Video, ChartLine, ChevronRight, Paperclip } from 'lucide-react-native';
import { AssignmentsModule, StudyMaterialsViewer } from '@/components/academic';
import { DisplayTitle, Eyebrow, ListEmptyState, SectionTitle } from '@/components/ui';
import { type PDFDocumentContent } from '@/services/dummyPdfService';
import { openSubmissionFile } from '@/lib/openStudyMaterial';
import { type Assignment, type Submission } from '@/types/database';

interface TeacherPublishTabProps {
  batchName?: string;
  submissions: Submission[];
  assignments: Assignment[];
  onOpenInteractiveDpp: () => void;
  onOpenUploadPdf: () => void;
  onOpenCreateAssignment: () => void;
  onOpenAddLecture: () => void;
  onOpenMarksEntry?: () => void;
  /** Kept for API compatibility; submissions now open their real uploaded file. */
  onSelectReaderDoc?: (doc: PDFDocumentContent) => void;
  onOpenGrading: (submission: Submission) => void;
}

const KINDS = [
  { key: 'mcq', title: 'MCQ test', desc: 'Auto-graded DPP or quiz', bg: 'bg-pastel-sky', Icon: ListChecks },
  { key: 'homework', title: 'Homework', desc: 'Students upload a photo or PDF', bg: 'bg-pastel-lilac', Icon: FileText },
  { key: 'notes', title: 'Notes', desc: 'A PDF for everyone’s Library', bg: 'bg-pastel-mint', Icon: BookOpen },
  { key: 'video', title: 'Video', desc: 'Paste a YouTube link', bg: 'bg-pastel-pink', Icon: Video },
] as const;

/** Soft Desk "Publish": what are you sharing, then the grading inbox. */
export const TeacherPublishTab: React.FC<TeacherPublishTabProps> = ({
  batchName,
  submissions,
  assignments,
  onOpenInteractiveDpp,
  onOpenUploadPdf,
  onOpenCreateAssignment,
  onOpenAddLecture,
  onOpenMarksEntry,
  onOpenGrading,
}) => {
  const actions: Record<(typeof KINDS)[number]['key'], () => void> = {
    mcq: onOpenInteractiveDpp,
    homework: onOpenCreateAssignment,
    notes: onOpenUploadPdf,
    video: onOpenAddLecture,
  };
  const pending = submissions.filter((s) => s.status !== 'graded');
  const graded = submissions.filter((s) => s.status === 'graded');

  return (
    <View className="gap-5">
      <View className="gap-1">
        {batchName ? <Eyebrow center>{batchName}</Eyebrow> : null}
        <DisplayTitle center>What are you{'\n'}sharing today?</DisplayTitle>
      </View>

      <View className="flex-row flex-wrap gap-3">
        {KINDS.map(({ key, title, desc, bg, Icon }) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={`${title}. ${desc}`}
            onPress={actions[key]}
            className={`basis-[47%] grow h-[150px] rounded-[26px] p-4 justify-between active:opacity-90 ${bg}`}
          >
            <View className="w-11 h-11 rounded-full bg-white items-center justify-center">
              <Icon size={22} color="#1C1C1E" />
            </View>
            <View className="gap-0.5">
              <Text className="font-display text-ink text-lg">{title}</Text>
              <Text className="font-sans text-slate-700 text-xs leading-4">{desc}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {onOpenMarksEntry ? (
        <Pressable
          accessibilityRole="button"
          onPress={onOpenMarksEntry}
          className="bg-white rounded-3xl px-4 py-3.5 flex-row items-center gap-3.5 active:opacity-90"
        >
          <View className="w-11 h-11 rounded-full bg-pastel-butter items-center justify-center">
            <ChartLine size={20} color="#1C1C1E" />
          </View>
          <View className="flex-1">
            <Text className="font-sans-bold text-ink text-[15px]">Marks from a paper test</Text>
            <Text className="font-sans text-muted text-xs">Type scores for an offline exam</Text>
          </View>
          <ChevronRight size={18} color="#8C877E" />
        </Pressable>
      ) : null}

      <View className="gap-3">
        <SectionTitle>To grade · {pending.length}</SectionTitle>
        {submissions.length === 0 ? (
          <ListEmptyState title="Nothing to grade" message="Student submissions for this batch show up here." />
        ) : (
          <View className="bg-white rounded-3xl px-4 py-1">
            {[...pending, ...graded].map((sub, i, all) => {
              const assignment = assignments.find((a) => a.id === sub.assignment_id);
              const isGraded = sub.status === 'graded';
              const max = assignment?.total_marks ?? assignment?.max_marks;
              return (
                <View key={sub.id} className={`flex-row items-center gap-3 py-3 ${i === all.length - 1 ? '' : 'border-b border-hairline'}`}>
                  <View className="flex-1 min-w-0 gap-0.5">
                    <Text className="font-sans-bold text-ink text-[15px]" numberOfLines={1}>
                      {sub.student_name}
                    </Text>
                    <Text className="font-sans text-muted text-xs" numberOfLines={1}>
                      {[assignment?.title, isGraded ? `${sub.marks_obtained ?? sub.score}${max ? `/${max}` : ''} marks` : 'Waiting for you']
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                    {sub.file_url ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Open ${sub.student_name}'s answer sheet`}
                        onPress={() => openSubmissionFile(sub.file_url)}
                        className="self-start mt-1 h-8 px-3 rounded-full bg-paper flex-row items-center gap-1.5"
                      >
                        <Paperclip size={13} color="#1C1C1E" />
                        <Text className="font-sans-semibold text-ink text-xs" numberOfLines={1}>
                          {sub.file_name || 'Answer sheet'}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => onOpenGrading(sub)}
                    className={`h-10 px-4 rounded-full justify-center ${isGraded ? 'bg-paper' : 'bg-ink'}`}
                  >
                    <Text className={`font-sans-bold text-sm ${isGraded ? 'text-ink' : 'text-white'}`}>{isGraded ? 'Re-grade' : 'Grade'}</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <AssignmentsModule />
      <StudyMaterialsViewer />
    </View>
  );
};
