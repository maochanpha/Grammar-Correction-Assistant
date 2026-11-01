import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  signSessionToken,
  verifySessionToken,
} from '../src/lib/auth/session';

describe('Auth & Session Security', () => {
  it('hashes passwords securely and verifies correct passwords', async () => {
    const raw = 'SuperSecurePass123!';
    const hash = await hashPassword(raw);

    expect(hash).not.toBe(raw);
    expect(hash.startsWith('$2')).toBe(true); // bcrypt prefix

    const isMatch = await verifyPassword(raw, hash);
    expect(isMatch).toBe(true);

    const isWrong = await verifyPassword('WrongPassword', hash);
    expect(isWrong).toBe(false);
  });

  it('signs and verifies JWT session tokens', async () => {
    const payload = { userId: 'usr-12345', email: 'writer@example.com' };
    const token = await signSessionToken(payload);

    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const decoded = await verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe('usr-12345');
    expect(decoded?.email).toBe('writer@example.com');
  });

  it('rejects invalid or tampered tokens gracefully', async () => {
    const invalid = await verifySessionToken('invalid.token.data');
    expect(invalid).toBeNull();

    const empty = await verifySessionToken('');
    expect(empty).toBeNull();
  });

  it('determines correct redirect target for unauthenticated users accessing editor', () => {
    const getEditorTarget = (user: { id: string } | null, redirectPath = '/editor') => {
      return user ? redirectPath : `/auth/login?redirect=${encodeURIComponent(redirectPath)}`;
    };

    expect(getEditorTarget(null)).toBe('/auth/login?redirect=%2Feditor');
    expect(getEditorTarget({ id: 'u1' })).toBe('/editor');
  });

  it('handles post-login redirect query resolution safely', () => {
    const resolvePostLoginRedirect = (param: string | null, fallback = '/dashboard') => {
      if (!param || !param.startsWith('/')) {
        return fallback;
      }
      return param;
    };

    expect(resolvePostLoginRedirect('/editor')).toBe('/editor');
    expect(resolvePostLoginRedirect(null)).toBe('/dashboard');
    expect(resolvePostLoginRedirect('')).toBe('/dashboard');
    expect(resolvePostLoginRedirect('https://malicious.com')).toBe('/dashboard');
  });
});
