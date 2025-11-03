// Simple encryption/decryption utilities using Base64 and XOR cipher
// For production, consider using Web Crypto API for stronger encryption

const XOR_KEY = "OCX_SECURE_KEY_2024";

export const encryptText = (text: string): string => {
  const encrypted = xorCipher(text, XOR_KEY);
  // Handle Unicode by converting to base64 safely
  return btoa(encodeURIComponent(encrypted).replace(/%([0-9A-F]{2})/g, (_, p1) => 
    String.fromCharCode(parseInt(p1, 16))
  ));
};

export const decryptText = (encrypted: string): string => {
  try {
    const decoded = atob(encrypted);
    // Handle Unicode by decoding safely
    const decoded2 = decodeURIComponent(Array.from(decoded).map(c => 
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    return xorCipher(decoded2, XOR_KEY);
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
  
  // Handle Unicode safely
  const jsonString = JSON.stringify(payload);
  const encoded = btoa(encodeURIComponent(jsonString).replace(/%([0-9A-F]{2})/g, (_, p1) => 
    String.fromCharCode(parseInt(p1, 16))
  ));
  const encodedKey = btoa(encodeURIComponent(key).replace(/%([0-9A-F]{2})/g, (_, p1) => 
    String.fromCharCode(parseInt(p1, 16))
  ));
  
  return {
    encrypted: encoded,
    key: encodedKey
  };
};

export const decryptWithKey = (encrypted: string, key: string): string => {
  try {
    const decoded = atob(encrypted);
    // Handle Unicode decoding
    const decodedString = decodeURIComponent(Array.from(decoded).map(c => 
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    
    const decodedKeyRaw = atob(key);
    const decodedKey = decodeURIComponent(Array.from(decodedKeyRaw).map(c => 
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    
    // Try to parse as JSON payload (new format with expiration)
    try {
      const payload = JSON.parse(decodedString);
      
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
    return xorCipher(decodedString, decodedKey);
  } catch (error) {
    if (error instanceof Error && error.message === "Decryption key has expired") {
      throw error;
    }
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
