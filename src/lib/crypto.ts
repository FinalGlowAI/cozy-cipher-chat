// AES-256-GCM encryption using Web Crypto API with backward compatibility for legacy XOR cipher
// All new encryptions use AES-256-GCM with user-provided passwords

const ENCRYPTION_VERSION = "v2"; // AES-256-GCM
const LEGACY_VERSION = "v1"; // XOR cipher (for backward compatibility)
const LEGACY_XOR_KEY = "OCX_SECURE_KEY_2024"; // Only used for decrypting old data

// Key derivation settings for AES-256-GCM
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12; // GCM standard IV length
const VERSION_MARKER = 3; // New version with user password

/**
 * Encrypt text using AES-256-GCM with user-provided password
 */
export const encryptText = async (text: string, password: string): Promise<string> => {
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  
  // Check for password strength (at least one uppercase, one lowercase, one number)
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  if (!hasUppercase || !hasLowercase || !hasNumber) {
    throw new Error("Password must contain at least one uppercase letter, one lowercase letter, and one number");
  }
  
  try {
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    // Derive encryption key from user password using PBKDF2
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );
    
    // Encrypt the text
    const encrypted = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      new TextEncoder().encode(text)
    );
    
    // Combine version + salt + iv + encrypted data
    const result = new Uint8Array(
      1 + salt.length + iv.length + encrypted.byteLength
    );
    result[0] = VERSION_MARKER; // version byte (3 = AES-256-GCM with user password)
    result.set(salt, 1);
    result.set(iv, 1 + salt.length);
    result.set(new Uint8Array(encrypted), 1 + salt.length + iv.length);
    
    return bytesToBase64(result);
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt text");
  }
};

/**
 * Decrypt text - supports AES-256-GCM with user password, legacy AES, and XOR cipher
 */
export const decryptText = async (encrypted: string, password: string): Promise<string> => {
  // Decode base64 first; if it isn't base64, treat it as legacy.
  let data: Uint8Array;
  try {
    data = base64ToBytes(encrypted);
  } catch {
    try {
      return decryptTextLegacy(encrypted);
    } catch {
      throw new Error("Wrong password or corrupted data");
    }
  }

  // Minimal length checks to avoid mis-detecting random/legacy payloads as v3/v2.
  const minV3Length = 1 + SALT_LENGTH + IV_LENGTH + 1;
  const minV2Length = 1 + SALT_LENGTH + IV_LENGTH + 1;

  const version = data[0];

  if (version === 3 && data.length >= minV3Length) {
    // AES-256-GCM with user password
    if (!password) {
      throw new Error("Password required for decryption");
    }

    const salt = data.slice(1, 1 + SALT_LENGTH);
    const iv = data.slice(1 + SALT_LENGTH, 1 + SALT_LENGTH + IV_LENGTH);
    const ciphertext = data.slice(1 + SALT_LENGTH + IV_LENGTH);

    try {
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"]
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt,
          iterations: PBKDF2_ITERATIONS,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );

      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        ciphertext
      );

      return new TextDecoder().decode(decrypted);
    } catch {
      // IMPORTANT: Do NOT fall back to legacy here; wrong password must surface as wrong password.
      throw new Error("Wrong password or corrupted data");
    }
  }

  if (version === 2 && data.length >= minV2Length) {
    // Legacy AES-256-GCM with hardcoded key (for backward compatibility)
    const salt = data.slice(1, 1 + SALT_LENGTH);
    const iv = data.slice(1 + SALT_LENGTH, 1 + SALT_LENGTH + IV_LENGTH);
    const ciphertext = data.slice(1 + SALT_LENGTH + IV_LENGTH);

    try {
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(LEGACY_XOR_KEY),
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"]
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt,
          iterations: PBKDF2_ITERATIONS,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );

      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        ciphertext
      );

      return new TextDecoder().decode(decrypted);
    } catch {
      // If we mis-detected the format, legacy XOR might still succeed.
      try {
        return decryptTextLegacy(encrypted);
      } catch {
        throw new Error("Wrong password or corrupted data");
      }
    }
  }

  // Legacy XOR cipher decryption (backward compatibility)
  try {
    return decryptTextLegacy(encrypted);
  } catch {
    throw new Error("Wrong password or corrupted data");
  }
};

/**
 * Encrypt with custom key using AES-256-GCM
 */
