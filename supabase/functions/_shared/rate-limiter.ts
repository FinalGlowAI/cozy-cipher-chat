// Simple in-memory rate limiter using token bucket algorithm
// Note: In production with multiple instances, use Redis or similar

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  maxTokens: number;      // Max tokens in bucket
  refillRate: number;     // Tokens added per second
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
  
  // Calculate tokens to add based on time passed
  const timePassed = (now - entry.lastRefill) / 1000;
  const tokensToAdd = Math.floor(timePassed * refillRate);
  
  if (tokensToAdd > 0) {
    entry.tokens = Math.min(maxTokens, entry.tokens + tokensToAdd);
    entry.lastRefill = now;
  }
  
  // Check if we have enough tokens
  if (entry.tokens >= tokensPerRequest) {
    entry.tokens -= tokensPerRequest;
    rateLimitStore.set(identifier, entry);
    return { allowed: true };
  }
  
  // Calculate retry after
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

// Cleanup old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
const ENTRY_TTL = 10 * 60 * 1000; // 10 minutes

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.lastRefill > ENTRY_TTL) {
      rateLimitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL);
