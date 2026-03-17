import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getSafeStorage } from '@/lib/platformDetection';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

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
