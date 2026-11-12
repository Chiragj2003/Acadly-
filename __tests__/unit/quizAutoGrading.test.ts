import { autoGradeQuiz, QuizQuestionDef } from '@/lib/academicHelpers';

describe('Academic Helpers - Quiz Auto-Grading', () => {
  const sampleQuestions: QuizQuestionDef[] = [
    {
      id: 'q-01',
      type: 'mcq',
      question: 'What is the powerhouse of the cell?',
      options: ['Nucleus', 'Mitochondria', 'Ribosome'],
      correctOptionIndex: 1,
      marks: 4,
    },
    {
      id: 'q-02',
      type: 'true_false',
      question: 'Light travels faster than sound.',
      options: ['True', 'False'],
      correctOptionIndex: 0,
      marks: 2,
    },
    {
      id: 'q-03',
      type: 'mcq',
      question: 'Capital of France?',
      options: ['Berlin', 'Madrid', 'Paris'],
      correctOptionIndex: 2,
      marks: 4,
    },
  ];

  it('awards full marks when all answers are correct', () => {
    const answers = {
      'q-01': 1,
      'q-02': 0,
      'q-03': 2,
    };
    const result = autoGradeQuiz(sampleQuestions, answers, 40);

    expect(result.totalScore).toBe(10);
    expect(result.totalMarks).toBe(10);
    expect(result.percentage).toBe(100);
    expect(result.isPassed).toBe(true);
    expect(result.questionResults.every((r) => r.isCorrect)).toBe(true);
  });

  it('correctly scores partial performance', () => {
    const answers = {
      'q-01': 1, // Correct (4 pts)
      'q-02': 1, // Wrong (0 pts)
      'q-03': 0, // Wrong (0 pts)
    };
    const result = autoGradeQuiz(sampleQuestions, answers, 50);

    expect(result.totalScore).toBe(4);
    expect(result.totalMarks).toBe(10);
    expect(result.percentage).toBe(40);
    expect(result.isPassed).toBe(false); // 40 < 50
    expect(result.questionResults[0].isCorrect).toBe(true);
    expect(result.questionResults[1].isCorrect).toBe(false);
  });

  it('awards zero marks when questions are unanswered', () => {
    const answers = {};
    const result = autoGradeQuiz(sampleQuestions, answers, 40);

    expect(result.totalScore).toBe(0);
    expect(result.totalMarks).toBe(10);
    expect(result.percentage).toBe(0);
    expect(result.isPassed).toBe(false);
  });
});
