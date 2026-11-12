import {
  loginSchema,
  registerSchema,
  createBatchSchema,
  quizAssignmentSchema,
  attendanceCorrectionSchema,
} from '@/lib/validation';

describe('Validation Schemas (Zod)', () => {
  it('validates correct login credentials and rejects invalid email/short password', () => {
    const valid = loginSchema.safeParse({ email: 'teacher@acadly.com', password: 'Password123!' });
    expect(valid.success).toBe(true);

    const invalidEmail = loginSchema.safeParse({ email: 'not-an-email', password: 'Password123!' });
    expect(invalidEmail.success).toBe(false);

    const shortPass = loginSchema.safeParse({ email: 'teacher@acadly.com', password: '123' });
    expect(shortPass.success).toBe(false);
  });

  it('validates register requirements (name, password strength, role enum)', () => {
    const valid = registerSchema.safeParse({
      email: 'student@acadly.com',
      password: 'StrongPassword1',
      fullName: 'Aarav Sharma',
      role: 'student',
    });
    expect(valid.success).toBe(true);

    const weakPassword = registerSchema.safeParse({
      email: 'student@acadly.com',
      password: 'weak',
      fullName: 'Aarav Sharma',
      role: 'student',
    });
    expect(weakPassword.success).toBe(false);

    const invalidRole = registerSchema.safeParse({
      email: 'student@acadly.com',
      password: 'StrongPassword1',
      fullName: 'Aarav Sharma',
      role: 'superadmin',
    });
    expect(invalidRole.success).toBe(false);
  });

  it('validates create batch schema with positive capacity', () => {
    const valid = createBatchSchema.safeParse({
      name: 'Class 12 Physics Masterclass',
      subject: 'Physics',
      standard: '12th',
      timing: '4:00 PM - 5:30 PM',
      capacity: 40,
    });
    expect(valid.success).toBe(true);

    const invalidCapacity = createBatchSchema.safeParse({
      name: 'Class 12 Physics',
      subject: 'Physics',
      standard: '12th',
      timing: '4:00 PM',
      capacity: -5,
    });
    expect(invalidCapacity.success).toBe(false);
  });

  it('validates quiz assignment schema with UUID batchId and questions', () => {
    const valid = quizAssignmentSchema.safeParse({
      batchId: 'e3b0c442-98fc-1c14-9afb-4c7fa4390001',
      title: 'Thermodynamics DPP 01',
      subject: 'Physics',
      dueDate: '2026-11-20',
      totalMarks: 10,
      questions: [
        {
          id: 'q-1',
          type: 'mcq',
          question: 'What is the SI unit of heat?',
          options: ['Joule', 'Calorie', 'Kelvin'],
          correctOptionIndex: 0,
          marks: 5,
        },
      ],
    });
    expect(valid.success).toBe(true);

    const invalidBatchId = quizAssignmentSchema.safeParse({
      batchId: 'batch-01', // Non-UUID
      title: 'Quiz',
      subject: 'Math',
      dueDate: '2026-11-20',
      totalMarks: 10,
      questions: [],
    });
    expect(invalidBatchId.success).toBe(false);
  });

  it('validates attendance correction schema requires valid UUIDs and reason length', () => {
    const valid = attendanceCorrectionSchema.safeParse({
      studentId: 'e3b0c442-98fc-1c14-9afb-4c7fa4390001',
      batchId: 'f4c1d553-09ad-2d25-0bec-5d8ab5400002',
      date: '2026-11-12',
      status: 'present',
      reason: 'Student arrived late due to school bus delay',
    });
    expect(valid.success).toBe(true);

    const shortReason = attendanceCorrectionSchema.safeParse({
      studentId: 'e3b0c442-98fc-1c14-9afb-4c7fa4390001',
      batchId: 'f4c1d553-09ad-2d25-0bec-5d8ab5400002',
      date: '2026-11-12',
      status: 'present',
      reason: 'fix', // < 5 chars
    });
    expect(shortReason.success).toBe(false);
  });
});
