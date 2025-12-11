import { Capacitor } from '@capacitor/core';

// Check if notifications are available (Capacitor native context only)
export const isNotificationsAvailable = (): boolean => {
  return Capacitor.isNativePlatform();
};

// Request notification permissions
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationsAvailable()) {
    console.log('Local notifications not available in this context');
    return false;
  }

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const permission = await LocalNotifications.checkPermissions();
    
    if (permission.display === 'granted') {
      return true;
    }

    if (permission.display === 'denied') {
      return false;
    }

    // Request permission
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Check current permission status
export const checkNotificationPermission = async (): Promise<string | null> => {
  if (!isNotificationsAvailable()) {
    return null;
  }

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const result = await LocalNotifications.checkPermissions();
    return result.display;
  } catch (error) {
    console.error('Error checking notification permission:', error);
    return null;
  }
};

// Schedule a local notification
export const scheduleNotification = async (
  title: string,
  body: string,
  id?: number
): Promise<boolean> => {
  if (!isNotificationsAvailable()) {
    return false;
  }

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const permission = await LocalNotifications.checkPermissions();
    if (permission.display !== 'granted') {
      return false;
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: id || Date.now(),
          title,
          body,
          schedule: { at: new Date(Date.now() + 100) }, // Immediate
          sound: undefined,
          attachments: undefined,
          actionTypeId: '',
          extra: null,
        },
      ],
    });

    return true;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return false;
  }
};

// Send notification for new ephemeral room message
export const notifyNewMessage = async (roomCode: string): Promise<void> => {
  await scheduleNotification(
    'New Message',
    `You have a new message in room ${roomCode}`,
    Date.now()
  );
};

// Register notification listeners
export const registerNotificationListeners = async (): Promise<void> => {
  if (!isNotificationsAvailable()) {
    return;
  }

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    
    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      console.log('Notification received:', notification);
    });

    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      console.log('Notification action performed:', action);
    });
  } catch (error) {
    console.error('Error registering notification listeners:', error);
  }
};
