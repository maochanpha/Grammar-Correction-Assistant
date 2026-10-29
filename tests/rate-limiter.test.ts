import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, resetRateLimits } from '../src/lib/rate-limiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it('allows initial requests for guests and tracks remaining quota', () => {
    const res1 = checkRateLimit('192.168.1.1', false);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(24); // 25 - 1

    const res2 = checkRateLimit('192.168.1.1', false);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(23);
  });

  it('allows higher quota for authenticated users', () => {
    const res = checkRateLimit('user-123', true);
    expect(res.allowed).toBe(true);
    expect(res.totalLimit).toBe(150);
    expect(res.remaining).toBe(149);
  });

  it('blocks requests once limit is exhausted', () => {
    const id = 'spam-bot-ip';
    for (let i = 0; i < 25; i++) {
      checkRateLimit(id, false);
    }

    const blocked = checkRateLimit(id, false);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetInSeconds).toBeGreaterThan(0);
  });
});
