import posthog from 'posthog-js';

const POSTHOG_KEY = 'phc_xZGnEzoyhqyTGYNhS1xmkpRx1sPNgCsF05RbWSuBAGU';
const POSTHOG_HOST = 'https://app.posthog.com';

const getAppVersion = (): string => '1.0.0';
const getBuildNumber = (): string => '1';

const getPlatform = (): 'ios' | 'android' | 'web' => {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'web';
};

const isFirstSession = (): boolean => {
  const key = 'ocx_has_launched';
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, '1');
    return true;
  }
  return false;
};

export const initAnalytics = () => {
  try {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: false,
      capture_pageview: false, // we handle manually
      capture_pageleave: true,
      persistence: 'localStorage',
      disable_session_recording: true,
      loaded: (ph) => {
        ph.register({
          app_name: 'OcodX',
          environment: 'production',
          platform: getPlatform(),
          app_version: getAppVersion(),
          build_number: getBuildNumber(),
        });

        console.log('PostHog initialized successfully');

        ph.capture('app_opened');

        if (isFirstSession()) {
          ph.capture('reviewer_session_started');
        }
      },
    });
  } catch (e) {
    // Silent fail — never block app
  }
};

// ── Event helpers ──

export const trackScreenView = (screenName: string) => {
  try {
    posthog.capture('screen_view', {
      screen_name: screenName,
      timestamp: new Date().toISOString(),
    });
  } catch {}
};

export const trackEvent = (event: string, properties?: Record<string, any>) => {
  try {
    posthog.capture(event, properties);
  } catch {}
};

export const trackButtonClick = (buttonName: string, screenName: string) => {
  trackEvent('button_clicked', { button_name: buttonName, screen_name: screenName });
};

export const trackError = (errorMessage: string, screenName: string, apiEndpoint?: string) => {
  trackEvent('app_error', {
    error_message: errorMessage,
    screen_name: screenName,
    api_endpoint: apiEndpoint,
  });
};

export const trackApiError = (endpoint: string, statusCode: number | string, message: string) => {
  trackEvent('api_error', { endpoint, status_code: statusCode, message });
};

export const trackStripeError = (details?: Record<string, any>) => {
  trackEvent('stripe_error', details);
};
