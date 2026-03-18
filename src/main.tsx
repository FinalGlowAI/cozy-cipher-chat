// IMPORTANT: Capture OAuth hash BEFORE anything else (React Router strips it)
import "./lib/oauthHashCapture";

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// === Hard reload: clear all caches & unregister stale service workers ===
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => caches.delete(name));
  });
}
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister());
  });
}

const hideInitialLoader = () => {
  const loader = document.getElementById("initial-loader");
  if (loader) {
    loader.style.opacity = "0";
    loader.style.transition = "opacity 0.3s ease-out";
    setTimeout(() => loader.remove(), 300);
  }
};

// Defer non-critical init to after React mounts
const deferredInit = () => {
  // PostHog & analytics — loaded async, never blocks rendering
  import('./posthog-init').catch(() => {});
  import('./lib/analytics').then(({ initAnalytics, trackError }) => {
    try { initAnalytics(); } catch (_) {}
    window.addEventListener('error', (e) => {
      try { trackError(e.message, window.location.pathname); } catch (_) {}
    });
    window.addEventListener('unhandledrejection', (e) => {
      try { trackError(String(e.reason), window.location.pathname); } catch (_) {}
    });
  }).catch(() => {});

  // Notifications — loaded async
  import('./lib/notifications').then(({ isNotificationsAvailable, registerNotificationListeners, requestNotificationPermission }) => {
    if (isNotificationsAvailable()) {
      try {
        registerNotificationListeners();
        requestNotificationPermission();
      } catch (_) {}
    }
  }).catch(() => {});
};

try {
  const root = createRoot(document.getElementById("root")!);
  root.render(<App />);

  // Hide loader immediately after React renders (no artificial delay)
  requestAnimationFrame(() => {
    requestAnimationFrame(hideInitialLoader);
  });

  // Kick off analytics & notifications after paint
  setTimeout(deferredInit, 100);
} catch (e) {
  console.error('React failed to mount:', e);
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
