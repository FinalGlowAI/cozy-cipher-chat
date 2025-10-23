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

export const encryptWithKey = (text: string, expirationMinutes?: number): { encrypted: string; key: string } => {
  // Generate a random key
  const key = generateRandomKey(32);
  const encrypted = xorCipher(text, key);
  
  // Calculate expiration timestamp if provided
  const expiresAt = expirationMinutes ? Date.now() + (expirationMinutes * 60 * 1000) : null;
  
  // Create payload with expiration info
  const payload = {
    data: encrypted,
    expiresAt
  };
  
  return {
    encrypted: btoa(JSON.stringify(payload)),
    key: btoa(key)
  };
};

export const decryptWithKey = (encrypted: string, key: string): string => {
  try {
    const decoded = atob(encrypted);
    const decodedKey = atob(key);
    
    // Try to parse as JSON payload (new format with expiration)
    try {
      const payload = JSON.parse(decoded);
      
      // Check if it has expiration info
      if (payload.expiresAt !== undefined) {
        // Check if expired
        if (payload.expiresAt && Date.now() > payload.expiresAt) {
          throw new Error("Decryption key has expired");
        }
        // Decrypt the actual data
        return xorCipher(payload.data, decodedKey);
      }
    } catch (jsonError) {
      // If JSON parsing fails, treat as old format (backward compatibility)
    }
    
    // Old format - direct decryption
    return xorCipher(decoded, decodedKey);
  } catch (error) {
    if (error instanceof Error && error.message === "Decryption key has expired") {
      throw error;
    }
    throw new Error("Invalid encrypted text or key");
  }
};

const xorCipher = (text: string, key: string): string => {
  // Encode text as UTF-8 bytes to properly handle emojis and all Unicode characters
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const textBytes = encoder.encode(text);
  const keyBytes = encoder.encode(key);
  const resultBytes = new Uint8Array(textBytes.length);
  
  for (let i = 0; i < textBytes.length; i++) {
    resultBytes[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  // Convert bytes to string for base64 encoding
  return decoder.decode(resultBytes);
};

const generateRandomKey = (length: number): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let key = "";
  for (let i = 0; i < length; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
};
