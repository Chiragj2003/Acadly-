import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { type BatchSchedule } from '@/types/database';

export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface UpsertBatchScheduleInput {
  id?: string;
  institute_id: string;
  batch_id: string;
  weekday: Weekday;
  start_time: string;
  end_time: string;
  subject_id?: string;
  subject_name: string;
  teacher_id?: string;
  teacher_name?: string;
  room?: string;
  tag?: string;
  is_live?: boolean;
}

/**
 * Fetch complete weekly schedule for a given batch.
 */
export async function fetchBatchSchedule(batchId: string): Promise<BatchSchedule[]> {
  if (!isSupabaseConfigured || !batchId) {
    return [];
  }

  const { data, error } = await supabase
    .from('batch_schedule')
    .select('*')
    .eq('batch_id', batchId)
    .order('start_time', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch batch schedule: ${error.message}`);
  }

  return (data || []) as BatchSchedule[];
}

/**
 * Fetch schedule for a specific weekday.
 */
export async function fetchWeekdaySchedule(
  batchId: string,
  weekday: Weekday
): Promise<BatchSchedule[]> {
  if (!isSupabaseConfigured || !batchId) {
    return [];
  }

  const { data, error } = await supabase
    .from('batch_schedule')
    .select('*')
    .eq('batch_id', batchId)
    .eq('weekday', weekday)
    .order('start_time', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch weekday schedule: ${error.message}`);
  }

  return (data || []) as BatchSchedule[];
}

/**
 * Upsert (create or update) a batch schedule slot.
 */
export async function upsertBatchSchedule(
  input: UpsertBatchScheduleInput
): Promise<BatchSchedule> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const payload = {
    ...(input.id ? { id: input.id } : {}),
    institute_id: input.institute_id,
    batch_id: input.batch_id,
    weekday: input.weekday,
    start_time: input.start_time,
    end_time: input.end_time,
    subject_id: input.subject_id || null,
    subject_name: input.subject_name.trim(),
    teacher_id: input.teacher_id || null,
    teacher_name: input.teacher_name ? input.teacher_name.trim() : null,
    room: input.room ? input.room.trim() : null,
    tag: input.tag ? input.tag.trim() : 'Classroom',
    is_live: Boolean(input.is_live),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('batch_schedule')
    .upsert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save schedule entry: ${error.message}`);
  }

  return data as BatchSchedule;
}

/**
 * Delete a batch schedule slot.
 */
export async function deleteBatchSchedule(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    return;
  }

  const { error } = await supabase.from('batch_schedule').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete schedule entry: ${error.message}`);
  }
}
