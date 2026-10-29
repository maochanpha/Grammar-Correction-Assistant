interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory token bucket / sliding window rate limiter
const guestLimits = new Map<string, RateLimitRecord>();
const userLimits = new Map<string, RateLimitRecord>();

const GUEST_MAX = 25; // requests per hour
const USER_MAX = 150; // requests per hour
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
  totalLimit: number;
}

export function checkRateLimit(
  identifier: string,
  isAuthenticated: boolean = false
): RateLimitResult {
  const now = Date.now();
  const store = isAuthenticated ? userLimits : guestLimits;
  const maxRequests = isAuthenticated ? USER_MAX : GUEST_MAX;

  const record = store.get(identifier);

  if (!record || now > record.resetTime) {
    store.set(identifier, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetInSeconds: Math.ceil(WINDOW_MS / 1000),
      totalLimit: maxRequests,
    };
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.ceil((record.resetTime - now) / 1000),
      totalLimit: maxRequests,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetInSeconds: Math.ceil((record.resetTime - now) / 1000),
    totalLimit: maxRequests,
  };
}

export function resetRateLimits(): void {
  guestLimits.clear();
  userLimits.clear();
}
