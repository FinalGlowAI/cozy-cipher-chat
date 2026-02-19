import posthog from 'posthog-js';

// Initialize PostHog at the ABSOLUTE ROOT before anything else
posthog.init("phc_xZGnEzoyhqyTGYNhS1xmkpRx1sPNgCsF05RbWSuBAGU", {
  api_host: "https://us.i.posthog.com",
  capture_pageview: true,
  autocapture: true,
  persistence: "localStorage"
});

// Forced test event on every app open
posthog.capture("posthog_test_event", {
  source: "app_launch_test",
  app: "OcodX",
  environment: "production"
});

console.log("POSTHOG WORKING");

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerNotificationListeners, requestNotificationPermission, isNotificationsAvailable } from "./lib/notifications";
import { initAnalytics, trackError } from "./lib/analytics";

// Track when app started loading
const loadStartTime = Date.now();
const MIN_LOADER_TIME = 1500; // Show loader for at least 1.5 seconds

// Hide the initial loader once React is ready
const hideInitialLoader = () => {
  const loader = document.getElementById("initial-loader");
  if (loader) {
    const elapsed = Date.now() - loadStartTime;
    const remainingTime = Math.max(0, MIN_LOADER_TIME - elapsed);
    
    setTimeout(() => {
      loader.style.opacity = "0";
      loader.style.transition = "opacity 0.3s ease-out";
      setTimeout(() => loader.remove(), 300);
    }, remainingTime);
  }
};

// Initialize analytics (registers global props + additional events)
initAnalytics();

// Global error handler
window.addEventListener('error', (e) => {
  trackError(e.message, window.location.pathname);
});
window.addEventListener('unhandledrejection', (e) => {
  trackError(String(e.reason), window.location.pathname);
});

// Initialize notifications on app start
if (isNotificationsAvailable()) {
  registerNotificationListeners();
  // Request permission on first load (will show native prompt)
  requestNotificationPermission();
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Hide loader after React renders
requestAnimationFrame(() => {
  requestAnimationFrame(hideInitialLoader);
});
