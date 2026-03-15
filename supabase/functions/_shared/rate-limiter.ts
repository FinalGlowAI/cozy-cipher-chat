// Rate limiter using token bucket algorithm.
//
// ⚠️  LIMITATION: This is an in-memory store. Supabase Edge Functions can run
// on multiple instances simultaneously — each instance has its own Map.
// A determined user could bypass limits by hitting different instances.
//
// For production-grade rate limiting, replace this with an external KV store
// such as Upstash Redis (https://upstash.com) with the @upstash/redis Deno client.
// The interface below is intentionally kept simple so swapping is easy.

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  maxTokens: number;       // Max tokens in bucket
  refillRate: number;      // Tokens added per second
  tokensPerRequest: number; // Tokens consumed per request
}

const defaultConfig: RateLimitConfig = {
  maxTokens: 10,
  refillRate: 1,
  tokensPerRequest: 1,
};

export function checkRateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): { allowed: boolean; retryAfter?: number } {
  const { maxTokens, refillRate, tokensPerRequest } = { ...defaultConfig, ...config };

  const now = Date.now();
  let entry = rateLimitStore.get(identifier);

  if (!entry) {
    entry = { tokens: maxTokens, lastRefill: now };
    rateLimitStore.set(identifier, entry);
  }

  const timePassed = (now - entry.lastRefill) / 1000;
  const tokensToAdd = Math.floor(timePassed * refillRate);

  if (tokensToAdd > 0) {
    entry.tokens = Math.min(maxTokens, entry.tokens + tokensToAdd);
    entry.lastRefill = now;
  }

  if (entry.tokens >= tokensPerRequest) {
    entry.tokens -= tokensPerRequest;
    rateLimitStore.set(identifier, entry);
    return { allowed: true };
  }

  const tokensNeeded = tokensPerRequest - entry.tokens;
  const retryAfter = Math.ceil(tokensNeeded / refillRate);

  return { allowed: false, retryAfter };
}

export function getRateLimitHeaders(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): Record<string, string> {
  const { maxTokens } = { ...defaultConfig, ...config };
  const entry = rateLimitStore.get(identifier);

  return {
    'X-RateLimit-Limit': String(maxTokens),
    'X-RateLimit-Remaining': String(entry?.tokens ?? maxTokens),
    'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000) + 60),
  };
}

// Cleanup stale entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000;
const ENTRY_TTL = 10 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.lastRefill > ENTRY_TTL) {
      rateLimitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL);
