// Check if Web Push notifications are available
export const isNotificationsAvailable = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

// Check if running as installed PWA
export const isInstalledPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
};

// Request notification permissions
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationsAvailable()) {
    console.log('Web notifications not available in this context');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Check current permission status
export const checkNotificationPermission = (): string | null => {
  if (!isNotificationsAvailable()) {
    return null;
  }
  return Notification.permission;
};

// Show a notification
export const showNotification = async (
  title: string,
  body: string,
  options?: NotificationOptions
): Promise<boolean> => {
  if (!isNotificationsAvailable()) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    // Try to use service worker for better PWA support
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'ocx-notification',
      renotify: true,
      ...options,
    } as NotificationOptions);
    return true;
  } catch (error) {
    // Fallback to basic Notification API
    try {
      new Notification(title, {
        body,
        icon: '/icon-192.png',
        ...options,
      });
      return true;
    } catch (fallbackError) {
      console.error('Error showing notification:', fallbackError);
      return false;
    }
  }
};

// Send notification for new ephemeral room message
export const notifyNewMessage = async (roomCode: string): Promise<void> => {
  // Only show notification if app is not focused
  if (document.visibilityState === 'visible') {
    return;
  }

  await showNotification(
    'New Message',
    `You have a new message in room ${roomCode}`,
    { tag: `room-${roomCode}` }
  );
};

// Register notification click handler via service worker
export const registerNotificationListeners = async (): Promise<void> => {
  if (!isNotificationsAvailable()) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Service worker handles notification clicks
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'NOTIFICATION_CLICK') {
        console.log('Notification clicked:', event.data);
        // Focus the window when notification is clicked
        window.focus();
      }
    });
  } catch (error) {
    console.error('Error registering notification listeners:', error);
  }
};
