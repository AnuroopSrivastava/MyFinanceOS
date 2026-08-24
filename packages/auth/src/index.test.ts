import { describe, it, expect, beforeEach } from 'vitest';
import { authSession } from './index.js';

describe('AuthSessionManager', () => {
  beforeEach(() => {
    authSession.logout();
  });

  it('should login and logout correctly', async () => {
    expect(await authSession.isAuthenticated()).toBe(false);
    authSession.setSessionPin('mock_pin');
    expect(authSession.getSessionPin()).toBe('mock_pin');

    await authSession.logout();
    expect(await authSession.isAuthenticated()).toBe(false);
    expect(authSession.getSessionPin()).toBeNull();
  });
});
