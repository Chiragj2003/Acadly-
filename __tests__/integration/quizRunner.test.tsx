import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QuizRunner } from '@/components/academic/QuizRunner';
import * as submissionService from '@/services/submissionService';

// Mock submissionService
jest.mock('@/services/submissionService', () => ({
  getStudentSubmission: jest.fn(async () => null),
  getAssignmentForTaking: jest.fn(async (id: string) => ({
    id,
    title: 'Kinematics Interactive DPP',
    subject: 'Physics',
    total_marks: 10,
    questions: [
      {
        id: 'q-kin-1',
        type: 'mcq',
        question: 'A car accelerates uniformly from rest. What is the velocity-time curve?',
        questionText: 'A car accelerates uniformly from rest. What is the velocity-time curve?',
        options: ['Straight line with positive slope', 'Parabolic curve', 'Hyperbolic curve'],
        marks: 5,
      },
      {
        id: 'q-kin-2',
        type: 'true_false',
        question: 'Displacement can be zero even if distance traveled is positive.',
        questionText: 'Displacement can be zero even if distance traveled is positive.',
        options: ['True', 'False'],
        marks: 5,
      },
    ],
  })),
  submitQuiz: jest.fn(async () => ({
    submissionId: 'sub-test-101',
    totalScore: 10,
    totalMarks: 10,
    percentage: 100,
    isPassed: true,
    status: 'graded',
    questions: [
      {
        id: 'q-kin-1',
        type: 'mcq',
        questionText: 'A car accelerates uniformly from rest. What is the velocity-time curve?',
        options: ['Straight line with positive slope', 'Parabolic curve', 'Hyperbolic curve'],
        studentAnswer: 0,
        correctOptionIndex: 0,
        isCorrect: true,
        marksObtained: 5,
        maxMarks: 5,
        explanation: 'Constant acceleration results in linear velocity vs time.',
      },
    ],
  })),
}));

// Mock Auth Context with stable object references
const mockUser = { id: 'student-uuid-test', full_name: 'Test Student' };
const mockActiveInstitute = { id: 'inst-uuid-test' };

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    activeInstitute: mockActiveInstitute,
    userRole: 'student',
  }),
}));

describe('QuizRunner Component Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      const confirmAction = buttons?.find(
        (b) => b.text === 'Submit Now' || b.text === 'Submit Anyway'
      );
      if (confirmAction && confirmAction.onPress) {
        confirmAction.onPress();
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockAssignment: any = {
    id: 'asg-uuid-test-01',
    title: 'Kinematics Interactive DPP',
    type: 'quiz',
    subject: 'Physics',
    total_marks: 10,
    batch_id: 'batch-uuid-test',
  };

  it('renders questions, allows selecting options, and handles quiz submission', async () => {
    const handleCompleted = jest.fn();
    const handleClose = jest.fn();

    const { getByText, unmount } = await render(
      <QuizRunner
        assignment={mockAssignment}
        visible={true}
        onClose={handleClose}
        onCompleted={handleCompleted}
        studentId="student-record-test"
      />
    );

    // 1. Wait for questions to load
    await waitFor(() => {
      expect(
        getByText('A car accelerates uniformly from rest. What is the velocity-time curve?')
      ).toBeTruthy();
    });

    // 2. Select option for question 1
    const optionOne = getByText('Straight line with positive slope');
    fireEvent.press(optionOne);

    // 3. Move to next question
    const nextBtn = getByText('Next');
    fireEvent.press(nextBtn);

    await waitFor(() => {
      expect(
        getByText('Displacement can be zero even if distance traveled is positive.')
      ).toBeTruthy();
    });

    // 4. Select True for Question 2
    const trueOption = getByText('True');
    fireEvent.press(trueOption);

    // 5. Submit Quiz
    const submitBtn = getByText('Submit Quiz');
    expect(submitBtn).toBeTruthy();
    fireEvent.press(submitBtn);

    // Verify submitQuiz was called with student's answers
    await waitFor(() => {
      expect(submissionService.submitQuiz).toHaveBeenCalledWith(
        expect.objectContaining({
          assignmentId: mockAssignment.id,
          // students.id, not the auth user id
          studentId: 'student-record-test',
          answers: expect.objectContaining({
            'q-kin-1': 0,
          }),
        })
      );
    });

    unmount();
  });
});
