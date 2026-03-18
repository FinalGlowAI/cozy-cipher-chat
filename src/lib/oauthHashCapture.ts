/**
 * Synchronous OAuth hash capture.
 *
 * React Router v7 strips the URL hash before Supabase's `detectSessionInUrl`
 * can read it. This module captures OAuth tokens from the hash *immediately*
 * on script load (before React mounts) and exposes them for later consumption
 * via `setSession()`.
 *
 * Usage: import this module at the very top of main.tsx.
 */

export interface CapturedOAuthTokens {
  access_token: string;
  refresh_token: string;
}

let captured: CapturedOAuthTokens | null = null;

// Run synchronously on import
const hash = window.location.hash;
if (hash && hash.length > 1) {
  const params = new URLSearchParams(hash.substring(1));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (accessToken && refreshToken) {
    captured = {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
    // Clear the hash immediately so React Router never sees it
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }
}

/** Returns the captured tokens (once). After first call, tokens are cleared. */
export function consumeCapturedOAuthTokens(): CapturedOAuthTokens | null {
  const tokens = captured;
  captured = null;
  return tokens;
}

/** Peek at captured tokens without consuming them. */
export function hasCapturedOAuthTokens(): boolean {
  return captured !== null;
}
