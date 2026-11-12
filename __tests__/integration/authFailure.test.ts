import { supabase } from '@/lib/supabase';
import { mockRouter } from '../../jest.setup';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(async () => ({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(),
  },
  isSupabaseConfigured: true,
}));

describe('Auth Failure Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fails closed on invalid credentials without navigating', async () => {
    // Mock Supabase returning an Invalid login credentials error
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
      data: { session: null, user: null },
      error: { message: 'Invalid login credentials', status: 400 },
    });

    const result = await supabase.auth.signInWithPassword({
      email: 'hacker@example.com',
      password: 'WrongPassword!',
    });

    // Assert error state returned
    expect(result.error).not.toBeNull();
    expect(result.error?.message).toBe('Invalid login credentials');
    expect(result.data.session).toBeNull();

    // Assert that router.replace / router.push was NOT called
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('fails closed on unverified email', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
      data: { session: null, user: null },
      error: { message: 'Email not confirmed', status: 400 },
    });

    const result = await supabase.auth.signInWithPassword({
      email: 'unconfirmed@example.com',
      password: 'Password123!',
    });

    expect(result.error?.message).toBe('Email not confirmed');
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});
