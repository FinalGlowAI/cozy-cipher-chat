import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

/**
 * Checks if running as a native Capacitor app (iOS/Android)
 */
export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Performs native Google Sign In via Capacitor plugin,
 * then creates a Supabase session with the returned ID token.
 */
export const nativeGoogleSignIn = async (): Promise<{ error?: Error }> => {
  try {
    // Dynamically import to avoid issues on web
    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');

    // Initialize on first use (safe to call multiple times)
    await GoogleAuth.initialize();

    const result = await GoogleAuth.signIn();

    if (!result.authentication?.idToken) {
      return { error: new Error('No ID token returned from Google Sign In') };
    }

    // Exchange the Google ID token for a Supabase session
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: result.authentication.idToken,
      access_token: result.authentication.accessToken,
    });

    if (error) {
      return { error: new Error(error.message) };
    }

    return {};
  } catch (err: any) {
    // User cancelled or plugin error
    const message = err?.message || err?.error || 'Native Google Sign In failed';
    return { error: new Error(message) };
  }
};
