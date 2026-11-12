import { clampGradeScore } from '@/lib/academicHelpers';

describe('Academic Helpers - Grade Clamping', () => {
  it('returns exact score when within valid bounds', () => {
    expect(clampGradeScore(85, 100)).toBe(85);
    expect(clampGradeScore(0, 50)).toBe(0);
    expect(clampGradeScore(50, 50)).toBe(50);
  });

  it('clamps negative scores to zero', () => {
    expect(clampGradeScore(-10, 100)).toBe(0);
    expect(clampGradeScore(-0.5, 25)).toBe(0);
  });

  it('clamps excessive scores to totalMarks', () => {
    expect(clampGradeScore(120, 100)).toBe(100);
    expect(clampGradeScore(500, 25)).toBe(25);
  });

  it('handles invalid inputs and 0 totalMarks gracefully', () => {
    expect(clampGradeScore(NaN, 100)).toBe(0);
    expect(clampGradeScore(10, 0)).toBe(0);
    expect(clampGradeScore(10, -50)).toBe(0);
  });
});
