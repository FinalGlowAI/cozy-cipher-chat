import posthog from 'posthog-js';

// Initialize PostHog at the ABSOLUTE ROOT before anything else
posthog.init('phc_xZGnEzoyhqyTGYNhS1xmkpRx1sPNgCsF05RbWSuBAGU', {
  api_host: 'https://us.i.posthog.com',
  autocapture: true,
  capture_pageview: true,
  persistence: 'localStorage'
});

// Forced test event on every app open
posthog.capture('posthog_test_event', {
  debug: 'working',
  source: 'app_launch_test',
  app: 'OcodX',
  environment: 'production'
});

console.log("POSTHOG WORKING");
