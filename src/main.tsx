import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerNotificationListeners, requestNotificationPermission, isNotificationsAvailable } from "./lib/notifications";

// Hide the initial loader once React is ready
const hideInitialLoader = () => {
  const loader = document.getElementById("initial-loader");
  if (loader) {
    loader.style.opacity = "0";
    loader.style.transition = "opacity 0.3s ease-out";
    setTimeout(() => loader.remove(), 300);
  }
};

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
