import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import crypto from 'crypto';

beforeAll(() => {
  if (typeof globalThis.crypto === 'undefined') {
    globalThis.crypto = crypto.webcrypto as any;
  }
});

describe('DatabaseService', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true
    });
    vi.clearAllMocks();
  });

  it('should correctly report uninitialized when localStorage is empty', async () => {
    // Since we dynamically load it to avoid side effects during mock setup
    const { dbService } = await import('./index');
    expect(dbService.isInitialized()).toBe(false);
  });
});
