import { z } from 'zod';

/**
 * UUID format validator (case-insensitive 8-4-4-4-12 hex)
 */
export const uuidSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'Must be a valid UUID',
  });

/**
 * Date string validator (YYYY-MM-DD)
 */
export const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: 'Date must be formatted as YYYY-MM-DD',
});

/**
 * Auth Login Schema
 */
export const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Auth Registration Schema
 */
export const registerSchema = z.object({
  email: z.string().trim().email({ message: 'Please enter a valid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one digit' }),
  fullName: z.string().trim().min(2, { message: 'Full name must be at least 2 characters' }),
  role: z.enum(['student', 'teacher', 'parent', 'admin'], {
    message: 'Invalid user role selected',
  }),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Create Batch Schema
 */
export const createBatchSchema = z.object({
  name: z.string().trim().min(3, { message: 'Batch name must be at least 3 characters' }),
  subject: z.string().trim().min(2, { message: 'Subject is required' }),
  standard: z.string().trim().min(1, { message: 'Standard/Class is required' }),
  timing: z.string().trim().min(3, { message: 'Class timing is required' }),
  capacity: z.number().int().positive().max(500, { message: 'Capacity must be between 1 and 500' }),
});

export type CreateBatchFormData = z.infer<typeof createBatchSchema>;

/**
 * Join Request Schema
 */
export const joinRequestSchema = z.object({
  instituteCode: z.string().trim().min(4, { message: 'Institute code must be at least 4 characters' }),
  role: z.enum(['student', 'teacher', 'parent']),
  studentCode: z.string().trim().optional(),
});

export type JoinRequestFormData = z.infer<typeof joinRequestSchema>;

/**
 * Quiz Question Schema
 */
export const quizQuestionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['mcq', 'true_false', 'short_answer']),
  question: z.string().trim().min(3, { message: 'Question prompt cannot be empty' }),
  options: z.array(z.string().trim()).refine((opts) => opts.length >= 2, {
    message: 'Multiple choice questions must have at least 2 options',
  }),
  correctOptionIndex: z.number().int().min(0),
  explanation: z.string().optional(),
  marks: z.number().int().positive({ message: 'Question marks must be greater than 0' }),
});

/**
 * Quiz Assignment Builder Schema
 */
export const quizAssignmentSchema = z.object({
  batchId: uuidSchema,
  title: z.string().trim().min(3, { message: 'Quiz title must be at least 3 characters' }),
  subject: z.string().trim().min(2, { message: 'Subject is required' }),
  dueDate: z.string().min(1, { message: 'Due date is required' }),
  timeLimitMinutes: z.number().int().positive().optional(),
  totalMarks: z.number().int().positive(),
  questions: z.array(quizQuestionSchema).min(1, { message: 'Quiz must contain at least 1 question' }),
});

export type QuizAssignmentFormData = z.infer<typeof quizAssignmentSchema>;

/**
 * Attendance Correction Schema
 */
export const attendanceCorrectionSchema = z.object({
  studentId: uuidSchema,
  batchId: uuidSchema,
  date: dateStringSchema,
  status: z.enum(['present', 'absent', 'late', 'excused']),
  reason: z.string().trim().min(5, { message: 'A reason of at least 5 characters is required for audit log' }),
});

export type AttendanceCorrectionFormData = z.infer<typeof attendanceCorrectionSchema>;

/**
 * Doubt Post Schema
 */
export const doubtPostSchema = z.object({
  title: z.string().trim().min(3, { message: 'Title must be at least 3 characters' }).max(120),
  subject: z.string().trim().min(2, { message: 'Subject is required' }),
  content: z.string().trim().min(10, { message: 'Doubt description must be at least 10 characters' }),
});

export type DoubtPostFormData = z.infer<typeof doubtPostSchema>;
