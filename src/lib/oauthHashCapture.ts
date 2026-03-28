/**
 * Synchronous OAuth hash capture & canonical domain enforcement.
 *
 * React Router v7 strips the URL hash before Supabase's `detectSessionInUrl`
 * can read it. This module captures OAuth tokens from the hash *immediately*
 * on script load (before React mounts) and exposes them for later consumption
 * via `setSession()`.
 *
 * It also enforces the canonical domain (ocodx.store) — any visit on a
 * *.lovable.app hostname is redirected to the branded domain, preserving
 * pathname, query string, and hash.
 *
 * Usage: import this module at the very top of main.tsx.
 */

export interface CapturedOAuthTokens {
  access_token: string;
  refresh_token: string;
  type?: string;
}

let captured: CapturedOAuthTokens | null = null;
const CANONICAL_ORIGIN = "https://ocodx.store";

// ── 1. Enforce canonical domain ────────────────────────────────────────
// If the page is loaded on any *.lovable.app hostname, redirect the
// entire URL (path + search + hash) to the branded domain.
if (
  window.location.hostname.endsWith(".lovable.app") &&
  window.location.origin !== CANONICAL_ORIGIN
) {
  const canonicalUrl = `${CANONICAL_ORIGIN}${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.replace(canonicalUrl);
  // Script execution continues briefly but React won't mount before the
  // navigation completes. The rest of this file is effectively a no-op.
}

// ── 2. Capture OAuth hash tokens ───────────────────────────────────────
const hash = window.location.hash;
if (hash && hash.length > 1) {
  const params = new URLSearchParams(hash.substring(1));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const tokenType = params.get("type");

  if (accessToken && refreshToken) {
    captured = {
      access_token: accessToken,
      refresh_token: refreshToken,
      type: tokenType || undefined,
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
