import { describe, it, expect, beforeAll } from 'vitest';
import { generateSalt, deriveKey, encrypt, decrypt, hashPin } from './crypto';
import crypto from 'crypto';

beforeAll(() => {
  // Polyfill Web Crypto for Node.js environment during Vitest run
  if (typeof globalThis.crypto === 'undefined') {
    globalThis.crypto = crypto.webcrypto as any;
  }
});

describe('Cryptography Utilities', () => {
  it('should generate a 16-byte salt', () => {
    const salt = generateSalt(16);
    expect(salt).toBeTypeOf('string');
    expect(salt.length).toBe(32); // 16 bytes = 32 hex chars
  });

  it('should encrypt and decrypt a string payload successfully', async () => {
    const salt = generateSalt(16);
    const key = await deriveKey('test-password-123!', salt);

    const originalText = 'Highly confidential wealth data';
    const { ciphertext, iv } = await encrypt(originalText, key);

    expect(ciphertext).not.toBe(originalText);
    
    const decryptedText = await decrypt(ciphertext, iv, key);
    expect(decryptedText).toBe(originalText);
  });

  it('should throw error when decrypting with wrong key', async () => {
    const salt = generateSalt(16);
    const key1 = await deriveKey('correct-password', salt);
    const key2 = await deriveKey('wrong-password', salt);

    const { ciphertext, iv } = await encrypt('secret', key1);

    await expect(decrypt(ciphertext, iv, key2)).rejects.toThrow();
  });

  it('should securely hash a PIN', async () => {
    const salt = generateSalt();
    const pin = '123456';
    const hash = await hashPin(pin, salt);
    
    expect(hash).toBeTypeOf('string');
    expect(hash.length).toBe(64); // SHA-256 is 32 bytes = 64 hex chars
    
    // Hash should be deterministic
    const hash2 = await hashPin(pin, salt);
    expect(hash).toBe(hash2);
  });
});
