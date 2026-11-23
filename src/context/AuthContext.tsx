import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase, isSupabaseConfigured, isLocalSupabase, supabaseEndpoint } from '@/lib/supabase';
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
  /** Name + email + password. When email confirmation is on, a 6-digit code is emailed. */
  signUp: (
    fullName: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; role?: UserRole; needsOtp?: boolean; error?: string }>;
  verifySignUpOtp: (email: string, code: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  resendSignUpOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  /** In-app role setup after sign-in: create a tuition, join as teacher, or link a child. */
  completeRoleSetup: (
    role: UserRole,
    details: SignUpOnboarding
  ) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
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

/** Extra details collected at sign-up for roles the server must grant. */
export interface SignUpOnboarding {
  instituteName?: string;
  instituteCity?: string;
  institutePhone?: string;
  instituteSubjects?: string[];
  teacherInstituteCode?: string;
  teacherQualification?: string;
  teacherSubjects?: string[];
  teacherExperienceYears?: number;
  parentStudentCode?: string;
}

const VALID_ROLES: readonly UserRole[] = ['admin', 'teacher', 'student', 'parent'];

/**
 * The role used for routing comes only from server-set app_metadata (the same
 * claim RLS uses). user_metadata and the role tile a user tapped are user-
 * controlled, so trusting them sent self-declared "admins" to an admin console.
 */
export const roleFromClaims = (appMetadata: Record<string, unknown> | undefined): UserRole => {
  const role = appMetadata?.role as UserRole | undefined;
  return role && VALID_ROLES.includes(role) ? role : 'student';
};

export const BACKEND_NOT_SET_UP_MESSAGE = isLocalSupabase
  ? 'The local Acadly database is empty. Run "npx supabase db reset" to create the tables and demo accounts.'
  : 'Acadly’s database isn’t set up yet. Run supabase/hosted_setup.sql in your Supabase project’s SQL Editor, then try again.';

/** PostgREST codes for "table / function not found": the schema was never applied. */
const isMissingSchemaError = (code?: string, message?: string) =>
  code === 'PGRST205' ||
  code === 'PGRST202' ||
  code === '42P01' ||
  /could not find the (table|function)/i.test(message || '');

/**
 * True when the database has Acadly's tables. With RLS an anonymous read returns an
 * empty list when the table exists, and a PGRST205 error when it doesn't.
 * Network errors count as "unknown" (true) so they surface as connection problems instead.
 */
export const isBackendSetUp = async (): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('institutes').select('id').limit(1);
    return !(error && isMissingSchemaError(error.code, error.message));
  } catch {
    return true;
  }
};

