// Cryptography Helpers using Standard Web Crypto API (supported in Node.js & modern browsers)
import { argon2id } from 'hash-wasm';


const getCrypto = (): Crypto => {
  const g = typeof globalThis !== 'undefined'
    ? globalThis
    : typeof self !== 'undefined'
      ? self
      : typeof window !== 'undefined'
        ? window
        : null;
  if (g && (g as unknown as { crypto?: Crypto }).crypto) {
    return (g as unknown as { crypto: Crypto }).crypto;
  }
  throw new Error('Web Crypto API is not supported in this environment.');
};

const getSubtle = (): SubtleCrypto => {
  return getCrypto().subtle;
};

// Convert string to UTF-8 array buffer
const textEncode = (text: string): Uint8Array => {
  return new Uint8Array(new TextEncoder().encode(text));
};

// Convert array buffer to UTF-8 string
const textDecode = (buffer: ArrayBuffer): string => {
  return new TextDecoder().decode(buffer);
};

// Convert ArrayBuffer to Hex String
export const bufferToHex = (buffer: ArrayBuffer): string => {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Convert Hex String to ArrayBuffer
export const hexToBuffer = (hex: string): ArrayBuffer => {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  if (cleanHex.length % 2 !== 0) throw new Error('Invalid Hex String');
  const buffer = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    buffer[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return buffer.buffer;
};

// Generate a random salt (hex string)
export const generateSalt = (bytes = 16): string => {
  const array = new Uint8Array(bytes);
  getCrypto().getRandomValues(array);
  return bufferToHex(array.buffer);
};

// Derive key using PBKDF2
export const deriveKey = async (password: string, saltHex: string): Promise<CryptoKey> => {
  const subtle = getSubtle();
  const passwordBuffer = textEncode(password);
  const saltBuffer = hexToBuffer(saltHex);

  const baseKey = await subtle.importKey(
    'raw',
    passwordBuffer as unknown as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

// Encrypt payload string with AES-256-GCM
export const encrypt = async (plainText: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> => {
  const subtle = getSubtle();
  const ivArray = new Uint8Array(12);
  
  getCrypto().getRandomValues(ivArray);

  const encoded = textEncode(plainText);
  const encryptedBuffer = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: ivArray
    },
    key,
    encoded as unknown as BufferSource
  );

  return {
    ciphertext: bufferToHex(encryptedBuffer),
    iv: bufferToHex(ivArray.buffer)
  };
};

// Decrypt ciphertext hex string with AES-256-GCM
export const decrypt = async (ciphertextHex: string, ivHex: string, key: CryptoKey): Promise<string> => {
  const subtle = getSubtle();
  const ciphertextBuffer = hexToBuffer(ciphertextHex);
  const ivBuffer = hexToBuffer(ivHex);

  const decryptedBuffer = await subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer
    },
    key,
    ciphertextBuffer
  );

  return textDecode(decryptedBuffer);
};

// Helper to double-hash a password/PIN for storage validation (Legacy/Fast Hash)
export const hashPin = async (pin: string, saltHex: string): Promise<string> => {
  const saltBuffer = new Uint8Array(hexToBuffer(saltHex));
  return await argon2id({
    password: pin,
    salt: saltBuffer,
    parallelism: 1,
    memorySize: 19456,
    iterations: 2,
    hashLength: 32
  });
};

// Securely hash a password/PIN for database storage using PBKDF2 (100k iterations)
export const hashPassword = async (password: string, saltHex: string): Promise<string> => {
  const saltBuffer = new Uint8Array(hexToBuffer(saltHex));
  return await argon2id({
    password: password,
    salt: saltBuffer,
    parallelism: 1,
    memorySize: 19456,
    iterations: 2,
    hashLength: 32
  });
};

// Legacy fixed-salt SHA-256 PIN hash (pre-argon2id format). Used only to verify
// hashes created by the old generatePinHash implementations.
const LEGACY_PIN_SALT = 'financeos_salt_v1';

export const hashLegacyPin = async (pin: string): Promise<string> => {
  const subtle = getSubtle();
  const data = textEncode(pin + LEGACY_PIN_SALT);
  // Cast to BufferSource: textEncode returns Uint8Array<ArrayBufferLike>, which
  // TS 5.7+ no longer considers assignable to the BufferSource param of digest().
  const hash = await subtle.digest('SHA-256', data as BufferSource);
  return bufferToHex(hash);
};

// Create a new PIN hash in "saltHex:argon2hash" format with a fresh random salt.
export const createPinHash = async (pin: string): Promise<string> => {
  const salt = generateSalt(16);
  const hash = await hashPin(pin, salt);
  return `${salt}:${hash}`;
};

// Verify a stored PIN hash. Accepts both the new argon2id format ("salt:hash")
// and the legacy fixed-salt SHA-256 format. Never mutates stored data during
// verification; `needsRehash` signals a future Settings -> Security upgrade pass.
export const verifyPin = async (pin: string, storedHash: string): Promise<{ ok: boolean; needsRehash: boolean }> => {
  if (!storedHash) return { ok: false, needsRehash: false };
  if (storedHash.includes(':')) {
    const parts = storedHash.split(':');
    if (parts.length !== 2) return { ok: false, needsRehash: false };
    const [salt, expected] = parts;
    try {
      const actual = await hashPin(pin, salt);
      return { ok: actual === expected, needsRehash: false };
    } catch (e) {
      return { ok: false, needsRehash: false };
    }
  }
  // Legacy fixed-salt SHA-256
  const expected = await hashLegacyPin(pin);
  return { ok: expected === storedHash, needsRehash: true };
};

// Encrypt string with PIN to salt:iv:ciphertext format
export const encryptData = async (plainText: string, pin: string): Promise<string> => {
  const salt = generateSalt(16);
  const key = await deriveKey(pin, salt);
  const { ciphertext, iv } = await encrypt(plainText, key);
  return `${salt}:${iv}:${ciphertext}`;
};

// Decrypt salt:iv:ciphertext format string with PIN
export const decryptData = async (payload: string, pin: string): Promise<string> => {
  const parts = payload.split(':');
  if (parts.length !== 3) throw new Error('Invalid payload format');
  const [salt, iv, ciphertext] = parts;
  const key = await deriveKey(pin, salt);
  return await decrypt(ciphertext, iv, key);
};
