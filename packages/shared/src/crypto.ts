// Cryptography Helpers using Standard Web Crypto API (supported in Node.js & modern browsers)

const getSubtle = (): SubtleCrypto => {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto.subtle;
  }
  // Fallback for older Node versions if needed, but Node 26 has globalThis.crypto
  throw new Error('Web Crypto API is not supported in this environment.');
};

// Convert string to UTF-8 array buffer
const textEncode = (text: string): Uint8Array => {
  return new TextEncoder().encode(text);
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
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    globalThis.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < bytes; i++) array[i] = Math.floor(Math.random() * 256);
  }
  return bufferToHex(array.buffer);
};

// Derive key using PBKDF2
export const deriveKey = async (password: string, saltHex: string): Promise<CryptoKey> => {
  const subtle = getSubtle();
  const passwordBuffer = textEncode(password);
  const saltBuffer = hexToBuffer(saltHex);

  const baseKey = await subtle.importKey(
    'raw',
    passwordBuffer as any,
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
  
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(ivArray);
  } else {
    globalThis.crypto.getRandomValues(ivArray);
  }

  const encoded = textEncode(plainText);
  const encryptedBuffer = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: ivArray
    },
    key,
    encoded as any
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

// Helper to double-hash a password/PIN for storage validation
export const hashPin = async (pin: string, saltHex: string): Promise<string> => {
  const subtle = getSubtle();
  const pinWithSalt = pin + saltHex;
  const encoded = textEncode(pinWithSalt);
  const hashBuffer = await subtle.digest('SHA-256', encoded as any);
  return bufferToHex(hashBuffer);
};
