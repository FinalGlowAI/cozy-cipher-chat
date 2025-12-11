import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerNotificationListeners, requestNotificationPermission, isNotificationsAvailable } from "./lib/notifications";

// Initialize notifications on app start
if (isNotificationsAvailable()) {
  registerNotificationListeners();
  // Request permission on first load (will show native prompt)
  requestNotificationPermission();
}

createRoot(document.getElementById("root")!).render(<App />);