/** Human message for auth failures, including the common "local server is down" case. */
export const describeAuthError = (message: string | undefined): string => {
  const msg = (message || '').toLowerCase();
  if (isMissingSchemaError(undefined, msg) || msg.includes('database error saving new user')) {
    return BACKEND_NOT_SET_UP_MESSAGE;
  }
  if (msg.includes('invalid login credentials')) {
    return 'That email and password don\u2019t match. Check them and try again.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Please confirm your email first \u2014 check your inbox for the link.';
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to connect') || msg.includes('timeout')) {
    return isLocalSupabase
      ? `Can't reach the local Acadly server (${supabaseEndpoint}). Start Docker Desktop, run "npx supabase start", and make sure your phone is on the same Wi-Fi as this computer.`
      : 'Can\u2019t reach Acadly right now. Check your internet connection and try again.';
  }
  if (msg.includes('user already registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  return message || 'Something went wrong. Please try again.';
};

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
      const jwtRole = roleFromClaims(session.user.app_metadata);
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
        const jwtRole = roleFromClaims(session.user.app_metadata);
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
        // "Wrong password" on an empty database is misleading: no accounts exist yet.
        if (error?.message?.toLowerCase().includes('invalid login credentials') && !(await isBackendSetUp())) {
          return { success: false, error: BACKEND_NOT_SET_UP_MESSAGE };
        }
        return { success: false, error: describeAuthError(error?.message) };
      }

      // Role and institute strictly from session claims
      // Only the server-set claim decides where the user lands (not the tile they tapped).
      const finalRole = roleFromClaims(data.user.app_metadata);
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
      return { success: false, error: describeAuthError(e instanceof Error ? e.message : undefined) };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (_role: UserRole) => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        return { success: false, error: 'Google sign-in requires active Supabase OAuth configuration.' };
      }
      const redirectTo = Platform.OS === 'web' ? undefined : Linking.createURL('auth/callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        // On native, signInWithOAuth only returns a URL; it must be opened in an
        // auth session (previously nothing happened when tapping Google on a phone).
        options: { redirectTo, skipBrowserRedirect: Platform.OS !== 'web' },
      });
      if (error) {
        return { success: false, error: error.message };
      }
      if (Platform.OS === 'web' || !data?.url || !redirectTo) {
        return { success: true };
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success') {
        return { success: false, error: 'Google sign-in was cancelled.' };
      }
      const code = Linking.parse(result.url).queryParams?.code;
      if (typeof code !== 'string') {
        return { success: false, error: 'Google did not return a sign-in code.' };
      }
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        return { success: false, error: exchangeError.message };
      }
      await syncSessionUser();
      return { success: true };
    } catch (e: unknown) {
      const errMessage = e instanceof Error ? e.message : 'Google sign-in failed';
      return { success: false, error: errMessage };
    } finally {
      setLoading(false);
    }
  };

  /** Re-reads the session so newly granted app_metadata (role / institute) applies. */
  const refreshGrantedRole = async (): Promise<UserRole> => {
    const { data: refreshed } = await supabase.auth.refreshSession();
    await syncSessionUser();
    return roleFromClaims(refreshed.session?.user.app_metadata);
  };

  /**
   * Sign up with name, email and password only. Everyone starts as a student;
   * teacher / institute / parent access is granted later inside the app (/setup).
   */
  const signUp = async (fullName: string, email: string, password: string) => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        return { success: false, error: 'Database service is not configured.' };
      }
      const cleanEmail = email.trim().toLowerCase();
      if (!fullName.trim()) return { success: false, error: 'Enter your full name.' };
      if (!password || password.length < 8) {
        return { success: false, error: 'Use a password with at least 8 characters.' };
      }
      // Don't create a half-made auth user when the tables don't exist yet.
      if (!(await isBackendSetUp())) {
        return { success: false, error: BACKEND_NOT_SET_UP_MESSAGE };
      }

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      if (error) return { success: false, error: describeAuthError(error.message) };

      // Supabase returns a user with no identities when the email is already registered.
      if (data.user?.identities && data.user.identities.length === 0) {
        return { success: false, error: 'An account with this email already exists. Try signing in instead.' };
      }
      if (!data.session) return { success: true, needsOtp: true };

      await syncSessionUser();
      return { success: true, role: roleFromClaims(data.session.user.app_metadata) };
    } catch (e: unknown) {
      return { success: false, error: describeAuthError(e instanceof Error ? e.message : undefined) };
    } finally {
      setLoading(false);
    }
  };

  /** Checks the 6-digit code from the sign-up email and signs the user in. */
  const verifySignUpOtp = async (email: string, code: string) => {
    setLoading(true);
    try {
      const token = code.replace(/\D/g, '');
      if (token.length < 6) return { success: false, error: 'Enter the 6-digit code from your email.' };
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token,
        type: 'signup',
      });
      if (error || !data.session) {
        const msg = (error?.message || '').toLowerCase();
        return {
          success: false,
          error:
            msg.includes('expired') || msg.includes('invalid')
              ? 'That code is wrong or has expired. Check the email or send a new code.'
              : describeAuthError(error?.message),
        };
      }
      await syncSessionUser();
      return { success: true, role: roleFromClaims(data.session.user.app_metadata) };
    } catch (e: unknown) {
      return { success: false, error: describeAuthError(e instanceof Error ? e.message : undefined) };
    } finally {
      setLoading(false);
    }
  };

  const resendSignUpOtp = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim().toLowerCase() });
      if (error) return { success: false, error: describeAuthError(error.message) };
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: describeAuthError(e instanceof Error ? e.message : undefined) };
    }
  };

  /** Grants teacher / institute / parent access through the server functions allowed to do it. */
  const completeRoleSetup = async (role: UserRole, details: SignUpOnboarding) => {
    setLoading(true);
    try {
      let rpcError: string | null = null;
      if (role === 'admin') {
        const name = details.instituteName?.trim();
        if (!name) return { success: false, error: 'Enter the name of your tuition or institute.' };
        const code =
          name.replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase() + Math.floor(100 + Math.random() * 900);
        const { error } = await supabase.rpc('create_institute_and_admin', {
          p_name: name,
          p_center_code: code,
          p_city: details.instituteCity?.trim() || '',
          p_phone: details.institutePhone?.trim() || undefined,
          p_subjects: details.instituteSubjects ?? [],
        });
        rpcError = error?.message ?? null;
      } else if (role === 'teacher') {
        const code = details.teacherInstituteCode?.trim().toUpperCase();
        if (!code) return { success: false, error: 'Enter the code your institute gave you.' };
        const { error } = await supabase.rpc('join_institute_as_teacher', {
          p_code: code,
          p_qualification: details.teacherQualification || undefined,
          p_specialization_subjects: details.teacherSubjects ?? [],
          p_experience_years: details.teacherExperienceYears ?? 0,
        });
        rpcError = error?.message ?? null;
      } else if (role === 'parent') {
        const code = details.parentStudentCode?.trim().toUpperCase();
        if (!code) return { success: false, error: 'Enter your child’s student code.' };
        const { error } = await supabase.rpc('link_child_by_code', { p_student_code: code });
        rpcError = error?.message ?? null;
      }
      if (rpcError) return { success: false, error: describeAuthError(rpcError) };
      return { success: true, role: await refreshGrantedRole() };
    } catch (e: unknown) {
      return { success: false, error: describeAuthError(e instanceof Error ? e.message : undefined) };
    } finally {
      setLoading(false);
    }
  };

  /** Sends a real Supabase password-reset email that deep-links to /reset-password. */
  const sendPasswordReset = async (email: string) => {
    const clean = email.trim().toLowerCase();
    if (!clean.includes('@')) {
      return { success: false, error: 'Enter the email you sign in with.' };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(clean, {
        redirectTo: Linking.createURL('reset-password'),
      });
      if (error) return { success: false, error: describeAuthError(error.message) };
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: describeAuthError(e instanceof Error ? e.message : undefined) };
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
        verifySignUpOtp,
        resendSignUpOtp,
        completeRoleSetup,
        sendPasswordReset,
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
