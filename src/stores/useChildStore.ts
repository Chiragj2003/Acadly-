import { create } from 'zustand';

export interface ChildStudent {
  id: string;
  admission_number: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  batch_id?: string;
  batch_name?: string;
  grade?: string;
  parent_code?: string;
  emoji?: string;
}

interface ChildState {
  selectedChild: ChildStudent | null;
  childrenList: ChildStudent[];
  isLoading: boolean;
  error: string | null;
  setSelectedChild: (child: ChildStudent | null) => void;
  selectChildById: (studentId: string) => void;
  setChildrenList: (list: ChildStudent[]) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (err: string | null) => void;
  reset: () => void;
}

export const useChildStore = create<ChildState>((set) => ({
  selectedChild: null,
  childrenList: [],
  isLoading: false,
  error: null,
  setSelectedChild: (child) => set({ selectedChild: child }),
  selectChildById: (studentId) =>
    set((state) => {
      const found = state.childrenList.find((c) => c.id === studentId);
      return { selectedChild: found || state.selectedChild };
    }),
  setChildrenList: (list) =>
    set({
      childrenList: list,
      selectedChild: list.length > 0 ? list[0] : null,
      error: null,
    }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (err) => set({ error: err }),
  reset: () => set({ selectedChild: null, childrenList: [], isLoading: false, error: null }),
}));
