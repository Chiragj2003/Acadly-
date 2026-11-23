import { resolveDevSupabaseUrl } from '@/lib/supabase';
import { roleFromClaims, describeAuthError, BACKEND_NOT_SET_UP_MESSAGE } from '@/context/AuthContext';

describe('resolveDevSupabaseUrl', () => {
  it('points a stale LAN IP at the current dev machine', () => {
    expect(resolveDevSupabaseUrl('http://192.168.29.155:54321', '192.168.1.4')).toBe('http://192.168.1.4:54321');
  });

  it('points localhost at the dev machine so phones can reach it', () => {
    expect(resolveDevSupabaseUrl('http://127.0.0.1:54321', '192.168.1.4')).toBe('http://192.168.1.4:54321');
  });

  it('never rewrites a hosted Supabase URL', () => {
    expect(resolveDevSupabaseUrl('https://abc.supabase.co', '192.168.1.4')).toBe('https://abc.supabase.co');
  });

  it('leaves the URL alone when there is no dev host', () => {
    expect(resolveDevSupabaseUrl('http://192.168.29.155:54321', null)).toBe('http://192.168.29.155:54321');
  });
});

describe('roleFromClaims', () => {
  it('uses the server-set app_metadata role', () => {
    expect(roleFromClaims({ role: 'teacher' })).toBe('teacher');
  });

  it('falls back to student for missing or unknown roles', () => {
    expect(roleFromClaims(undefined)).toBe('student');
    expect(roleFromClaims({ role: 'superadmin' })).toBe('student');
  });
});

describe('describeAuthError', () => {
  it('explains wrong credentials plainly', () => {
    expect(describeAuthError('Invalid login credentials')).toMatch(/don.t match/);
  });

  it('explains network failures', () => {
    expect(describeAuthError('TypeError: Network request failed')).toMatch(/reach/);
  });

  it('says the database is not set up when tables or functions are missing', () => {
    expect(describeAuthError("Could not find the table 'public.institutes' in the schema cache")).toBe(BACKEND_NOT_SET_UP_MESSAGE);
    expect(describeAuthError('Could not find the function public.create_institute_and_admin')).toBe(BACKEND_NOT_SET_UP_MESSAGE);
    expect(describeAuthError('Database error saving new user')).toBe(BACKEND_NOT_SET_UP_MESSAGE);
  });
});
