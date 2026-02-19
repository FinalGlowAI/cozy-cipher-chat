

# Update PostHog API Key

## Problem
The API key currently in the code (`phc_xZGnEzoyhqyTGYNhS1xmkpRx1sPNgCsF05RbWSuBAGU`) is invalid/expired, causing 401 errors from PostHog. The correct key from your dashboard is different.

## Changes

### File 1: `src/posthog-init.ts`
- Replace the old API key in the `posthog.init()` call with the new key: `phc_xZGnEzoyhqyTGYNhSlxmkpRxlSPNgCsFO5RbWSuBAGU`

### File 2: `src/lib/analytics.ts`
- Update the `POSTHOG_KEY` constant to `phc_xZGnEzoyhqyTGYNhSlxmkpRxlSPNgCsFO5RbWSuBAGU`

## Verification
After this change, reload the app and check:
1. No 401 errors on PostHog network requests
2. Events like `posthog_connection_fixed` and `app_opened` appear in your PostHog dashboard Activity tab within a few minutes

