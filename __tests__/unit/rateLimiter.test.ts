import { checkRateLimit, clearRateLimits } from '@/lib/rateLimiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    clearRateLimits();
  });

  it('allows requests within the limit', () => {
    const key = 'test-key-1';
    const res1 = checkRateLimit(key, 3, 10000);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = checkRateLimit(key, 3, 10000);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = checkRateLimit(key, 3, 10000);
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it('blocks requests exceeding the limit within the time window', () => {
    const key = 'test-key-2';
    checkRateLimit(key, 2, 5000);
    checkRateLimit(key, 2, 5000);

    const blocked = checkRateLimit(key, 2, 5000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });
});
