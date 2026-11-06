import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useInstitute } from './InstituteContext';

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

const DEFAULT_CHILDREN: ChildStudent[] = [
  {
    id: 'stud-amelia-01',
    admission_number: 'ADM-2026-088',
    user_id: 'usr-student-01',
    full_name: 'Amelia Sharma',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    batch_name: 'Class 12 • JEE Advanced (Morning)',
    grade: 'Class 11 Science',
    parent_code: 'STU-AMELIA-902',
    emoji: '🎓',
  },
  {
    id: 'stud-aarav-02',
    admission_number: 'ADM-2026-104',
    user_id: 'usr-student-02',
    full_name: 'Aarav Sharma',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200',
    batch_name: 'Class 11 • Physics & Calculus Mastery',
    grade: 'Class 12 Advanced',
    parent_code: 'STU-AARAV-104',
    emoji: '📐',
  },
  {
    id: 'stud-rohan-03',
    admission_number: 'ADM-2026-306',
    user_id: 'usr-student-03',
    full_name: 'Rohan Sharma',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    batch_name: 'Class 11 Foundation Batch',
    grade: 'Class 11 Science',
    parent_code: 'STU-ROHAN-306',
    emoji: '⚡',
  },
];

interface ChildContextType {
  selectedChild: ChildStudent | null;
  childrenList: ChildStudent[];
  selectChild: (studentId: string) => void;
  addChildByCodeOrPhone: (codeOrPhone: string) => Promise<{ success: boolean; child?: ChildStudent; error?: string }>;
  isLoading: boolean;
  refreshChildren: () => Promise<void>;
}

const ChildContext = createContext<ChildContextType | undefined>(undefined);

export const ChildProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { currentInstitute } = useInstitute();
  const [childrenList, setChildrenList] = useState<ChildStudent[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildStudent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchChildren = async () => {
    if (!user) {
      setChildrenList([]);
      setSelectedChild(null);
      setIsLoading(false);
      return;
    }

    if (!currentInstitute) {
      setChildrenList(DEFAULT_CHILDREN);
      setSelectedChild(DEFAULT_CHILDREN[0]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // 2.5s safety timeout race to ensure smooth non-blocking UI
      const timeoutPromise = new Promise<{ data: null; error: any }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error('Timeout') }), 2500)
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
        setChildrenList(DEFAULT_CHILDREN);
        setSelectedChild(DEFAULT_CHILDREN[0]);
        return;
      }

      const mappingsPromise = supabase
        .from('parent_student_mappings')
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
            batch_enrollments (
              batches (
                name
              )
            )
          )
        `)
        .eq('parent_id', parentRecord.id)
        .eq('institute_id', currentInstitute.id);

      const { data: mappings, error: mapError } = await Promise.race([
        mappingsPromise,
        timeoutPromise,
      ]);

      if (mapError || !mappings || mappings.length === 0) {
        setChildrenList(DEFAULT_CHILDREN);
        setSelectedChild(DEFAULT_CHILDREN[0]);
        return;
      }

      const list: ChildStudent[] = mappings.map((m: any) => {
        const s = m.students;
        const batchName = s?.batch_enrollments?.[0]?.batches?.name || 'Class 12 • JEE Advanced (Morning)';
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
    } catch {
      setChildrenList(DEFAULT_CHILDREN);
      setSelectedChild(DEFAULT_CHILDREN[0]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, [user, currentInstitute]);

  const selectChild = (studentId: string) => {
    const target = childrenList.find(c => c.id === studentId);
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

    // Demo lookup / simulated registration
    const knownChildren: Record<string, ChildStudent> = {
      'STU-AMELIA-902': {
        id: 'stud-amelia-01',
        admission_number: 'ADM-2026-088',
        user_id: 'usr-student-01',
        full_name: 'Amelia Sharma',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        batch_name: 'Class 12 • JEE Advanced (Morning)',
        grade: 'Class 11 Science',
        parent_code: 'STU-AMELIA-902',
        emoji: '🎓',
      },
      'STU-AARAV-104': {
        id: 'stud-aarav-02',
        admission_number: 'ADM-2026-104',
        user_id: 'usr-student-02',
        full_name: 'Aarav Sharma',
        avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200',
        batch_name: 'Class 11 • Physics & Calculus Mastery',
        grade: 'Class 12 Advanced',
        parent_code: 'STU-AARAV-104',
        emoji: '📐',
      },
      'STU-ROHAN-305': {
        id: 'stud-rohan-03',
        admission_number: 'ADM-2026-305',
        user_id: 'usr-student-03',
        full_name: 'Rohan Verma',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
        batch_name: 'Class 10 CBSE • Board Toppers',
        grade: 'Class 10 STEM',
        parent_code: 'STU-ROHAN-305',
        emoji: '📚',
      },
    };

    let matched = knownChildren[clean];
    if (!matched && (clean.includes('98290') || clean.length >= 10)) {
      matched = knownChildren['STU-AMELIA-902'];
    }

    if (!matched) {
      return {
        success: false,
        error: `No registered student found for code "${clean}". Please ask your student or tuition faculty for their active Student Link Code.`,
      };
    }

    setChildrenList((prev) => {
      if (prev.some((c) => c.id === matched.id || c.parent_code === matched.parent_code)) {
        return prev;
      }
      return [...prev, matched];
    });
    setSelectedChild(matched);
    return { success: true, child: matched };
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
