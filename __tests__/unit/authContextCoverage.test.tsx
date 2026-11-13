import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth, useInstitute } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => {
  const mockAuthStateChange = jest.fn(() => ({
    data: { subscription: { unsubscribe: jest.fn() } },
  }));
  const mockGetSession = jest.fn().mockResolvedValue({
    data: { session: null },
    error: null,
  });
  const mockSignOut = jest.fn().mockResolvedValue({ error: null });

  return {
    supabase: {
      auth: {
        onAuthStateChange: mockAuthStateChange,
        getSession: mockGetSession,
        signOut: mockSignOut,
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    },
    isSupabaseConfigured: true,
  };
});

const AuthConsumer = () => {
  const { user, userRole, signOut, activeInstitute } = useAuth();
  return (
    <View>
      <Text testID="user-status">{user ? user.email : 'unauthenticated'}</Text>
      <Text testID="user-role">{userRole}</Text>
      <Text testID="institute-name">{activeInstitute?.name || 'none'}</Text>
      <TouchableOpacity testID="sign-out-btn" onPress={signOut}>
        <Text>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const InstituteConsumer = () => {
  const { currentInstitute, isLoading } = useInstitute();
  return (
    <View>
      <Text testID="current-inst">{currentInstitute?.name || 'none'}</Text>
      <Text testID="loading-inst">{isLoading ? 'loading' : 'ready'}</Text>
    </View>
  );
};

describe('AuthContext & Hooks Comprehensive Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders AuthProvider and provides authentication state to consumers', async () => {
    const { getByTestId } = await render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(getByTestId('user-status')).toBeTruthy();
    expect(getByTestId('user-role')).toBeTruthy();

    fireEvent.press(getByTestId('sign-out-btn'));
    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  it('useInstitute consumes context within AuthProvider without error', async () => {
    const { getByTestId } = await render(
      <AuthProvider>
        <InstituteConsumer />
      </AuthProvider>
    );

    expect(getByTestId('current-inst')).toBeTruthy();
    expect(getByTestId('loading-inst')).toBeTruthy();
  });
});
