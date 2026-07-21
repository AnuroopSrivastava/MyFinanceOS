import { describe, it, expect, beforeAll } from 'vitest';
import { generateSalt, deriveKey, encrypt, decrypt, hashPin, bufferToHex, hexToBuffer } from './crypto';
import crypto from 'crypto';
import { faker } from '@faker-js/faker';

beforeAll(() => {
  // Polyfill Web Crypto for Node.js environment during Vitest run
  if (typeof globalThis.crypto === 'undefined') {
    globalThis.crypto = crypto.webcrypto as any;
  }
});

describe('Cryptography Utilities - Deep Testing', () => {
  describe('Buffer & Hex utilities', () => {
    it('should correctly convert buffer to hex and back', () => {
      const originalHex = 'deadbeef1234567890abcdef';
      const buffer = hexToBuffer(originalHex);
      const convertedHex = bufferToHex(buffer);
      expect(convertedHex).toBe(originalHex);
    });

    it('should handle odd length hex by throwing error', () => {
      expect(() => hexToBuffer('123')).toThrow('Invalid Hex String');
    });

    it('should strip non-hex characters gracefully or throw if invalid length after strip', () => {
      const buffer = hexToBuffer('de-ad-be-ef');
      expect(bufferToHex(buffer)).toBe('deadbeef');
    });
  });

  describe('generateSalt', () => {
    it('should generate a salt of requested length', () => {
      const salt16 = generateSalt(16);
      expect(salt16.length).toBe(32); // 16 bytes = 32 hex chars

      const salt32 = generateSalt(32);
      expect(salt32.length).toBe(64);
    });

    it('should generate unique salts', () => {
      const salts = new Set(Array.from({ length: 100 }, () => generateSalt()));
      expect(salts.size).toBe(100); // Probability of collision is astronomically low
    });
  });

  describe('Encryption & Decryption (AES-256-GCM)', () => {
    it('should correctly encrypt and decrypt small payloads', async () => {
      const salt = generateSalt();
      const key = await deriveKey('password123', salt);
      const original = 'Hello World';
      const { ciphertext, iv } = await encrypt(original, key);
      const decrypted = await decrypt(ciphertext, iv, key);
      expect(decrypted).toBe(original);
    });

    it('should correctly encrypt and decrypt massive payloads', async () => {
      const salt = generateSalt();
      const key = await deriveKey('strong-password', salt);
      
      // Generate a ~5MB string
      const largePayload = 'A'.repeat(5 * 1024 * 1024);
      const { ciphertext, iv } = await encrypt(largePayload, key);
      const decrypted = await decrypt(ciphertext, iv, key);
      expect(decrypted.length).toBe(largePayload.length);
      expect(decrypted === largePayload).toBe(true);
    });

    it('should handle complex UTF-8 characters and emojis correctly', async () => {
      const salt = generateSalt();
      const key = await deriveKey('utf8-test', salt);
      const complexString = 'Hello 🌍! नमस्ते, 这是一个测试. \uD83D\uDE00';
      const { ciphertext, iv } = await encrypt(complexString, key);
      const decrypted = await decrypt(ciphertext, iv, key);
      expect(decrypted).toBe(complexString);
    });

    it('should fail decryption with incorrect key', async () => {
      const salt = generateSalt();
      const key1 = await deriveKey('correct-password', salt);
      const key2 = await deriveKey('wrong-password', salt);
      const { ciphertext, iv } = await encrypt('secret', key1);
      await expect(decrypt(ciphertext, iv, key2)).rejects.toThrow();
    });

    it('should fail decryption if ciphertext is tampered with', async () => {
      const salt = generateSalt();
      const key = await deriveKey('password123', salt);
      const { ciphertext, iv } = await encrypt('secret message', key);
      
      // Tamper with ciphertext by flipping last character
      const tampered = ciphertext.substring(0, ciphertext.length - 1) + (ciphertext.endsWith('0') ? '1' : '0');
      
      // AES-GCM includes auth tag, tampering will throw
      await expect(decrypt(tampered, iv, key)).rejects.toThrow();
    });
  });

  describe('Fuzzing Encryption with random data', () => {
    it('should successfully encrypt and decrypt 50 randomized payloads', async () => {
      const salt = generateSalt();
      const key = await deriveKey('fuzz-test', salt);
      
      for (let i = 0; i < 50; i++) {
        // Generate a random string that could include special chars, unicode, etc
        const randomPayload = faker.string.sample({ min: 1, max: 10000 });
        const { ciphertext, iv } = await encrypt(randomPayload, key);
        const decrypted = await decrypt(ciphertext, iv, key);
        expect(decrypted).toBe(randomPayload);
      }
    });
  });

  describe('hashPin', () => {
    it('should hash deterministically', async () => {
      const salt = generateSalt();
      const pin = '123456';
      const hash1 = await hashPin(pin, salt);
      const hash2 = await hashPin(pin, salt);
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64);
    });

    it('should produce different hashes for different salts', async () => {
      const pin = '123456';
      const hash1 = await hashPin(pin, generateSalt());
      const hash2 = await hashPin(pin, generateSalt());
      expect(hash1).not.toBe(hash2);
    });
  });
});
