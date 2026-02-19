import posthog from 'posthog-js';

// Initialize PostHog at the ABSOLUTE ROOT before anything else
posthog.init('phc_xZGnEzoyhqyTGYNhS1xmkpRx1sPNgCsF05RbWSuBAGU', {
  api_host: 'https://us.posthog.com',
  ui_host: 'https://us.posthog.com',
  autocapture: true,
  capture_pageview: true,
  persistence: 'localStorage',
  secure_cookie: false
});

// Forced test event on every app open
posthog.capture('posthog_connection_fixed', {
  debug: 'working',
  source: 'app_launch_test',
  app: 'OcodX',
  environment: 'production'
});

console.log("POSTHOG WORKING");
