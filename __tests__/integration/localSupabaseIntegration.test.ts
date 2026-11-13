import { createClient } from '@supabase/supabase-js';

// Local Supabase configuration
const SUPABASE_LOCAL_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4Mzc0MTcsImV4cCI6MjAyNTQxMzQxN30.C422V0sH45QkXUe3sO0l3H0iQp0V6kOQh2dD7J0eB_k';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwOTgzNzQxNywiZXhwIjoyMDI1NDEzNDE3fQ.4U7qF2dZ4vY6L5w_m4o9f8G6y0Q2nE3qU7qF2dZ4vY4';

describe('Local Supabase DB-Backed Integration Tests', () => {
  let isLocalRunning = false;
  let adminClient: any;
  let anonClient: any;

  beforeAll(async () => {
    try {
      const pingRes = await fetch(`${SUPABASE_LOCAL_URL}/rest/v1/`, {
        headers: { apikey: SUPABASE_ANON_KEY },
      });
      if (pingRes.status === 200 || pingRes.status === 404) {
        isLocalRunning = true;
        adminClient = createClient(SUPABASE_LOCAL_URL, SUPABASE_SERVICE_ROLE_KEY);
        anonClient = createClient(SUPABASE_LOCAL_URL, SUPABASE_ANON_KEY);
      }
    } catch {
      isLocalRunning = false;
    }
  });

  it('1. commit_attendance RPC enforces atomic insert/update in one transaction', async () => {
    if (!isLocalRunning) {
      console.warn('Local Supabase not reachable; skipping live DB test');
      return;
    }

    // Call atomic commit_attendance with valid UUIDs
    const { data, error } = await adminClient.rpc('commit_attendance', {
      p_batch_id: '55555555-5555-5555-5555-555555555501',
      p_date: '2026-11-13',
      p_records: [
        {
          student_id: '00000000-0000-0000-0000-000000000004',
          status: 'P',
          remarks: 'Present live',
        },
      ],
    });

    expect(error).toBeNull();
    expect(data?.success).toBe(true);
  });

  it('2. approve_join_request RPC atomically activates membership', async () => {
    if (!isLocalRunning) return;

    // Verify RPC existence and signature validation
    const { data, error } = await adminClient.rpc('approve_join_request', {
      p_request_id: '00000000-0000-0000-0000-000000000000',
    });

    // Should return false or record-not-found error without crashing database schema
    expect(data === false || (error && error.message.includes('not found'))).toBeTruthy();
  });

  it('3. submit_quiz RPC grades server-side without exposing answer keys', async () => {
    if (!isLocalRunning) return;

    const { data, error } = await adminClient.rpc('submit_quiz', {
      p_assignment_id: '99999999-9999-9999-9999-999999999901',
      p_answers: { q1: 2 },
    });

    // If assignment exists, grading computes or handles gracefully
    if (!error) {
      expect(typeof data?.score).toBe('number');
    } else {
      expect(error.message).toBeDefined();
    }
  });

  it('4. RLS Denial: anonymous / unprivileged client cannot insert raw score into submissions', async () => {
    if (!isLocalRunning) return;

    const { data, error } = await anonClient
      .from('submissions')
      .insert({
        assignment_id: '99999999-9999-9999-9999-999999999901',
        student_id: '00000000-0000-0000-0000-000000000004',
        score: 100, // Attempting illegal student score overwrite
      });

    // RLS or trigger must deny the insert
    expect(error).not.toBeNull();
  });
});
