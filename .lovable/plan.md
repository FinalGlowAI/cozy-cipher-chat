
# Fix PostHog: Events Not Reaching US-Region Dashboard

## Problem
PostHog is initialized and the API key is correct, but **zero events** arrive at your US-region dashboard (`us.posthog.com/project/317459`). Two root causes:

1. **Wrong API host** -- Code sends to `app.posthog.com` but your project lives on the US cloud instance (`us.posthog.com`). Events are being routed to the wrong region.
2. **Double initialization** -- PostHog is initialized twice (once in `posthog-init.ts`, again in `analytics.ts`), which can cause conflicts.

## Fix

### Step 1: Update `src/posthog-init.ts`
- Change `api_host` from `https://app.posthog.com` to `https://us.posthog.com`
- Change `ui_host` from `https://app.posthog.com` to `https://us.posthog.com`
- Keep the test event and console log for verification

### Step 2: Update `src/lib/analytics.ts`
- Change `POSTHOG_HOST` from `https://app.posthog.com` to `https://us.posthog.com`
- Remove the second `posthog.init()` call inside `initAnalytics()` since PostHog is already initialized in `posthog-init.ts`
- Keep only the `register()` call for global properties and the event helpers

### Step 3: Update `src/main.tsx`
- The `initAnalytics()` call stays but will no longer re-initialize PostHog -- it will only register global properties

## Technical Details

| File | Change |
|------|--------|
| `src/posthog-init.ts` | `api_host` and `ui_host` to `https://us.posthog.com` |
| `src/lib/analytics.ts` | Host constant to `https://us.posthog.com`; remove duplicate `posthog.init()`, replace with `posthog.register()` only |

After this fix, events will route to the correct US region and you should see `posthog_connection_fixed` appear in your Activity tab within a few minutes of opening the app.
