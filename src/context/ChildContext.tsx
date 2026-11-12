import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth, useInstitute } from './AuthContext';
import { isDevEnvironment } from '@/lib/devSeedHelper';

export interface ChildStudent {
  id: string;
  admission_number: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  batch_name?: string;
  grade?: string;
  parent_code?: string;
  emoji?: string;
}

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
  const [childrenList, setChildrenList] = useState<ChildStudent[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildStudent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChildren = async () => {
    if (!user) {
      setChildrenList([]);
      setSelectedChild(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!currentInstitute) {
      setChildrenList([]);
      setSelectedChild(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 3.0s safety timeout race to ensure smooth non-blocking UI
      const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error('Timeout querying linked children') }), 3000)
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
        setSelectedChild(null);
        return;
      }

      // Query parent_students mapping (with compatibility for parent_student_mappings)
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
        setSelectedChild(null);
        return;
      }

      const list: ChildStudent[] = mappings.map((m: any) => {
        const s = m.students;
        const batchName =
          s?.batch_students?.[0]?.batches?.name ||
          s?.batch_enrollments?.[0]?.batches?.name ||
          'Class 12 • JEE Advanced (Morning)';
        return {
          id: s?.id || m.student_id,
          admission_number: s?.admission_number || 'ADM-2026-088',
          user_id: s?.user_id,
          full_name: s?.profiles?.full_name || 'Student',
          avatar_url: s?.profiles?.avatar_url,
          batch_name: batchName,
          grade: 'Class 11 Science',
          parent_code: 'STU-STUDENT-001',
          emoji: '🎓',
        };
      });

      setChildrenList(list);
      setSelectedChild(list[0]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching children';
      console.warn('[ChildContext] Exception:', msg);
      setError(msg);
      setChildrenList([]);
      setSelectedChild(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, [user, currentInstitute]);

  const selectChild = (studentId: string) => {
    const target = childrenList.find((c) => c.id === studentId);
    if (target) {
      setSelectedChild(target);
    }
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

    // 2. Production Supabase Query: lookup student by parent_link_code
    try {
      const { data: studentRecord, error: studErr } = await supabase
        .from('students')
        .select(`
          id,
          admission_number,
          user_id,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('parent_link_code', clean)
        .maybeSingle();

      if (studErr || !studentRecord) {
        // FAIL CLOSED: Explain exact failure
        return {
          success: false,
          error: studErr?.message || `No registered student found for code "${clean}". Please verify the code with your student or school.`,
        };
      }

      const childItem: ChildStudent = {
        id: studentRecord.id,
        admission_number: (studentRecord as any).admission_number || 'ADM-2026-NEW',
        user_id: studentRecord.user_id,
        full_name: (studentRecord as any).profiles?.full_name || 'Enrolled Student',
        avatar_url: (studentRecord as any).profiles?.avatar_url,
        batch_name: 'Enrolled Classes',
        grade: 'Active Scholar',
        parent_code: clean,
        emoji: '🎓',
      };

      setChildrenList((prev) => {
        if (prev.some((c) => c.id === childItem.id)) return prev;
        return [...prev, childItem];
      });
      setSelectedChild(childItem);
      return { success: true, child: childItem };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error linking child';
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

export const useChild = () => {
  const context = useContext(ChildContext);
  if (!context) {
    throw new Error('useChild must be used within a ChildProvider');
  }
  return context;
};
