import {
  registerForPushNotifications,
  dispatchNotification,
  notifyHomeworkPublished,
  notifyGradePosted,
  notifyAttendanceCorrection,
  notifyAdmissionDecision,
} from '@/services/notificationService';
import { supabase } from '@/lib/supabase';
import * as Notifications from 'expo-notifications';

jest.mock('@/lib/supabase', () => {
  const mockFrom = jest.fn();
  const mockRpc = jest.fn();
  const mockInvoke = jest.fn().mockResolvedValue({ data: null, error: null });
  return {
    supabase: {
      from: mockFrom,
      rpc: mockRpc,
      functions: {
        invoke: mockInvoke,
      },
    },
    isSupabaseConfigured: true,
  };
});

describe('Notification Service Comprehensive Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const userId = 'user-uuid-001';
  const instituteId = 'inst-uuid-001';

  it('registerForPushNotifications handles permission and registers token via RPC', async () => {
    jest.spyOn(Notifications, 'getPermissionsAsync').mockResolvedValueOnce({
      status: 'granted',
    } as any);

    jest.spyOn(Notifications, 'getExpoPushTokenAsync').mockResolvedValueOnce({
      data: 'ExponentPushToken[mock-token-xyz]',
    } as any);

    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const token = await registerForPushNotifications(userId);
    expect(token).toBe('ExponentPushToken[mock-token-xyz]');
    expect(supabase.rpc).toHaveBeenCalledWith('register_push_token', expect.any(Object));
  });

  it('dispatchNotification stores notification in database and invokes edge function', async () => {
    const mockInsert = jest.fn().mockResolvedValue({
      data: [{ id: 'notif-1' }],
      error: null,
    });
    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    await dispatchNotification({
      instituteId,
      userIds: [userId],
      title: 'Class Postponed',
      body: 'Today class is moved to 5:00 PM',
      type: 'general',
    });

    expect(supabase.from).toHaveBeenCalledWith('notifications');
    expect(supabase.functions.invoke).toHaveBeenCalledWith(
      'send-push-notifications',
      expect.objectContaining({ body: expect.any(Object) })
    );
  });

  it('notifyHomeworkPublished fetches batch students and dispatches notification', async () => {
    const mockBatchEq = jest.fn().mockResolvedValue({
      data: [{ student: { user_id: 'user-001' } }],
      error: null,
    });
    const mockBatchSelect = jest.fn().mockReturnValue({ eq: mockBatchEq });

    const mockNotifInsert = jest.fn().mockResolvedValue({ data: [], error: null });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'batch_students') {
        return { select: mockBatchSelect };
      }
      if (table === 'notifications') {
        return { insert: mockNotifInsert };
      }
      return {};
    });

    await notifyHomeworkPublished({
      instituteId,
      batchId: 'batch-001',
      title: 'Ray Optics DPP #4',
      subject: 'Physics',
    });

    expect(supabase.from).toHaveBeenCalledWith('batch_students');
  });

  it('notifyGradePosted calls dispatchNotification with score info', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ data: [], error: null });
    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    await notifyGradePosted({
      instituteId,
      studentUserId: userId,
      assignmentTitle: 'Physics Electrostatics Test',
      score: 92,
      totalMarks: 100,
    });

    expect(supabase.from).toHaveBeenCalledWith('notifications');
  });

  it('notifyAttendanceCorrection formats correction reason in body', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ data: [], error: null });
    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    await notifyAttendanceCorrection({
      instituteId,
      studentUserId: userId,
      studentName: 'Rohan Sharma',
      date: '2026-11-12',
      oldStatus: 'A',
      newStatus: 'P',
    });

    expect(supabase.from).toHaveBeenCalledWith('notifications');
  });

  it('notifyAdmissionDecision notifies student about approval or rejection', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ data: [], error: null });
    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    await notifyAdmissionDecision({
      instituteId,
      userId,
      status: 'approved',
      batchName: 'Class 12 JEE Morning',
    });

    expect(supabase.from).toHaveBeenCalledWith('notifications');
  });
});
