import { evaluateRoleAccess } from '@/hooks/useRoleGuard';

describe('Role Guard Logic & Access Evaluation', () => {
  it('keeps isAuthorized false and redirectRoute null while loading', () => {
    const access = evaluateRoleAccess(null, null, true, ['teacher']);
    expect(access.isAuthorized).toBe(false);
    expect(access.redirectRoute).toBeNull();
  });

  it('redirects unauthenticated user to /auth', () => {
    const access = evaluateRoleAccess(null, null, false, ['student']);
    expect(access.isAuthorized).toBe(false);
    expect(access.redirectRoute).toBe('/auth');
  });

  it('authorizes matching user role without redirect', () => {
    const user = { id: 'teacher-uuid-01' };
    const access = evaluateRoleAccess(user, 'teacher', false, ['teacher', 'admin']);
    expect(access.isAuthorized).toBe(true);
    expect(access.redirectRoute).toBeNull();
  });

  it('redirects unauthorized student to /student when accessing teacher route', () => {
    const user = { id: 'student-uuid-01' };
    const access = evaluateRoleAccess(user, 'student', false, ['teacher']);
    expect(access.isAuthorized).toBe(false);
    expect(access.redirectRoute).toBe('/student');
  });

  it('redirects unauthorized teacher to /teacher when accessing admin route', () => {
    const user = { id: 'teacher-uuid-01' };
    const access = evaluateRoleAccess(user, 'teacher', false, ['admin']);
    expect(access.isAuthorized).toBe(false);
    expect(access.redirectRoute).toBe('/teacher');
  });

  it('redirects unauthorized parent to /parent when accessing teacher route', () => {
    const user = { id: 'parent-uuid-01' };
    const access = evaluateRoleAccess(user, 'parent', false, ['teacher']);
    expect(access.isAuthorized).toBe(false);
    expect(access.redirectRoute).toBe('/parent');
  });
});
