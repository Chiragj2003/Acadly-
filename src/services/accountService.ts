import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface UserExportData {
  user_id: string;
  exported_at: string;
  profile: Record<string, unknown>;
  attendance: Record<string, unknown>[];
  results: Record<string, unknown>[];
  submissions: Record<string, unknown>[];
}

/**
 * Permanently request account deletion and data anonymization via SECURITY DEFINER RPC.
 * Compliance requirement for Apple App Store and Google Play Store.
 */
export const requestAccountDeletion = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      message: 'Account deletion simulated in offline mode.',
    };
  }

  const { data, error } = await supabase.rpc('request_account_deletion');

  if (error) {
    throw new Error(`Account deletion failed: ${error.message}`);
  }

  // Sign out the user locally after anonymization
  await supabase.auth.signOut().catch(() => {});

  const res = data as any;
  return {
    success: true,
    message: res?.message || 'Your account and personal data have been anonymized.',
  };
};

/**
 * Export all personal and academic records for the authenticated user via SECURITY DEFINER RPC.
 */
export const exportUserData = async (): Promise<UserExportData> => {
  if (!isSupabaseConfigured) {
    return {
      user_id: 'offline-user',
      exported_at: new Date().toISOString(),
      profile: { full_name: 'Offline Student' },
      attendance: [],
      results: [],
      submissions: [],
    };
  }

  const { data, error } = await supabase.rpc('export_user_data');

  if (error) {
    throw new Error(`Data export failed: ${error.message}`);
  }

  return data as UserExportData;
};