export const encryptWithKey = async (
  text: string,
  expirationMinutes?: number
): Promise<{ encrypted: string; key: string }> => {
  try {
    // Generate random encryption key (32 bytes for AES-256)
    const keyBytes = crypto.getRandomValues(new Uint8Array(32));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    // Import the key for AES-GCM
    const key = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      "AES-GCM",
      true,
      ["encrypt"]
    );
    
    // Encrypt the text
    const encrypted = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      new TextEncoder().encode(text)
    );
    
    // Calculate expiration timestamp if provided
    const expiresAt = expirationMinutes
      ? Date.now() + expirationMinutes * 60 * 1000
      : null;
    
    // Create payload with version, expiration, IV, and encrypted data
    const payload = {
      version: ENCRYPTION_VERSION,
      data: bytesToBase64(new Uint8Array(encrypted)),
      iv: bytesToBase64(iv),
      expiresAt
    };
    
    return {
      encrypted: utf8ToBase64(JSON.stringify(payload)),
      key: bytesToBase64(keyBytes)
    };
  } catch (error) {
    console.error("Encryption with key error:", error);
    throw new Error("Failed to encrypt with key");
  }
};

/**
 * Decrypt with custom key - supports both AES-256-GCM (new) and XOR cipher (legacy)
 */
export const decryptWithKey = async (
  encrypted: string,
  key: string
): Promise<string> => {
  try {
    const decodedString = safeBase64ToUtf8(encrypted);
    
    // Try to parse as JSON payload (both new and old formats)
    try {
      const payload = JSON.parse(decodedString);
      
      // Check if it has expiration info
      if (payload.expiresAt !== undefined) {
        // Check if expired
        if (payload.expiresAt && Date.now() > payload.expiresAt) {
          throw new Error("Decryption key has expired");
        }
        
        // Check version
        if (payload.version === ENCRYPTION_VERSION && payload.iv) {
          // New format: AES-256-GCM
          const keyBytes = base64ToBytes(key);
          const ivBytes = base64ToBytes(payload.iv);
          const dataBytes = base64ToBytes(payload.data);
          
          const cryptoKey = await crypto.subtle.importKey(
            "raw",
            keyBytes.buffer.slice(keyBytes.byteOffset, keyBytes.byteOffset + keyBytes.byteLength) as ArrayBuffer,
            "AES-GCM",
            false,
            ["decrypt"]
          );
          
          const decrypted = await crypto.subtle.decrypt(
            {
              name: "AES-GCM",
              iv: ivBytes.buffer.slice(ivBytes.byteOffset, ivBytes.byteOffset + ivBytes.byteLength) as ArrayBuffer
            },
            cryptoKey,
            dataBytes.buffer.slice(dataBytes.byteOffset, dataBytes.byteOffset + dataBytes.byteLength) as ArrayBuffer
          );
          
          return new TextDecoder().decode(decrypted);
        } else {
          // Legacy XOR format
          return decryptWithKeyLegacy(encrypted, key);
        }
      }
    } catch (jsonError) {
      // If JSON parsing fails, treat as old format
    }
    
    // Old format - direct decryption with legacy XOR
    return decryptWithKeyLegacy(encrypted, key);
  } catch (error) {
    if (error instanceof Error && error.message === "Decryption key has expired") {
      throw error;
    }
    throw new Error("Invalid encrypted text or key");
  }
};

// ============================================================================
// LEGACY XOR CIPHER FUNCTIONS (for backward compatibility only)
// ============================================================================

