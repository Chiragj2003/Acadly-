import { create } from 'zustand';

interface ModalState {
  isCreateBatchOpen: boolean;
  isScheduleEditorOpen: boolean;
  isMarksEntryOpen: boolean;
  isLinkChildOpen: boolean;
  isAttendanceCorrectionOpen: boolean;
  selectedCorrectionAttendanceId: string | null;

  setCreateBatchOpen: (open: boolean) => void;
  setScheduleEditorOpen: (open: boolean) => void;
  setMarksEntryOpen: (open: boolean) => void;
  setLinkChildOpen: (open: boolean) => void;
  setAttendanceCorrectionOpen: (open: boolean, attendanceId?: string | null) => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isCreateBatchOpen: false,
  isScheduleEditorOpen: false,
  isMarksEntryOpen: false,
  isLinkChildOpen: false,
  isAttendanceCorrectionOpen: false,
  selectedCorrectionAttendanceId: null,

  setCreateBatchOpen: (open) => set({ isCreateBatchOpen: open }),
  setScheduleEditorOpen: (open) => set({ isScheduleEditorOpen: open }),
  setMarksEntryOpen: (open) => set({ isMarksEntryOpen: open }),
  setLinkChildOpen: (open) => set({ isLinkChildOpen: open }),
  setAttendanceCorrectionOpen: (open, attendanceId = null) =>
    set({
      isAttendanceCorrectionOpen: open,
      selectedCorrectionAttendanceId: attendanceId,
    }),
}));
