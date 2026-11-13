/**
 * UX Debouncing & Client Throttling Utility:
 *
 * IMPORTANT SECURITY NOTE:
 * This in-memory client-side rate limiter is strictly UX throttling (preventing
 * double taps, UI button mash, and accidental request duplicates in the React Native UI).
 * It is NOT a security boundary and MUST NOT be relied upon for security defenses,
 * as any client-side code can be modified, bypassed, or inspected.
 *
 * TRUE SECURITY RATE LIMITING IS ENFORCED SERVER-SIDE:
 * 1. Supabase Auth (GoTrue) Built-in Server Rate Limits:
 *    - Sign-in with password: 30 attempts per hour per IP.
 *    - Sign-up: 30 attempts per hour per IP.
 *    - OTP / Magic Link / Email Confirmation: 3 requests per 60 seconds per email address.
 *    - Password Recovery: 3 requests per 60 seconds per email address.
 *    - Token Refresh: 60 requests per minute per IP.
 *
 * 2. Database Server-Side Throttle Tables (PostgreSQL):
 *    - `lookup_institute_by_code`: Enforces max 5 attempts per 10-minute window per IP / caller
 *      using `public.institute_code_lookup_attempts` table.
 *
 * 3. PostgreSQL Row Level Security (RLS) & Column Privileges:
 *    - Enforces fail-closed access control on every table regardless of client state.
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
 * Check if a client-side action has exceeded its UX debounce threshold.
 *
 * @param key Unique identifier for the action (e.g. `ux:login_button` or `ux:submit_quiz:assignmentId`)
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
 * Clear UX rate limits (useful in tests and logout transitions)
 */
export function clearRateLimits(): void {
  rateLimitRegistry.clear();
}
