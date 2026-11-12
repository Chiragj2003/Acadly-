/**
 * In-memory client-side rate limiter for sensitive interactions.
 * Prevents rapid double-clicks and request spamming.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitRegistry = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs?: number;
}

/**
 * Check if an action key has exceeded its rate limit.
 *
 * @param key Unique key for the rate-limited action (e.g. `login:user@example.com` or `submit_quiz:assignmentId`)
 * @param maxRequests Maximum allowable requests within the window
 * @param windowMs Time window in milliseconds
 */
export function checkRateLimit(key: string, maxRequests: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitRegistry.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitRegistry.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
    };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, entry.resetAt - now),
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
  };
}

/**
 * Clear rate limits (useful in tests and logout)
 */
export function clearRateLimits(): void {
  rateLimitRegistry.clear();
}
