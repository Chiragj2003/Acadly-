import { create } from 'zustand';

interface BatchState {
  selectedBatchId: string | null;
  setSelectedBatchId: (batchId: string | null) => void;
}

export const useBatchStore = create<BatchState>((set) => ({
  selectedBatchId: null,
  setSelectedBatchId: (batchId) => set({ selectedBatchId: batchId }),
}));
