import { calculateAttendancePercentage, AttendanceItem } from '@/lib/academicHelpers';

describe('Academic Helpers - Attendance Percentage Calculation', () => {
  it('returns 0 for empty attendance records', () => {
    expect(calculateAttendancePercentage([])).toBe(0);
  });

  it('calculates 100% when all sessions are Present', () => {
    const records: AttendanceItem[] = [
      { status: 'P' },
      { status: 'P' },
      { status: 'present' },
    ];
    expect(calculateAttendancePercentage(records)).toBe(100);
  });

  it('calculates 0% when all sessions are Absent', () => {
    const records: AttendanceItem[] = [
      { status: 'A' },
      { status: 'absent' },
      { status: 'A' },
    ];
    expect(calculateAttendancePercentage(records)).toBe(0);
  });

  it('weights Late status as half (0.5)', () => {
    const records: AttendanceItem[] = [
      { status: 'P' }, // 1.0
      { status: 'L' }, // 0.5
      { status: 'A' }, // 0
      { status: 'A' }, // 0
    ];
    // 1.5 / 4 = 37.5%
    expect(calculateAttendancePercentage(records)).toBe(37.5);
  });

  it('ignores Excused records from the total class denominator', () => {
    const records: AttendanceItem[] = [
      { status: 'P' },
      { status: 'excused' },
      { status: 'P' },
    ];
    // 2 Present / 2 counted = 100%
    expect(calculateAttendancePercentage(records)).toBe(100);
  });

  it('clamps calculated percentage between 0 and 100', () => {
    const records: AttendanceItem[] = [
      { status: 'P' },
      { status: 'A' },
    ];
    const pct = calculateAttendancePercentage(records);
    expect(pct).toBeGreaterThanOrEqual(0);
    expect(pct).toBeLessThanOrEqual(100);
    expect(pct).toBe(50);
  });
});