const decryptTextLegacy = (encrypted: string): string => {
  try {
    const dataWithIV = base64ToBytes(encrypted);
    
    // Check if it has IV (new format, length > 16)
    if (dataWithIV.length > 16) {
      // Extract IV (first 16 bytes)
      const iv = dataWithIV.slice(0, 16);
      const encBytes = dataWithIV.slice(16);
      
      const keyBytes = new TextEncoder().encode(LEGACY_XOR_KEY);
      
      // Combine IV with key for decryption
      const combinedKey = new Uint8Array(iv.length + keyBytes.length);
      combinedKey.set(iv);
      combinedKey.set(keyBytes, iv.length);
      
      const plainBytes = xorBytes(encBytes, combinedKey);
      return new TextDecoder().decode(plainBytes);
    } else {
      // Old format without IV
      const keyBytes = new TextEncoder().encode(LEGACY_XOR_KEY);
      const plainBytes = xorBytes(dataWithIV, keyBytes);
      return new TextDecoder().decode(plainBytes);
    }
  } catch {
    // Fallback to oldest format (backward compatibility)
    try {
      const decoded = atob(encrypted);
      const decoded2 = decodeURIComponent(
        Array.from(decoded)
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return xorCipher(decoded2, LEGACY_XOR_KEY);
    } catch {
      throw new Error("Invalid encrypted text");
    }
  }
};

const decryptWithKeyLegacy = (encrypted: string, key: string): string => {
  const decodedString = safeBase64ToUtf8(encrypted);
  const decodedKey = safeBase64ToUtf8(key);
  
  // Try to parse as JSON payload (old format with expiration)
  try {
    const payload = JSON.parse(decodedString);
    
    if (payload.expiresAt !== undefined) {
      // Check if expired
      if (payload.expiresAt && Date.now() > payload.expiresAt) {
        throw new Error("Decryption key has expired");
      }
      
      // Old format: payload.data is base64 of XOR-encrypted bytes
      try {
        const dataBytes = base64ToBytes(payload.data);
        const keyBytes = new TextEncoder().encode(decodedKey);
        const plainBytes = xorBytes(dataBytes, keyBytes);
        return new TextDecoder().decode(plainBytes);
      } catch {
        // Backward compatibility: old format where payload.data is XOR string
        return xorCipher(payload.data, decodedKey);
      }
    }
  } catch (jsonError) {
    // If JSON parsing fails, treat as old format
  }
  
  // Old format - direct decryption
  return xorCipher(decodedString, decodedKey);
};

const xorBytes = (data: Uint8Array, key: Uint8Array): Uint8Array => {
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    out[i] = data[i] ^ key[i % key.length];
  }
  return out;
};

const xorCipher = (text: string, key: string): string => {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return result;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

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
  return bytesToBase64(new TextEncoder().encode(str));
};

const base64ToUtf8 = (b64: string): string => {
  return new TextDecoder().decode(base64ToBytes(b64));
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

// ============================================================================
// KEYLESS ENCRYPTION (Obfuscation - No password required)
// ============================================================================

const KEYLESS_VERSION = 4; // Version marker for keyless encryption
const KEYLESS_SHUFFLE_KEY = [3, 1, 4, 1, 5, 9, 2, 6]; // Fixed shuffle pattern

/**
 * Encrypt text without requiring a key (obfuscation)
 * Uses reversible transformations that don't require a password
 */
export const encryptKeyless = (text: string): string => {
  try {
    const textBytes = new TextEncoder().encode(text);
    
    // Apply simple reversible transformation
    const transformed = new Uint8Array(textBytes.length);
    for (let i = 0; i < textBytes.length; i++) {
      // XOR with position-based pattern and shuffle key
      const shuffleValue = KEYLESS_SHUFFLE_KEY[i % KEYLESS_SHUFFLE_KEY.length];
      transformed[i] = textBytes[i] ^ ((i + shuffleValue) % 256);
    }
    
    // Reverse the bytes for additional obfuscation
    const reversed = new Uint8Array(transformed.length);
    for (let i = 0; i < transformed.length; i++) {
      reversed[i] = transformed[transformed.length - 1 - i];
    }
    
    // Add version marker
    const result = new Uint8Array(1 + reversed.length);
    result[0] = KEYLESS_VERSION;
    result.set(reversed, 1);
    
    return bytesToBase64(result);
  } catch (error) {
    console.error("Keyless encryption error:", error);
    throw new Error("Failed to encrypt text");
  }
};

/**
 * Decrypt keyless encrypted text (no password required)
 */
export const decryptKeyless = (encrypted: string): string => {
  try {
    const data = base64ToBytes(encrypted);
    
    // Check version
    if (data[0] !== KEYLESS_VERSION) {
      throw new Error("Not a keyless encrypted message");
    }
    
    const reversed = data.slice(1);
    
    // Reverse the bytes back
    const transformed = new Uint8Array(reversed.length);
    for (let i = 0; i < reversed.length; i++) {
      transformed[i] = reversed[reversed.length - 1 - i];
    }
    
    // Reverse the XOR transformation
    const original = new Uint8Array(transformed.length);
    for (let i = 0; i < transformed.length; i++) {
      const shuffleValue = KEYLESS_SHUFFLE_KEY[i % KEYLESS_SHUFFLE_KEY.length];
      original[i] = transformed[i] ^ ((i + shuffleValue) % 256);
    }
    
    return new TextDecoder().decode(original);
  } catch (error) {
    if (error instanceof Error && error.message === "Not a keyless encrypted message") {
      throw error;
    }
    throw new Error("Invalid keyless encrypted text");
  }
};

/**
 * Check if encrypted text is keyless format
 */
export const isKeylessEncrypted = (encrypted: string): boolean => {
  try {
    const data = base64ToBytes(encrypted);
    return data[0] === KEYLESS_VERSION;
  } catch {
    return false;
  }
};
