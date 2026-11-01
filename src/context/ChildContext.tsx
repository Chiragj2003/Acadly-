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
}

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
  const [childrenList, setChildrenList] = useState<ChildStudent[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildStudent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchChildren = async () => {
    if (!user || !currentInstitute) {
      setChildrenList([]);
      setSelectedChild(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // Find parent record
      const { data: parentRecord, error: parentError } = await supabase
        .from('parents')
        .select('id')
        .eq('institute_id', currentInstitute.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (parentError || !parentRecord) {
        setChildrenList([]);
        setSelectedChild(null);
        return;
      }

      // Fetch mapped students
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

      if (mapError) {
        console.error('Error fetching parent student mappings:', mapError);
        return;
      }

      const list: ChildStudent[] = (mappings || []).map((m: any) => {
        const s = m.students;
        const batchName = s?.batch_enrollments?.[0]?.batches?.name || 'Standard Batch';
        return {
          id: s?.id || m.student_id,
          admission_number: s?.admission_number || 'N/A',
          user_id: s?.user_id,
          full_name: s?.profiles?.full_name || 'Student',
          avatar_url: s?.profiles?.avatar_url,
          batch_name: batchName,
        };
      });

      setChildrenList(list);
      if (list.length > 0 && !selectedChild) {
        setSelectedChild(list[0]);
      } else if (selectedChild && !list.some(c => c.id === selectedChild.id)) {
        setSelectedChild(list[0] || null);
      }
    } catch (err) {
      console.error('Failed to load child students:', err);
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
