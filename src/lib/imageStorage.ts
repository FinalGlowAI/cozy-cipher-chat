// Supabase utility for storing encrypted images
import { supabase } from "@/integrations/supabase/client";

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

// Retrieve image by code
export const retrieveImage = async (code: string): Promise<string> => {
  await cleanupExpiredImages(); // Clean up before retrieval

  // Get metadata from database
  const { data, error } = await supabase
    .from('encrypted_images')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (error || !data) {
    throw new Error("Code not found");
  }

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    // Delete expired entry
    await deleteImage(code);
    throw new Error("Code has expired");
  }

  // Download image from storage
  const { data: imageBlob, error: downloadError } = await supabase.storage
    .from('encrypted_images')
    .download(data.storage_path);

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

// Delete image by code
export const deleteImage = async (code: string): Promise<void> => {
  // Get storage path before deleting
  const { data } = await supabase
    .from('encrypted_images')
    .select('storage_path')
    .eq('code', code.toUpperCase())
    .single();

  if (data?.storage_path) {
    // Delete from storage
    await supabase.storage
      .from('encrypted_images')
      .remove([data.storage_path]);
  }

  // Delete from database
  await supabase
    .from('encrypted_images')
    .delete()
    .eq('code', code.toUpperCase());
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
