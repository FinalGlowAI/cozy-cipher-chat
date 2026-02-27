import posthog from 'posthog-js';

// Initialize PostHog safely — must never crash the app
try {
  posthog.init('phc_xZGnEzoyhqyTGYNhSlxmkpRxlSPNgCsFO5RbWSuBAGU', {
    api_host: 'https://us.posthog.com',
    ui_host: 'https://us.posthog.com',
    autocapture: true,
    capture_pageview: true,
    persistence: 'localStorage',
    secure_cookie: false,
    // Don't block app loading if PostHog can't connect
    bootstrap: {},
    loaded: () => {
      try {
        posthog.capture('app_opened', { source: 'app_launch', app: 'OcodX' });
      } catch (_) {
        // Silently fail — analytics should never crash the app
      }
    },
  });
} catch (e) {
  console.warn('PostHog init failed:', e);
}
