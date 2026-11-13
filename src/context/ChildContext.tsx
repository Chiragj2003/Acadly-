import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth, useInstitute } from './AuthContext';
import { useChildStore, type ChildStudent } from '@/stores/useChildStore';

export { type ChildStudent } from '@/stores/useChildStore';

interface ChildContextType {
  selectedChild: ChildStudent | null;
  childrenList: ChildStudent[];
  selectChild: (studentId: string) => void;
  addChildByCodeOrPhone: (codeOrPhone: string) => Promise<{ success: boolean; child?: ChildStudent; error?: string }>;
  isLoading: boolean;
  refreshChildren: () => Promise<void>;
  error: string | null;
}

const ChildContext = createContext<ChildContextType | undefined>(undefined);

export const ChildProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { currentInstitute } = useInstitute();

  const {
    selectedChild,
    childrenList,
    isLoading,
    error,
    setSelectedChild,
    selectChildById,
    setChildrenList,
    setIsLoading,
    setError,
    reset,
  } = useChildStore();

  const fetchChildren = useCallback(async () => {
    if (!user || !currentInstitute) {
      reset();
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error('Timeout querying linked children') }), 3500)
      );

      const parentRecordPromise = supabase
        .from('parents')
        .select('id')
        .eq('institute_id', currentInstitute.id)
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: parentRecord, error: parentError } = await Promise.race([
        parentRecordPromise,
        timeoutPromise,
      ]);

      if (parentError || !parentRecord) {
        if (parentError) setError(parentError.message);
        setChildrenList([]);
        return;
      }

      const mappingsPromise = supabase
        .from('parent_students')
        .select(`
          student_id,
          students (
            id,
            admission_number,
            user_id,
            profiles (
              full_name,
              avatar_url
            ),
            batch_students (
              batches (
                name
              )
            )
          )
        `)
        .eq('parent_id', parentRecord.id);

      const { data: mappings, error: mapError } = await Promise.race([
        mappingsPromise,
        timeoutPromise,
      ]);

      if (mapError || !mappings || mappings.length === 0) {
        if (mapError) setError(mapError.message);
        setChildrenList([]);
        return;
      }

      interface MappingItem {
        student_id: string;
        students?: {
          id: string;
          admission_number?: string;
          user_id: string;
          profiles?: {
            full_name?: string;
            avatar_url?: string;
          } | null;
          batch_students?: {
            batches?: {
              name?: string;
            } | null;
          }[] | null;
        } | null;
      }

      const list: ChildStudent[] = (mappings as unknown as MappingItem[]).map((m) => {
        const s = m.students;
        const batchName = s?.batch_students?.[0]?.batches?.name || 'Class 12 • JEE Advanced (Morning)';
        return {
          id: s?.id || m.student_id,
          admission_number: s?.admission_number || 'ADM-2026-088',
          user_id: s?.user_id || '',
          full_name: s?.profiles?.full_name || 'Enrolled Student',
          avatar_url: s?.profiles?.avatar_url || undefined,
          batch_name: batchName,
          grade: 'Class 12',
          parent_code: 'STU-LINK-CODE',
          emoji: '🎓',
        };
      });

      setChildrenList(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching children';
      setError(msg);
      setChildrenList([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, currentInstitute, reset, setChildrenList, setError, setIsLoading]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const selectChild = (studentId: string) => {
    selectChildById(studentId);
  };

  const addChildByCodeOrPhone = async (
    codeOrPhone: string
  ): Promise<{ success: boolean; child?: ChildStudent; error?: string }> => {
    const clean = codeOrPhone.trim().toUpperCase();
    if (!clean) {
      return { success: false, error: 'Please enter a Student Parent Link Code or Phone Number' };
    }

    if (!user) {
      return { success: false, error: 'User is not authenticated' };
    }

    try {
      // Execute atomic SECURITY DEFINER RPC to verify student code, link parent & notify student
      const { data: rpcData, error: rpcError } = await supabase.rpc('request_parent_child_link', {
        p_student_code: clean,
        p_relationship: 'Parent',
      });

      if (rpcError) {
        return {
          success: false,
          error: rpcError.message || `No registered student found for code "${clean}". Please verify the code with your student or school.`,
        };
      }

      // Re-fetch mapped children
      await fetchChildren();

      // Find linked child
      const linkedStudentId = (rpcData as any)?.student_id;
      const linkedChild = childrenList.find((c) => c.id === linkedStudentId) || {
        id: linkedStudentId || 'student-linked',
        admission_number: 'ADM-LINKED',
        user_id: '',
        full_name: 'Linked Student',
        batch_name: 'Enrolled Batch',
        grade: 'Class 12',
        parent_code: clean,
        emoji: '🎓',
      };

      setSelectedChild(linkedChild);
      return { success: true, child: linkedChild };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to link child';
      return { success: false, error: msg };
    }
  };

  return (
    <ChildContext.Provider
      value={{
        selectedChild,
        childrenList,
        selectChild,
        addChildByCodeOrPhone,
        isLoading,
        refreshChildren: fetchChildren,
        error,
      }}
    >
      {children}
    </ChildContext.Provider>
  );
};

export const useChild = (): ChildContextType => {
  const context = useContext(ChildContext);
  if (!context) {
    throw new Error('useChild must be used within a ChildProvider');
  }
  return context;
};
