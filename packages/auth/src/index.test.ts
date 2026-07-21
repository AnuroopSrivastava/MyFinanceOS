import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { authSession } from './index.js';
import crypto from 'crypto';

beforeAll(() => {
  if (typeof globalThis.crypto === 'undefined') {
    globalThis.crypto = crypto.webcrypto as any;
  }
});

describe('AuthSessionManager - Comprehensive Tests', () => {
  beforeEach(() => {
    authSession.logout();
    vi.clearAllMocks();
  });

  describe('setupPin', () => {
    it('should generate salt and verifier and establish session', async () => {
      const pin = '123456';
      const result = await authSession.setupPin(pin);
      
      expect(result).toHaveProperty('salt');
      expect(result).toHaveProperty('verifier');
      expect(typeof result.salt).toBe('string');
      expect(typeof result.verifier).toBe('string');
      expect(result.salt.length).toBeGreaterThan(0);
      expect(result.verifier.length).toBeGreaterThan(0);
      
      // Should automatically authenticate
      expect(authSession.isAuthenticated()).toBe(true);
      expect(authSession.getCurrentPin()).toBe(pin);
      expect(authSession.getActiveKey()).toBeDefined();
    });
  });

  describe('login', () => {
    it('should login successfully with correct PIN and stored credentials', async () => {
      const pin = '1234';
      const { salt, verifier } = await authSession.setupPin(pin);
      authSession.logout(); // simulate app restart
      
      const success = await authSession.login(pin, salt, verifier);
      expect(success).toBe(true);
      expect(authSession.isAuthenticated()).toBe(true);
      expect(authSession.getCurrentPin()).toBe(pin);
      expect(authSession.getActiveKey()).toBeDefined();
    });

    it('should fail login with incorrect PIN', async () => {
      const pin = '9999';
      const { salt, verifier } = await authSession.setupPin(pin);
      authSession.logout();
      
      const success = await authSession.login('0000', salt, verifier);
      expect(success).toBe(false);
      expect(authSession.isAuthenticated()).toBe(false);
      expect(() => authSession.getActiveKey()).toThrow('Unauthorized: Session is locked.');
    });

    it('should fail login if salt is tampered with', async () => {
      const pin = '1111';
      const { salt, verifier } = await authSession.setupPin(pin);
      authSession.logout();
      
      const success = await authSession.login(pin, salt + '0', verifier);
      expect(success).toBe(false);
      expect(authSession.isAuthenticated()).toBe(false);
    });
  });

  describe('Session State Management', () => {
    it('should clear session on logout', async () => {
      await authSession.setupPin('1234');
      expect(authSession.isAuthenticated()).toBe(true);
      
      authSession.logout();
      expect(authSession.isAuthenticated()).toBe(false);
      expect(() => authSession.getActiveKey()).toThrow('Unauthorized: Session is locked.');
      expect(() => authSession.getCurrentPin()).toThrow('Unauthorized: Session is locked.');
    });

    it('should protect activeKey and currentPin access when not authenticated', () => {
      expect(() => authSession.getActiveKey()).toThrow();
      expect(() => authSession.getCurrentPin()).toThrow();
    });
  });
});
