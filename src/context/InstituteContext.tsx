import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Institute } from '../types/database';
import { useAuth } from './AuthContext';

interface InstituteContextType {
  currentInstitute: Institute | null;
  availableInstitutes: Institute[];
  switchInstitute: (instituteId: string) => void;
  joinInstituteByCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
  refreshInstitutes: () => Promise<void>;
}

const InstituteContext = createContext<InstituteContextType | undefined>(undefined);

export const InstituteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentInstitute, setCurrentInstitute] = useState<Institute | null>(null);
  const [availableInstitutes, setAvailableInstitutes] = useState<Institute[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchInstitutes = async () => {
    if (!user) {
      setAvailableInstitutes([]);
      setCurrentInstitute(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('institute_members')
        .select(`
          institute_id,
          role,
          institutes (*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching user institutes:', error);
        return;
      }

      const institutes: Institute[] = [];
      data?.forEach((row: any) => {
        if (row.institutes && !institutes.some(inst => inst.id === row.institutes.id)) {
          institutes.push(row.institutes as Institute);
        }
      });

      setAvailableInstitutes(institutes);
      if (institutes.length > 0 && !currentInstitute) {
        setCurrentInstitute(institutes[0]);
      } else if (currentInstitute && !institutes.some(inst => inst.id === currentInstitute.id)) {
        setCurrentInstitute(institutes[0] || null);
      }
    } catch (err) {
      console.error('Failed to load institutes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutes();
  }, [user]);

  const switchInstitute = (instituteId: string) => {
    const target = availableInstitutes.find(inst => inst.id === instituteId);
    if (target) {
      setCurrentInstitute(target);
    }
  };

  const joinInstituteByCode = async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User is not authenticated' };
    }

    try {
      // 1. Find institute by join code
      const { data: institute, error: instError } = await supabase
        .from('institutes')
        .select('*')
        .eq('join_code', code.trim().toUpperCase())
        .single();

      if (instError || !institute) {
        return { success: false, error: 'Invalid join code. No matching institute found.' };
      }

      // 2. Check if already a member
      const { data: existingMember } = await supabase
        .from('institute_members')
        .select('id')
        .eq('institute_id', institute.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingMember) {
        setCurrentInstitute(institute);
        return { success: true };
      }

      // 3. Insert membership
      const { error: joinError } = await supabase
        .from('institute_members')
        .insert({
          institute_id: institute.id,
          user_id: user.id,
          role: 'student', // default join role
          is_active: true,
        });

      if (joinError) {
        return { success: false, error: joinError.message };
      }

      await fetchInstitutes();
      setCurrentInstitute(institute);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred while joining' };
    }
  };

  return (
    <InstituteContext.Provider
      value={{
        currentInstitute,
        availableInstitutes,
        switchInstitute,
        joinInstituteByCode,
        isLoading,
        refreshInstitutes: fetchInstitutes,
      }}
    >
      {children}
    </InstituteContext.Provider>
  );
};

export const useInstitute = () => {
  const context = useContext(InstituteContext);
  if (!context) {
    throw new Error('useInstitute must be used within an InstituteProvider');
  }
  return context;
};
