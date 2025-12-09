// Supabase utility for storing encrypted images
import { supabase } from "@/integrations/supabase/client";

// Generate image code with IMG- prefix (e.g., IMG-AJFJZ8)
export const generateShortCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomPart = "";
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `IMG-${randomPart}`;
};

// Extract the base code without prefix for storage
const extractBaseCode = (code: string): string => {
  return code.toUpperCase().replace(/^IMG-/, '');
};

// Normalize code input (handles both with and without prefix)
const normalizeCode = (code: string): string => {
  const upper = code.toUpperCase().trim();
  if (upper.startsWith('IMG-')) {
    return upper;
  }
  return `IMG-${upper}`;
};

// Check if code already exists
const codeExists = async (code: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from("encrypted_images")
    .select("code")
    .eq("code", code)
    .single();
  
  return !error && !!data;
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

  // Convert base64 to blob
  const base64Data = imageData.split(',')[1];
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'image/png' });

  // Upload to storage
  const storagePath = `${code}.png`;
  const { error: uploadError } = await supabase.storage
    .from('encrypted_images')
    .upload(storagePath, blob);

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  // Store metadata in database
  const expiresAt = expirationMinutes 
    ? new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString()
    : null;

  const { error: dbError } = await supabase
    .from('encrypted_images')
    .insert({
      code,
      storage_path: storagePath,
      expires_at: expiresAt,
    });

  if (dbError) {
    // Clean up uploaded file if database insert fails
    await supabase.storage.from('encrypted_images').remove([storagePath]);
    throw new Error(`Failed to store image metadata: ${dbError.message}`);
  }

  return code;
};

// Retrieve image by code (accepts with or without IMG- prefix)
export const retrieveImage = async (code: string): Promise<string> => {
  await cleanupExpiredImages(); // Clean up before retrieval

  // Normalize and extract base code for database lookup
  const normalizedCode = normalizeCode(code);

  // Use security definer function to get metadata (prevents enumeration attacks)
  const { data, error } = await supabase.rpc('retrieve_encrypted_image', {
    _code: normalizedCode
  });

  if (error || !data || data.length === 0) {
    throw new Error("Code not found or expired");
  }

  const imageData = data[0];

  // Download image from storage
  const { data: imageBlob, error: downloadError } = await supabase.storage
    .from('encrypted_images')
    .download(imageData.storage_path);

  if (downloadError || !imageBlob) {
    throw new Error(`Failed to download image: ${downloadError?.message}`);
  }

  // Convert blob to base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(imageBlob);
  });
};

// Delete image by code (accepts with or without IMG- prefix)
export const deleteImage = async (code: string): Promise<void> => {
  const normalizedCode = normalizeCode(code);
  
  // Use security definer function to delete (verifies code ownership)
  const { error } = await supabase.rpc('delete_encrypted_image', {
    _code: normalizedCode
  });

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

// Clean up expired images
export const cleanupExpiredImages = async (): Promise<number> => {
  const { data, error } = await supabase.rpc('cleanup_expired_encrypted_images');
  
  if (error) {
    console.error('Error cleaning up expired images:', error);
    return 0;
  }
  
  return data || 0;
};

// Get storage statistics
export const getStorageStats = async (): Promise<{ count: number; size: number }> => {
  // Get count from database
  const { count, error: countError } = await supabase
    .from('encrypted_images')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error getting storage stats:', countError);
    return { count: 0, size: 0 };
  }

  // Get storage bucket size
  const { data: files, error: listError } = await supabase.storage
    .from('encrypted_images')
    .list();

  if (listError) {
    console.error('Error listing storage files:', listError);
    return { count: count || 0, size: 0 };
  }

  const size = files?.reduce((total, file) => total + (file.metadata?.size || 0), 0) || 0;

  return { count: count || 0, size };
};
