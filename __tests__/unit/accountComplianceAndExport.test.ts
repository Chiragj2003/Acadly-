import {
  requestAccountDeletion,
  exportUserData,
} from '@/services/accountService';
import { supabase } from '@/lib/supabase';

const mockRpc = jest.fn();
const mockSignOut = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    auth: {
      signOut: () => mockSignOut(),
    },
  },
  isSupabaseConfigured: true,
}));

describe('Account Privacy & App Store Compliance (Deletion & Data Export)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('permanently anonymizes user records and signs out caller via request_account_deletion RPC', async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Your account and personal data have been anonymized and marked for permanent deletion.',
      },
      error: null,
    });
    mockSignOut.mockResolvedValueOnce({ error: null });

    const res = await requestAccountDeletion();

    expect(res.success).toBe(true);
    expect(res.message).toContain('anonymized');
    expect(mockRpc).toHaveBeenCalledWith('request_account_deletion');
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('exports user profile, attendance, results, and submissions via export_user_data RPC', async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        user_id: 'user-uuid-1',
        exported_at: '2026-11-13T10:00:00Z',
        profile: { full_name: 'Rahul Sharma' },
        attendance: [{ date: '2026-11-13', status: 'P' }],
        results: [{ exam_title: 'Mechanics Mid-Term', marks: 92 }],
        submissions: [{ title: 'Kinematics DPP', score: 25 }],
      },
      error: null,
    });

    const data = await exportUserData();

    expect(data.user_id).toBe('user-uuid-1');
    expect(data.attendance.length).toBe(1);
    expect(data.results.length).toBe(1);
    expect(data.submissions.length).toBe(1);
    expect(mockRpc).toHaveBeenCalledWith('export_user_data');
  });

  it('fails closed when account deletion RPC encounters a database exception', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database transaction error' },
    });

    await expect(requestAccountDeletion()).rejects.toThrow('Account deletion failed: Database transaction error');
  });
});
