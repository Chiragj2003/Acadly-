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
  emoji?: string;
}

const DEFAULT_CHILDREN: ChildStudent[] = [
  {
    id: 'stud-amelia-01',
    admission_number: 'ADM-2026-088',
    user_id: 'usr-student-01',
    full_name: 'Amelia Sharma 🌸',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    batch_name: 'Batch Sakura 🌸 (Medical)',
    grade: 'Class 11 Science',
    emoji: '🌸',
  },
  {
    id: 'stud-aarav-02',
    admission_number: 'ADM-2026-104',
    user_id: 'usr-student-02',
    full_name: 'Aarav Sharma ⚡',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200',
    batch_name: 'Batch Cosmos 🚀 (IIT-JEE)',
    grade: 'Class 12 Advanced',
    emoji: '🚀',
  },
];

interface ChildContextType {
  selectedChild: ChildStudent | null;
  childrenList: ChildStudent[];
  selectChild: (studentId: string) => void;
  isLoading: boolean;
  refreshChildren: () => Promise<void>;
}

const ChildContext = createContext<ChildContextType | undefined>(undefined);

export const ChildProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { currentInstitute } = useInstitute();
  const [childrenList, setChildrenList] = useState<ChildStudent[]>(DEFAULT_CHILDREN);
  const [selectedChild, setSelectedChild] = useState<ChildStudent | null>(DEFAULT_CHILDREN[0]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchChildren = async () => {
    if (!user || !currentInstitute) {
      setChildrenList(DEFAULT_CHILDREN);
      setSelectedChild(DEFAULT_CHILDREN[0]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data: parentRecord, error: parentError } = await supabase
        .from('parents')
        .select('id')
        .eq('institute_id', currentInstitute.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (parentError || !parentRecord) {
        setChildrenList(DEFAULT_CHILDREN);
        setSelectedChild(DEFAULT_CHILDREN[0]);
        return;
      }

      const { data: mappings, error: mapError } = await supabase
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

      if (mapError || !mappings || mappings.length === 0) {
        setChildrenList(DEFAULT_CHILDREN);
        setSelectedChild(DEFAULT_CHILDREN[0]);
        return;
      }

      const list: ChildStudent[] = mappings.map((m: any) => {
        const s = m.students;
        const batchName = s?.batch_enrollments?.[0]?.batches?.name || 'Batch Sakura 🌸';
        return {
          id: s?.id || m.student_id,
          admission_number: s?.admission_number || 'ADM-2026-088',
          user_id: s?.user_id,
          full_name: s?.profiles?.full_name || 'Amelia Sharma 🌸',
          avatar_url: s?.profiles?.avatar_url,
          batch_name: batchName,
          emoji: '🌸',
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

  return (
    <ChildContext.Provider
      value={{
        selectedChild,
        childrenList,
        selectChild,
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
