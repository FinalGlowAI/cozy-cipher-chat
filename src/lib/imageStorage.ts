// IndexedDB utility for storing encrypted images locally

const DB_NAME = "OCX_ImageStore";
const STORE_NAME = "encrypted_images";
const DB_VERSION = 1;

interface StoredImage {
  code: string;
  imageData: string;
  expiresAt: number | null; // timestamp in ms, null for never expire
  createdAt: number;
}

// Initialize IndexedDB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "code" });
      }
    };
  });
};

// Generate random 6-character code
export const generateShortCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Check if code already exists
const codeExists = async (code: string): Promise<boolean> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(code);

    request.onsuccess = () => resolve(!!request.result);
    request.onerror = () => reject(request.error);
  });
};

// Store encrypted image with code and expiration
export const storeImage = async (
  imageData: string,
  expirationMinutes: number | null
): Promise<string> => {
  let code = generateShortCode();
  
  // Ensure code is unique
  while (await codeExists(code)) {
    code = generateShortCode();
  }

  const db = await openDB();
  const now = Date.now();
  const expiresAt = expirationMinutes ? now + expirationMinutes * 60 * 1000 : null;

  const storedImage: StoredImage = {
    code,
    imageData,
    expiresAt,
    createdAt: now,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(storedImage);

    request.onsuccess = () => resolve(code);
    request.onerror = () => reject(request.error);
  });
};

// Retrieve image by code
export const retrieveImage = async (code: string): Promise<string> => {
  await cleanupExpiredImages(); // Clean up before retrieval

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(code.toUpperCase());

    request.onsuccess = () => {
      const result = request.result as StoredImage | undefined;
      
      if (!result) {
        reject(new Error("Code not found"));
        return;
      }

      // Check expiration
      if (result.expiresAt && Date.now() > result.expiresAt) {
        // Delete expired entry
        deleteImage(code);
        reject(new Error("Code has expired"));
        return;
      }

      resolve(result.imageData);
    };
    request.onerror = () => reject(request.error);
  });
};

// Delete image by code
export const deleteImage = async (code: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(code.toUpperCase());

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Clean up expired images
export const cleanupExpiredImages = async (): Promise<number> => {
  const db = await openDB();
  const now = Date.now();
  let deletedCount = 0;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        const image = cursor.value as StoredImage;
        if (image.expiresAt && now > image.expiresAt) {
          cursor.delete();
          deletedCount++;
        }
        cursor.continue();
      } else {
        resolve(deletedCount);
      }
    };
    request.onerror = () => reject(request.error);
  });
};

// Get storage statistics
export const getStorageStats = async (): Promise<{ count: number; size: number }> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const countRequest = store.count();
    const getAllRequest = store.getAll();

    let count = 0;
    let size = 0;

    countRequest.onsuccess = () => {
      count = countRequest.result;
    };

    getAllRequest.onsuccess = () => {
      const allImages = getAllRequest.result as StoredImage[];
      size = allImages.reduce((total, img) => total + img.imageData.length, 0);
      resolve({ count, size });
    };

    countRequest.onerror = () => reject(countRequest.error);
    getAllRequest.onerror = () => reject(getAllRequest.error);
  });
};
