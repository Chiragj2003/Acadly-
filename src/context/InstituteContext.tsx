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

const DEFAULT_CUTE_INSTITUTES: Institute[] = [
  {
    id: 'inst-bloom-01',
    name: 'Bloom Academy 🌸',
    code: 'BLOOM2026',
    center_code: 'PUNE-01',
    join_code: 'BLOOM2026',
    slug: 'bloom-academy',
    tagline: 'Where curious minds blossom into stars ✨',
    logo_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200',
    address: '42 Blossom Garden Avenue',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411004',
    contact_email: 'hello@bloomacademy.edu',
    contact_phone: '+91 98230 11223',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inst-starlight-02',
    name: 'Starlight Coaching Hub 🌟',
    code: 'STAR2026',
    center_code: 'BLR-01',
    join_code: 'STAR2026',
    slug: 'starlight-hub',
    tagline: 'Dream big, study happy, achieve high 🚀',
    logo_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=200',
    address: '15 Galaxy Crossway',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    contact_email: 'support@starlighthub.com',
    contact_phone: '+91 98450 44556',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const InstituteContext = createContext<InstituteContextType | undefined>(undefined);

export const InstituteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentInstitute, setCurrentInstitute] = useState<Institute | null>(DEFAULT_CUTE_INSTITUTES[0]);
  const [availableInstitutes, setAvailableInstitutes] = useState<Institute[]>(DEFAULT_CUTE_INSTITUTES);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchInstitutes = async () => {
    if (!user) {
      setAvailableInstitutes(DEFAULT_CUTE_INSTITUTES);
      setCurrentInstitute(DEFAULT_CUTE_INSTITUTES[0]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // 2.5s safety timeout race to guarantee fast boot & prevent hanging
      const timeoutPromise = new Promise<{ data: null; error: any }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error('Timeout') }), 2500)
      );

      const queryPromise = supabase
        .from('institute_members')
        .select(`
          institute_id,
          role,
          institutes (*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error) {
        // Graceful fallback for non-migrated, offline, or timed-out database state
        setAvailableInstitutes(DEFAULT_CUTE_INSTITUTES);
        if (!currentInstitute) setCurrentInstitute(DEFAULT_CUTE_INSTITUTES[0]);
        return;
      }

      const institutes: Institute[] = [];
      data?.forEach((row: any) => {
        if (row.institutes && !institutes.some(inst => inst.id === row.institutes.id)) {
          institutes.push(row.institutes as Institute);
        }
      });

      if (institutes.length > 0) {
        setAvailableInstitutes(institutes);
        if (!currentInstitute || !institutes.some(inst => inst.id === currentInstitute.id)) {
          setCurrentInstitute(institutes[0]);
        }
      } else {
        setAvailableInstitutes(DEFAULT_CUTE_INSTITUTES);
        if (!currentInstitute) setCurrentInstitute(DEFAULT_CUTE_INSTITUTES[0]);
      }
    } catch {
      setAvailableInstitutes(DEFAULT_CUTE_INSTITUTES);
      if (!currentInstitute) setCurrentInstitute(DEFAULT_CUTE_INSTITUTES[0]);
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
    const cleanCode = code.trim().toUpperCase();

    // Local instant match for cute demo codes
    const localMatch = DEFAULT_CUTE_INSTITUTES.find(i => i.join_code === cleanCode);
    if (localMatch) {
      if (!availableInstitutes.some(i => i.id === localMatch.id)) {
        setAvailableInstitutes(prev => [...prev, localMatch]);
      }
      setCurrentInstitute(localMatch);
      return { success: true };
    }

    if (!user) {
      return { success: false, error: 'User is not authenticated' };
    }

    try {
      const { data: institute, error: instError } = await supabase
        .from('institutes')
        .select('*')
        .eq('join_code', cleanCode)
        .single();

      if (instError || !institute) {
        return { success: false, error: 'Invalid join code. No matching institute found.' };
      }

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

      await supabase
        .from('institute_members')
        .insert({
          institute_id: institute.id,
          user_id: user.id,
          role: 'student',
          is_active: true,
        });

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
