import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * Configure global notifications handler.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register user's device for Expo push notifications and persist token in database.
 */
export const registerForPushNotifications = async (
  userId: string
): Promise<string | null> => {
  if (!isSupabaseConfigured || !userId) return null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    // Attempt to get token
    const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
    const token = tokenData?.data;

    if (!token) return null;

    // 1. Upsert into push_tokens table
    try {
      await supabase
        .from('push_tokens')
        .upsert(
          {
            user_id: userId,
            token,
            platform: Platform.OS,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'token' }
        );
    } catch (err: unknown) {
      console.warn('Could not upsert push token:', err);
    }

    // 2. Also keep on profiles table for convenience
    try {
      await supabase
        .from('profiles')
        .update({
          expo_push_token: token,
        })
        .eq('id', userId);
    } catch {
      // Ignore profile update error
    }

    return token;
  } catch (err) {
    console.warn('Push notification registration skipped or unavailable:', err);
    return null;
  }
};

/**
 * Helper to dispatch push notifications via edge function or direct database insertion.
 */
export const dispatchNotification = async (payload: {
  instituteId: string;
  userIds: string[];
  title: string;
  body: string;
  type?: string;
  data?: Record<string, any>;
}): Promise<void> => {
  const { instituteId, userIds, title, body, type = 'general', data = {} } = payload;
  if (!isSupabaseConfigured || !userIds || userIds.length === 0) return;

  // 1. Insert in-app notifications
  const records = userIds.map((uid) => ({
    institute_id: instituteId,
    user_id: uid,
    recipient_id: uid,
    title,
    body,
    message: body,
    type,
    data,
  }));

  try {
    await supabase.from('notifications').insert(records);
  } catch {
    // Ignore in-app insert error
  }

  // 2. Invoke send-push-notifications edge function
  try {
    await supabase.functions.invoke('send-push-notifications', {
      body: payload,
    });
  } catch (err) {
    console.warn('Edge push notification dispatch note:', err);
  }
};

/**
 * Trigger notification when a new assignment or quiz is published.
 */
export const notifyHomeworkPublished = async (params: {
  instituteId: string;
  batchId: string;
  title: string;
  subject?: string;
}): Promise<void> => {
  if (!isSupabaseConfigured) return;
  const { instituteId, batchId, title, subject } = params;

  // Fetch student user IDs in this batch
  const { data: batchStudents } = await supabase
    .from('batch_students')
    .select('student:students(user_id)')
    .eq('batch_id', batchId);

  const studentUserIds: string[] = (batchStudents || [])
    .map((bs: any) => bs.student?.user_id)
    .filter(Boolean);

  if (studentUserIds.length > 0) {
    await dispatchNotification({
      instituteId,
      userIds: studentUserIds,
      title: 'New Homework Published',
      body: `"${title}" has been published for ${subject || 'your batch'}. Check details in Study Vault.`,
      type: 'homework_published',
      data: { batchId, title },
    });
  }
};

/**
 * Trigger notification when a submission is graded.
 */
export const notifyGradePosted = async (params: {
  instituteId: string;
  studentUserId: string;
  assignmentTitle: string;
  score: number;
  totalMarks: number;
}): Promise<void> => {
  const { instituteId, studentUserId, assignmentTitle, score, totalMarks } = params;
  await dispatchNotification({
    instituteId,
    userIds: [studentUserId],
    title: 'Assignment Graded',
    body: `Your score for "${assignmentTitle}": ${score}/${totalMarks}. View faculty notes in app.`,
    type: 'grade_posted',
    data: { assignmentTitle, score, totalMarks },
  });
};

/**
 * Trigger notification when an attendance correction occurs.
 */
export const notifyAttendanceCorrection = async (params: {
  instituteId: string;
  studentUserId: string;
  studentName: string;
  date: string;
  oldStatus: string;
  newStatus: string;
}): Promise<void> => {
  const { instituteId, studentUserId, studentName, date, oldStatus, newStatus } = params;
  await dispatchNotification({
    instituteId,
    userIds: [studentUserId],
    title: 'Attendance Corrected',
    body: `Attendance for ${studentName} on ${date} was updated from ${oldStatus} to ${newStatus}.`,
    type: 'attendance_correction',
    data: { date, oldStatus, newStatus },
  });
};

/**
 * Trigger notification when an admission request is decided (approved or rejected).
 */
export const notifyAdmissionDecision = async (params: {
  instituteId: string;
  userId: string;
  status: 'approved' | 'rejected';
  batchName?: string;
}): Promise<void> => {
  const { instituteId, userId, status, batchName } = params;
  const isApproved = status === 'approved';
  await dispatchNotification({
    instituteId,
    userIds: [userId],
    title: isApproved ? 'Admission Approved!' : 'Admission Update',
    body: isApproved
      ? `Welcome to Acadly! Your admission request has been approved${batchName ? ` for ${batchName}` : ''}.`
      : 'Your admission request was not approved. Please contact institute administration.',
    type: 'admission_decision',
    data: { status, batchName },
  });
};
