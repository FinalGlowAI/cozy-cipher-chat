// Simple encryption/decryption utilities using Base64 and XOR cipher
// For production, consider using Web Crypto API for stronger encryption

const XOR_KEY = "OCX_SECURE_KEY_2024";

export const encryptText = (text: string): string => {
  const encrypted = xorCipher(text, XOR_KEY);
  return btoa(encrypted);
};

export const decryptText = (encrypted: string): string => {
  try {
    const decoded = atob(encrypted);
    return xorCipher(decoded, XOR_KEY);
  } catch {
    throw new Error("Invalid encrypted text");
  }
};

export const encryptWithKey = (text: string): { encrypted: string; key: string } => {
  // Generate a random key
  const key = generateRandomKey(32);
  const encrypted = xorCipher(text, key);
  return {
    encrypted: btoa(encrypted),
    key: btoa(key)
  };
};

export const decryptWithKey = (encrypted: string, key: string): string => {
  try {
    const decoded = atob(encrypted);
    const decodedKey = atob(key);
    return xorCipher(decoded, decodedKey);
  } catch {
    throw new Error("Invalid encrypted text or key");
  }
};

const xorCipher = (text: string, key: string): string => {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
};

const generateRandomKey = (length: number): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let key = "";
  for (let i = 0; i < length; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
};
