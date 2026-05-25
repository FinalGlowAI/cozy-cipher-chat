import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getSafeStorage } from '@/lib/platformDetection';

// Fallback constants ensure the client works even if .env is missing at build time.
// These are publishable (anon) credentials and safe to ship in the bundle.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://eontnvcvxuuefjinojzk.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvbnRudmN2eHV1ZWZqaW5vanprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MTE4NzUsImV4cCI6MjA4MTk4Nzg3NX0.KTQi2sD-gL4g_pTY945iqbYpoD_qbbUuYirLJTbNjMQ';

// FIX: detectSessionInUrl must be true on web so OAuth redirects are captured.
// On Capacitor (iOS/Android) it must be false — the app uses deep links instead.
// We detect native by checking for the Capacitor global object.
const isNative = typeof (window as any).Capacitor !== 'undefined'
  && (window as any).Capacitor?.isNativePlatform?.() === true;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: getSafeStorage(),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: !isNative,  // true on web, false on Capacitor
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': isNative ? 'capacitor-ios' : 'web',
    },
  },
});
