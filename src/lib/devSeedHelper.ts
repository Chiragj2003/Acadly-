/**
 * DEV SEED HELPER & DETERMINISTIC UUID REGISTRY
 * Strictly for local development, testing, and dev seed workflows (__DEV__).
 * All entity IDs adhere to valid RFC 4122 UUID v4 formatting to maintain
 * database integrity with Supabase PostgreSQL constraints.
 */

import { type UserRole, type Institute, type Profile, type Batch } from '@/types/database';

/**
 * Universal RFC 4122 UUID v4 generator.
 * Uses native crypto.randomUUID where available with a fallback.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Check if current runtime environment is development (__DEV__) */
export function isDevEnvironment(): boolean {
  return typeof __DEV__ !== 'undefined' && Boolean(__DEV__);
}

// ------------------------------------------------------------------------------
// Deterministic UUIDs matching supabase/seed.sql
// ------------------------------------------------------------------------------
export const DEV_INSTITUTE_ID = '11111111-1111-1111-1111-111111111111';
export const DEV_INSTITUTE_2_ID = '11111111-1111-1111-1111-111111111112';

export const DEV_ADMIN_USER_ID = '00000000-0000-0000-0000-000000000001';
export const DEV_TEACHER_USER_ID = '00000000-0000-0000-0000-000000000002';
export const DEV_TEACHER_2_USER_ID = '00000000-0000-0000-0000-000000000003';
export const DEV_STUDENT_USER_ID = '00000000-0000-0000-0000-000000000004';
export const DEV_STUDENT_2_USER_ID = '00000000-0000-0000-0000-000000000005';
export const DEV_PARENT_USER_ID = '00000000-0000-0000-0000-000000000010';

export const DEV_BATCH_1_ID = '55555555-5555-5555-5555-555555555501';
export const DEV_BATCH_2_ID = '55555555-5555-5555-5555-555555555502';
export const DEV_BATCH_3_ID = '55555555-5555-5555-5555-555555555503';

// ------------------------------------------------------------------------------
// Seed Institutes
// ------------------------------------------------------------------------------
export const DEV_DEFAULT_INSTITUTES: Institute[] = [
  {
    id: DEV_INSTITUTE_ID,
    name: 'Apex IIT-JEE & Medical Academy',
    code: 'APEX-KOTA',
    center_code: 'APX-9021',
    city: 'Kota',
    campus_name: 'Kota Campus',
    created_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: DEV_INSTITUTE_2_ID,
    name: 'Pinnacle Science Foundation',
    code: 'PINNACLE-DELHI',
    center_code: 'PIN-4410',
    city: 'New Delhi',
    campus_name: 'South Extension',
    created_at: '2025-02-15T00:00:00.000Z',
  },
];

// ------------------------------------------------------------------------------
// Seed Batches
// ------------------------------------------------------------------------------
export const DEV_INITIAL_BATCHES: Batch[] = [
  {
    id: DEV_BATCH_1_ID,
    institute_id: DEV_INSTITUTE_ID,
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
    created_at: '2025-01-10T00:00:00.000Z',
  },
  {
    id: DEV_BATCH_2_ID,
    institute_id: DEV_INSTITUTE_ID,
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
    created_at: '2025-01-12T00:00:00.000Z',
  },
  {
    id: DEV_BATCH_3_ID,
    institute_id: DEV_INSTITUTE_ID,
    name: 'Foundation Class 10 STEM',
    subject: 'Mathematics',
    target_exam: 'CBSE & Olympiad',
    room_number: 'Room 101',
    start_time: '03:30 PM',
    end_time: '05:00 PM',
    status: 'upcoming',
    student_count: 35,
    assigned_teacher_name: 'Prof. Arvind Swaminathan',
    created_at: '2025-02-01T00:00:00.000Z',
  },
];

// ------------------------------------------------------------------------------
// Dev Dummy Accounts (Available only in __DEV__)
// ------------------------------------------------------------------------------
export interface DummyAccount {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  password: string;
  roleLabel: string;
  badge: string;
  badgeColor: string;
  avatarInitials: string;
  description: string;
}

