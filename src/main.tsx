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
try {
  initAnalytics();
} catch (_) {
  // Analytics should never crash the app
}

// Global error handler
window.addEventListener('error', (e) => {
  try { trackError(e.message, window.location.pathname); } catch (_) {}
});
window.addEventListener('unhandledrejection', (e) => {
  try { trackError(String(e.reason), window.location.pathname); } catch (_) {}
});

// Initialize notifications on app start
if (isNotificationsAvailable()) {
  try {
    registerNotificationListeners();
    requestNotificationPermission();
  } catch (_) {}
}

try {
  const root = createRoot(document.getElementById("root")!);
  root.render(<App />);

  // Only hide loader after React successfully renders
  requestAnimationFrame(() => {
    requestAnimationFrame(hideInitialLoader);
  });
} catch (e) {
  console.error('React failed to mount:', e);
  // Show error in the initial loader instead of blank screen
  const loader = document.getElementById("initial-loader");
  if (loader) {
    loader.innerHTML = `
      <img src="/icon-192.png" alt="OCX" width="64" height="64" style="margin-bottom: 16px;" />
      <p style="color: #fff; font-family: system-ui; font-size: 16px; margin-bottom: 8px;">Failed to load</p>
      <p style="color: hsl(215 20% 65%); font-family: system-ui; font-size: 14px; margin-bottom: 24px;">Please reload the app</p>
      <button onclick="window.location.reload()" style="padding: 12px 24px; border-radius: 8px; border: none; background: hsl(262 83% 58%); color: #fff; font-size: 16px; cursor: pointer;">Reload</button>
    `;
  }
}
