import { describe, it, expect, beforeEach } from 'vitest';
import { authSession } from './index.js';

describe('AuthSessionManager', () => {
  beforeEach(() => {
    authSession.logout();
  });

  it('should login and logout correctly', () => {
    expect(authSession.isAuthenticated()).toBe(false);
    authSession.login('mock_token', { name: 'test' });
    expect(authSession.isAuthenticated()).toBe(true);
    expect(authSession.getAccessToken()).toBe('mock_token');
    expect(authSession.getUserProfile()).toEqual({ name: 'test' });

    authSession.logout();
    expect(authSession.isAuthenticated()).toBe(false);
    expect(() => authSession.getAccessToken()).toThrow();
  });
});
