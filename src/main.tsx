// PostHog MUST be the very first import — it runs init synchronously on import
import './posthog-init';

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerNotificationListeners, requestNotificationPermission, isNotificationsAvailable } from "./lib/notifications";
import { initAnalytics, trackError } from "./lib/analytics";

// Track when app started loading
const loadStartTime = Date.now();
const MIN_LOADER_TIME = 1500;

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
  requestNotificationPermission();
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

requestAnimationFrame(() => {
  requestAnimationFrame(hideInitialLoader);
});
