// Simple encryption/decryption utilities using Base64 and XOR cipher
// For production, consider using Web Crypto API for stronger encryption

const XOR_KEY = "OCX_SECURE_KEY_2024";

export const encryptText = (text: string): string => {
  // Generate random IV (16 bytes)
  const iv = new Uint8Array(16);
  crypto.getRandomValues(iv);
  
  const plainBytes = textEncoder.encode(text);
  const keyBytes = textEncoder.encode(XOR_KEY);
  
  // Combine IV with key for encryption
  const combinedKey = new Uint8Array(iv.length + keyBytes.length);
  combinedKey.set(iv);
  combinedKey.set(keyBytes, iv.length);
  
  const encryptedBytes = xorBytes(plainBytes, combinedKey);
  
  // Prepend IV to encrypted data
  const result = new Uint8Array(iv.length + encryptedBytes.length);
  result.set(iv);
  result.set(encryptedBytes, iv.length);
  
  return bytesToBase64(result);
};

export const decryptText = (encrypted: string): string => {
  try {
    const dataWithIV = base64ToBytes(encrypted);
    
    // Check if it has IV (new format, length > 16)
    if (dataWithIV.length > 16) {
      // Extract IV (first 16 bytes)
      const iv = dataWithIV.slice(0, 16);
      const encBytes = dataWithIV.slice(16);
      
      const keyBytes = textEncoder.encode(XOR_KEY);
      
      // Combine IV with key for decryption
      const combinedKey = new Uint8Array(iv.length + keyBytes.length);
      combinedKey.set(iv);
      combinedKey.set(keyBytes, iv.length);
      
      const plainBytes = xorBytes(encBytes, combinedKey);
      return textDecoder.decode(plainBytes);
    } else {
      // Old format without IV
      const keyBytes = textEncoder.encode(XOR_KEY);
      const plainBytes = xorBytes(dataWithIV, keyBytes);
      return textDecoder.decode(plainBytes);
    }
  } catch {
    // Fallback to old format (backward compatibility)
    try {
      const decoded = atob(encrypted);
      const decoded2 = decodeURIComponent(Array.from(decoded).map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      return xorCipher(decoded2, XOR_KEY);
    } catch {
      throw new Error("Invalid encrypted text");
    }
  }
};

export const encryptWithKey = (text: string, expirationMinutes?: number): { encrypted: string; key: string } => {
  // Generate a random key
  const key = generateRandomKey(32);

  // Encrypt using byte-wise XOR
  const plainBytes = textEncoder.encode(text);
  const keyBytes = textEncoder.encode(key);
  const encryptedBytes = xorBytes(plainBytes, keyBytes);
  
  // Calculate expiration timestamp if provided
  const expiresAt = expirationMinutes ? Date.now() + (expirationMinutes * 60 * 1000) : null;
  
  // Create payload with expiration info and base64-encoded data
  const payload = {
    data: bytesToBase64(encryptedBytes),
    expiresAt
  };
  
  const encoded = utf8ToBase64(JSON.stringify(payload));
  const encodedKey = utf8ToBase64(key);
  
  return {
    encrypted: encoded,
    key: encodedKey
  };
};

export const decryptWithKey = (encrypted: string, key: string): string => {
  try {
    const decodedString = safeBase64ToUtf8(encrypted);
    const decodedKey = safeBase64ToUtf8(key);
    
    // Try to parse as JSON payload (new format with expiration)
    try {
      const payload = JSON.parse(decodedString);
      
      // Check if it has expiration info
      if (payload.expiresAt !== undefined) {
        // Check if expired
        if (payload.expiresAt && Date.now() > payload.expiresAt) {
          throw new Error("Decryption key has expired");
        }
        // New format: payload.data is base64 of encrypted bytes
        try {
          const dataBytes = base64ToBytes(payload.data);
          const keyBytes = textEncoder.encode(decodedKey);
          const plainBytes = xorBytes(dataBytes, keyBytes);
          return textDecoder.decode(plainBytes);
        } catch {
          // Backward compatibility: old format where payload.data is XOR string
          return xorCipher(payload.data, decodedKey);
        }
      }
    } catch (jsonError) {
      // If JSON parsing fails, treat as old format (backward compatibility)
    }
    
    // Old format - direct decryption
    return xorCipher(decodedString, decodedKey);
  } catch (error) {
    if (error instanceof Error && error.message === "Decryption key has expired") {
      throw error;
    }
    throw new Error("Invalid encrypted text or key");
  }
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/**
 * XOR two byte arrays using repeating key
 */
const xorBytes = (data: Uint8Array, key: Uint8Array): Uint8Array => {
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    out[i] = data[i] ^ key[i % key.length];
  }
  return out;
};

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToBytes = (b64: string): Uint8Array => {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const utf8ToBase64 = (str: string): string => {
  return bytesToBase64(textEncoder.encode(str));
};

const base64ToUtf8 = (b64: string): string => {
  return textDecoder.decode(base64ToBytes(b64));
};

// Backward-compatible decoder that supports old percent-encoding approach
const safeBase64ToUtf8 = (b64: string): string => {
  try {
    const s = base64ToUtf8(b64);
    // Round-trip check: if re-encoding matches original, it's safe UTF-8
    if (utf8ToBase64(s) === b64) return s;
  } catch {}
  // Legacy fallback to percent-decoding
  const decoded = atob(b64);
  return decodeURIComponent(
    Array.from(decoded)
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
};

// Legacy string-based XOR (kept for backward compatibility)
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
