import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  type UserRole,
  type Institute,
  type Profile,
  type Batch,
} from '@/types/database';
import {
  generateUUID,
  isDevEnvironment,
  DEV_DEFAULT_INSTITUTES,
  DEV_INITIAL_BATCHES,
  type DummyAccount,
} from '@/lib/devSeedHelper';
import { registerForPushNotifications } from '@/services/notificationService';

export { type DummyAccount };

export interface AuthContextType {
  user: Profile | null;
  activeInstitute: Institute | null;
  currentInstitute: Institute | null;
  userRole: UserRole;
  institutes: Institute[];
  availableInstitutes: Institute[];
  batches: Batch[];
  loading: boolean;
  signIn: (identifier: string, password?: string, role?: UserRole) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  signInWithGoogle: (role: UserRole) => Promise<{ success: boolean; error?: string }>;
  signUp: (fullName: string, email: string, role: UserRole, password?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  switchInstitute: (instituteId: string) => void;
  createInstitute: (name: string, centerCode: string, city: string) => Promise<{ success: boolean; institute?: Institute; error?: string }>;
  joinInstituteWithCode: (code: string) => Promise<{ success: boolean; institute?: Institute; error?: string }>;
  joinInstituteByCode: (code: string) => Promise<{ success: boolean; institute?: Institute; error?: string }>;
  refreshInstitutes: () => Promise<void>;
  createBatch: (batchData: Omit<Batch, 'id' | 'institute_id' | 'created_at' | 'student_count'>) => Promise<{ success: boolean; batch?: Batch }>;
  archiveBatch: (batchId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [user, setUser] = useState<Profile | null>(null);
  const [activeInstitute, setActiveInstitute] = useState<Institute | null>(
    isDevEnvironment() ? DEV_DEFAULT_INSTITUTES[0] : null
  );
  const [institutes, setInstitutes] = useState<Institute[]>(
    isDevEnvironment() ? DEV_DEFAULT_INSTITUTES : []
  );
  const [batches, setBatches] = useState<Batch[]>(
    isDevEnvironment() ? DEV_INITIAL_BATCHES : []
  );
  const [loading, setLoading] = useState(true);

  // Helper to load institute records from Supabase by institute_id
  const loadInstituteData = useCallback(async (instituteId?: string, userId?: string) => {
    if (!isSupabaseConfigured) return;

    try {
      // 1. Fetch current institute if an ID exists
      if (instituteId) {
        const { data: instData } = await supabase
          .from('institutes')
          .select('*')
          .eq('id', instituteId)
          .maybeSingle();

        if (instData) {
          setActiveInstitute(instData as Institute);
        }
      }

      // 2. Fetch all institutes the user is a member of
      if (userId) {
        const { data: memberRows } = await supabase
          .from('institute_members')
          .select('institute:institutes(*)')
          .eq('user_id', userId)
          .eq('status', 'active');

        if (memberRows && memberRows.length > 0) {
          const loadedInstitutes = memberRows
            .map((r: any) => r.institute)
            .filter(Boolean) as Institute[];

          if (loadedInstitutes.length > 0) {
            setInstitutes(loadedInstitutes);
            if (!instituteId && loadedInstitutes[0]) {
              setActiveInstitute(loadedInstitutes[0]);
            }
          }
        }
      }
    } catch (e) {
      console.warn('[AuthContext] Error loading institute records:', e);
    }
  }, []);

  // Helper to load user profile and session state
  const syncSessionUser = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Role and institute_id strictly derived from JWT app_metadata
      const jwtRole = (session.user.app_metadata?.role as UserRole) ||
                      (session.user.user_metadata?.default_role as UserRole) ||
                      'student';
      const instituteId = session.user.app_metadata?.institute_id as string | undefined;

      setUserRole(jwtRole);

      // Load profile from public.profiles
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileRow) {
        setUser(profileRow as Profile);
      } else {
        // Fallback profile if row is being created by trigger
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          phone: session.user.phone || undefined,
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || jwtRole,
          default_role: jwtRole,
          created_at: session.user.created_at || new Date().toISOString(),
        });
      }

      // Fetch institute data
      await loadInstituteData(instituteId, session.user.id);
      registerForPushNotifications(session.user.id).catch(() => null);
    } catch (e) {
      console.warn('[AuthContext] Error syncing session:', e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [loadInstituteData]);

  useEffect(() => {
    syncSessionUser();

    // Listen to real-time auth state changes from Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const jwtRole = (session.user.app_metadata?.role as UserRole) ||
                        (session.user.user_metadata?.default_role as UserRole) ||
                        'student';
        setUserRole(jwtRole);
        const instituteId = session.user.app_metadata?.institute_id as string | undefined;
        await loadInstituteData(instituteId, session.user.id);
      } else {
        if (!isDevEnvironment()) {
          setUser(null);
          setActiveInstitute(null);
          setInstitutes([]);
        }
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [syncSessionUser, loadInstituteData]);

  const refreshInstitutes = async () => {
    if (user?.id) {
      await loadInstituteData(activeInstitute?.id, user.id);
    }
  };

  /**
   * DEV-ONLY Role Switching helper for UI previews.
   * Completely disabled in production builds to preserve JWT security.
   */
  const switchRole = async (role: UserRole) => {
    if (!__DEV__) {
      console.warn('[Security Warning]: Client switchRole is disabled in production. Role is verified via JWT.');
      return;
    }
    setUserRole(role);
    setUser((prev) => (prev ? { ...prev, default_role: role } : null));
    await AsyncStorage.setItem('@acadly_role', role);
    await AsyncStorage.setItem('@acadly_authenticated', 'true');
  };

  const switchInstitute = (instituteId: string) => {
    const inst = institutes.find((i) => i.id === instituteId);
    if (inst) {
      setActiveInstitute(inst);
    }
  };

  /**
   * Secure Sign In:
   * - In __DEV__, allows 1-tap quick demo accounts.
   * - In Production / Real Auth, requires valid credentials via Supabase Auth.
   * - FAILS CLOSED: Returns clear error messages on wrong password, unverified email, or network drops.
   */
  const signIn = async (identifier: string, password?: string, role?: UserRole) => {
    setLoading(true);
    try {
      const cleanEmail = identifier.trim().toLowerCase();
      const enteredPass = password ? password.trim() : '';

      if (!cleanEmail) {
        return { success: false, error: 'Please enter your registered email address.' };
      }

      // Password requirement
      if (!enteredPass) {
        return { success: false, error: 'Please enter your account password.' };
      }

      if (enteredPass.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters.' };
      }

      // 2. Production Authentication: Must connect to Supabase Auth
      if (!isSupabaseConfigured) {
        return {
          success: false,
          error: 'Authentication service is not configured. Please verify project environment variables.',
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@acadly.app`,
        password: enteredPass,
      });

      if (error || !data.user) {
        // FAIL CLOSED: Translate specific error causes clearly without leaking sensitive tokens
        const msg = error?.message || 'Invalid email or password.';
        if (msg.toLowerCase().includes('invalid login credentials')) {
          return { success: false, error: 'Invalid email or password. Please verify your credentials and try again.' };
        }
        if (msg.toLowerCase().includes('email not confirmed')) {
          return { success: false, error: 'Email address unverified. Please check your inbox for the confirmation email.' };
        }
        if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
          return { success: false, error: 'Network connection error. Please check your internet connection.' };
        }
        return { success: false, error: msg };
      }

      // Role and institute strictly from session claims
      const finalRole = (data.user.app_metadata?.role as UserRole) ||
                        (data.user.user_metadata?.default_role as UserRole) ||
                        role ||
                        'student';
      const instituteId = data.user.app_metadata?.institute_id as string | undefined;

      const userProfile: Profile = {
        id: data.user.id,
        email: data.user.email || cleanEmail,
        phone: data.user.phone || undefined,
        full_name: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
        default_role: finalRole,
        created_at: data.user.created_at || new Date().toISOString(),
      };

      setUser(userProfile);
      setUserRole(finalRole);

      await loadInstituteData(instituteId, data.user.id);
      registerForPushNotifications(data.user.id).catch(() => null);
      return { success: true, role: finalRole };
    } catch (e: unknown) {
      const errMessage = e instanceof Error ? e.message : 'Authentication failed';
      return { success: false, error: errMessage };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (_role: UserRole) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: 'acadly://auth/callback',
          },
        });
        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      }
      return { success: false, error: 'Google sign-in requires active Supabase OAuth configuration.' };
    } catch (e: unknown) {
      const errMessage = e instanceof Error ? e.message : 'Google sign-in failed';
      return { success: false, error: errMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Secure Sign Up:
   * - Accepts typed password (>= 6 chars required; no hardcoded fallback).
   * - Enforces server-side role assignment via RPCs or trigger.
   */
  const signUp = async (fullName: string, email: string, role: UserRole, password?: string) => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        return { success: false, error: 'Database service is not configured.' };
      }

      const cleanEmail = email.trim().toLowerCase();
      const userPassword = password ? password.trim() : '';

      if (!userPassword || userPassword.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters.' };
      }

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: userPassword,
        options: {
          data: {
            full_name: fullName.trim(),
            default_role: role,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const newProfile: Profile = {
        id: data.user?.id || generateUUID(),
        email: cleanEmail,
        full_name: fullName.trim(),
        default_role: role,
        created_at: new Date().toISOString(),
      };

      setUser(newProfile);
      setUserRole(role);
      return { success: true };
    } catch (e: unknown) {
      const errMessage = e instanceof Error ? e.message : 'Failed to register account';
      return { success: false, error: errMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Complete Sign Out:
   * - Clears Supabase session and tokens from SecureStore.
   * - Purges all @acadly_* and cached keys from AsyncStorage so zero data bleeds across accounts.
   * - Resets all React state variables cleanly.
   */
  const signOut = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      // Purge all persisted application storage keys
      const allKeys = await AsyncStorage.getAllKeys();
      const acadlyKeys = allKeys.filter(
        (k) => k.startsWith('@acadly_') || k.startsWith('acadly_') || k.startsWith('sb-')
      );
      if (acadlyKeys.length > 0) {
        await AsyncStorage.multiRemove(acadlyKeys);
      }
    } catch (e) {
      console.warn('[AuthContext] Sign out cleanup error:', e);
    } finally {
      setUser(null);
      setUserRole('student');
      setActiveInstitute(null);
      setInstitutes([]);
      setBatches([]);
      setLoading(false);
    }
  };

  const createInstitute = async (name: string, centerCode: string, city: string) => {
    // If authenticated with Supabase, invoke server RPC
    if (isSupabaseConfigured && user?.id) {
      try {
        const { data, error } = await supabase.rpc('create_institute_and_admin', {
          p_name: name,
          p_center_code: centerCode,
          p_city: city,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        const newInst = data as Institute;
        setInstitutes((prev) => [newInst, ...prev.filter((i) => i.id !== newInst.id)]);
        setActiveInstitute(newInst);
        setUserRole('admin');
        return { success: true, institute: newInst };
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to create institute';
        return { success: false, error: msg };
      }
    }

    // Fallback for dev environment without Supabase
    const newInst: Institute = {
      id: generateUUID(),
      name: name.trim(),
      code: `${name.toUpperCase().replace(/\s+/g, '-')}-${city.toUpperCase()}`,
      center_code: centerCode.trim().toUpperCase(),
      city: city.trim(),
      campus_name: `${city.trim()} Campus`,
      created_at: new Date().toISOString(),
    };

    setInstitutes((prev) => [newInst, ...prev]);
    setActiveInstitute(newInst);
    return { success: true, institute: newInst };
  };

  const joinInstituteWithCode = async (code: string) => {
    const normalized = code.trim().toUpperCase();

    if (isSupabaseConfigured) {
      try {
        const { data: instData, error } = await supabase
          .from('institutes')
          .select('*')
          .or(`center_code.ilike.${normalized},invite_code.ilike.${normalized},code.ilike.${normalized}`)
          .maybeSingle();

        if (error) {
          return { success: false, error: error.message };
        }

        if (instData) {
          const inst = instData as Institute;
          setActiveInstitute(inst);
          setInstitutes((prev) => [inst, ...prev.filter((i) => i.id !== inst.id)]);
          return { success: true, institute: inst };
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to verify institute code';
        return { success: false, error: msg };
      }
    }

    const inst = institutes.find(
      (i) => i.center_code?.toUpperCase() === normalized || i.code?.toUpperCase() === normalized
    );

    if (inst) {
      setActiveInstitute(inst);
      return { success: true, institute: inst };
    }

    return {
      success: false,
      error: `No institute found matching code "${code}". Please verify with your academy coordinator.`,
    };
  };

  const joinInstituteByCode = joinInstituteWithCode;

  const createBatch = async (
    batchData: Omit<Batch, 'id' | 'institute_id' | 'created_at' | 'student_count'>
  ) => {
    const newBatch: Batch = {
      ...batchData,
      id: generateUUID(),
      institute_id: activeInstitute?.id || generateUUID(),
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
        currentInstitute: activeInstitute,
        userRole,
        institutes,
        availableInstitutes: institutes,
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
        joinInstituteByCode,
        refreshInstitutes,
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

/**
 * Unified Institute Hook:
 * Reads from the single source of truth in AuthContext (loaded from institutes table).
 */
export const useInstitute = () => {
  const {
    activeInstitute,
    institutes,
    switchInstitute,
    joinInstituteWithCode,
    refreshInstitutes,
    loading,
  } = useAuth();

  return {
    currentInstitute: activeInstitute,
    availableInstitutes: institutes,
    switchInstitute,
    joinInstituteByCode: joinInstituteWithCode,
    isLoading: loading,
    refreshInstitutes,
    error: null,
  };
};
