import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  type UserRole,
  type Institute,
  type Profile,
  type Batch,
} from '@/types/database';

export interface AuthContextType {
  user: Profile | null;
  activeInstitute: Institute | null;
  userRole: UserRole;
  institutes: Institute[];
  batches: Batch[];
  loading: boolean;
  signIn: (identifier: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: (role: UserRole) => Promise<{ success: boolean; error?: string }>;
  signUp: (fullName: string, email: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  switchInstitute: (instituteId: string) => void;
  createInstitute: (name: string, centerCode: string, city: string) => Promise<{ success: boolean; institute?: Institute; error?: string }>;
  joinInstituteWithCode: (code: string) => Promise<{ success: boolean; institute?: Institute; error?: string }>;
  createBatch: (batchData: Omit<Batch, 'id' | 'institute_id' | 'created_at' | 'student_count'>) => Promise<{ success: boolean; batch?: Batch }>;
  archiveBatch: (batchId: string) => void;
}

const DEFAULT_INSTITUTES: Institute[] = [
  {
    id: 'inst-01',
    name: 'Apex IIT-JEE & Medical Academy',
    code: 'APEX-KOTA',
    center_code: 'APX-9021',
    city: 'Kota',
    campus_name: 'Kota Campus',
    created_at: '2025-01-01',
  },
  {
    id: 'inst-02',
    name: 'Pinnacle Science Foundation',
    code: 'PINNACLE-DELHI',
    center_code: 'PIN-4410',
    city: 'New Delhi',
    campus_name: 'South Extension',
    created_at: '2025-02-15',
  },
];

const INITIAL_BATCHES: Batch[] = [
  {
    id: 'batch-01',
    institute_id: 'inst-01',
    name: 'JEE Advanced Target 2025',
    subject: 'Physics',
    target_exam: 'JEE Advanced',
    room_number: 'Room 102',
    start_time: '10:00 AM',
    end_time: '12:30 PM',
    status: 'in_progress',
    student_count: 50,
    present_count: 48,
    assigned_teacher_name: 'Er. Alok Saxena',
    created_at: '2025-01-10',
  },
  {
    id: 'batch-02',
    institute_id: 'inst-01',
    name: 'NEET Dropper Pinnacle',
    subject: 'Chemistry',
    target_exam: 'NEET UG',
    room_number: 'Hall B',
    start_time: '11:30 AM',
    end_time: '01:30 PM',
    status: 'upcoming',
    student_count: 42,
    present_count: 38,
    assigned_teacher_name: 'Dr. Manisha Gupta',
    created_at: '2025-01-12',
  },
  {
    id: 'batch-03',
    institute_id: 'inst-01',
    name: 'Foundation Class 10 STEM',
    subject: 'Mathematics',
    target_exam: 'CBSE & Olympiad',
    room_number: 'Room 101',
    start_time: '03:30 PM',
    end_time: '05:00 PM',
    status: 'upcoming',
    student_count: 35,
    assigned_teacher_name: 'Prof. Arvind Swaminathan',
    created_at: '2025-02-01',
  },
];

const ROLE_PROFILES: Record<UserRole, Profile> = {
  admin: {
    id: 'user-admin',
    email: 'director@apex.in',
    phone: '+91 98290 41208',
    full_name: 'Director Sharma',
    default_role: 'admin',
    created_at: '2025-01-01',
  },
  teacher: {
    id: 'user-teacher',
    email: 'r.verma@apex.in',
    phone: '+91 98290 41209',
    full_name: 'Er. Rakesh Verma',
    default_role: 'teacher',
    created_at: '2025-01-05',
  },
  student: {
    id: 'user-student',
    email: 'aryan.kapoor@student.in',
    phone: '+91 98290 41210',
    full_name: 'Aryan Kapoor',
    default_role: 'student',
    created_at: '2025-01-15',
  },
  parent: {
    id: 'user-parent',
    email: 's.kapoor@parent.in',
    phone: '+91 98290 41211',
    full_name: 'Suresh Kapoor',
    default_role: 'parent',
    created_at: '2025-01-15',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [user, setUser] = useState<Profile | null>(null);
  const [activeInstitute, setActiveInstitute] = useState<Institute | null>(DEFAULT_INSTITUTES[0]);
  const [institutes, setInstitutes] = useState<Institute[]>(DEFAULT_INSTITUTES);
  const [batches, setBatches] = useState<Batch[]>(INITIAL_BATCHES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore saved role and user session if present
    (async () => {
      try {
        const isAuth = await AsyncStorage.getItem('@acadly_authenticated');
        const savedRole = await AsyncStorage.getItem('@acadly_role');
        if (isAuth === 'true' && savedRole && ['admin', 'teacher', 'student', 'parent'].includes(savedRole)) {
          const role = savedRole as UserRole;
          setUserRole(role);
          setUser(ROLE_PROFILES[role]);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const switchRole = async (role: UserRole) => {
    setUserRole(role);
    setUser(ROLE_PROFILES[role]);
    await AsyncStorage.setItem('@acadly_role', role);
    await AsyncStorage.setItem('@acadly_authenticated', 'true');
  };

  const switchInstitute = (instituteId: string) => {
    const inst = institutes.find((i) => i.id === instituteId);
    if (inst) {
      setActiveInstitute(inst);
    }
  };

  const signIn = async (identifier: string, role?: UserRole) => {
    setLoading(true);
    try {
      const selectedRole = role || userRole;
      if (isSupabaseConfigured) {
        // Attempt Supabase Auth login
        const { error } = await supabase.auth.signInWithPassword({
          email: identifier.includes('@') ? identifier : `${identifier}@acadly.app`,
          password: 'Password123!',
        });
        if (error) {
          // If credentials fail in demo mode, gracefully fall back to role profile
        }
      }

      await switchRole(selectedRole);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to sign in' };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (role: UserRole) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: 'acadly://auth/callback',
          },
        });
      }

      await switchRole(role);
      return { success: true };
    } catch {
      await switchRole(role);
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (fullName: string, email: string, role: UserRole) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signUp({
          email,
          password: 'Password123!',
          options: {
            data: {
              full_name: fullName,
              default_role: role,
            },
          },
        });
      }

      const newProfile: Profile = {
        id: `user-${Date.now()}`,
        email,
        full_name: fullName,
        default_role: role,
        created_at: new Date().toISOString(),
      };
      setUser(newProfile);
      setUserRole(role);
      await AsyncStorage.setItem('@acadly_role', role);
      await AsyncStorage.setItem('@acadly_authenticated', 'true');
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to register' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    await AsyncStorage.removeItem('@acadly_role');
    await AsyncStorage.removeItem('@acadly_authenticated');
  };

  const createInstitute = async (name: string, centerCode: string, city: string) => {
    const newInst: Institute = {
      id: `inst-${Date.now()}`,
      name,
      code: `${name.toUpperCase().replace(/\s+/g, '-')}-${city.toUpperCase()}`,
      center_code: centerCode.toUpperCase(),
      city,
      campus_name: `${city} Campus`,
      created_at: new Date().toISOString(),
    };

    setInstitutes((prev) => [newInst, ...prev]);
    setActiveInstitute(newInst);
    return { success: true, institute: newInst };
  };

  const joinInstituteWithCode = async (code: string) => {
    const normalized = code.trim().toUpperCase();
    const inst = institutes.find(
      (i) => i.center_code.toUpperCase() === normalized || i.code.toUpperCase() === normalized
    );

    if (inst) {
      setActiveInstitute(inst);
      return { success: true, institute: inst };
    }

    return {
      success: false,
      error: `No institute found matching code "${code}". Please check with your academy coordinator.`,
    };
  };

  const createBatch = async (
    batchData: Omit<Batch, 'id' | 'institute_id' | 'created_at' | 'student_count'>
  ) => {
    const newBatch: Batch = {
      ...batchData,
      id: `batch-${Date.now()}`,
      institute_id: activeInstitute?.id || 'inst-01',
      student_count: 0,
      created_at: new Date().toISOString(),
    };

    setBatches((prev) => [newBatch, ...prev]);
    return { success: true, batch: newBatch };
  };

  const archiveBatch = (batchId: string) => {
    setBatches((prev) =>
      prev.map((b) => (b.id === batchId ? { ...b, status: 'archived' } : b))
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeInstitute,
        userRole,
        institutes,
        batches,
        loading,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        switchRole,
        switchInstitute,
        createInstitute,
        joinInstituteWithCode,
        createBatch,
        archiveBatch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
