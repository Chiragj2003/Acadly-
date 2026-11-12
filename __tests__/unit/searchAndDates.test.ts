import { filterAcademicItems, toISODateString, isToday } from '@/lib/academicHelpers';

describe('Academic Helpers - Search Filter and Date Helpers', () => {
  const items = [
    { title: 'Newton Laws of Motion', subject: 'Physics' },
    { title: 'Thermodynamics & Heat', subject: 'Physics' },
    { title: 'Organic Chemistry Reactions', subject: 'Chemistry' },
    { title: 'Calculus: Derivatives', subject: 'Mathematics' },
  ];

  it('returns all items when query is empty or whitespace', () => {
    expect(filterAcademicItems(items, '')).toEqual(items);
    expect(filterAcademicItems(items, '   ')).toEqual(items);
  });

  it('filters items by matching title', () => {
    const res = filterAcademicItems(items, 'Newton');
    expect(res).toHaveLength(1);
    expect(res[0].title).toBe('Newton Laws of Motion');
  });

  it('filters items case-insensitively by subject', () => {
    const res = filterAcademicItems(items, 'physics');
    expect(res).toHaveLength(2);
  });

  it('returns empty array when no items match', () => {
    const res = filterAcademicItems(items, 'Biology');
    expect(res).toHaveLength(0);
  });

  it('formats dates consistently to YYYY-MM-DD', () => {
    const d = new Date(2026, 10, 12); // Month is 0-indexed: 10 = Nov
    expect(toISODateString(d)).toBe('2026-11-12');
  });

  it('correctly detects if a date string is today', () => {
    const todayStr = toISODateString(new Date());
    expect(isToday(todayStr)).toBe(true);
    expect(isToday('2020-01-01')).toBe(false);
  });
});
