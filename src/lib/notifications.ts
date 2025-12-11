import { LocalNotifications, PermissionStatus } from '@capacitor/local-notifications';

// Check if notifications are available (Capacitor native context)
export const isNotificationsAvailable = (): boolean => {
  return typeof LocalNotifications !== 'undefined' && LocalNotifications.checkPermissions !== undefined;
};

// Request notification permissions
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationsAvailable()) {
    console.log('Local notifications not available in this context');
    return false;
  }

  try {
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
export const checkNotificationPermission = async (): Promise<PermissionStatus | null> => {
  if (!isNotificationsAvailable()) {
    return null;
  }

  try {
    return await LocalNotifications.checkPermissions();
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
export const registerNotificationListeners = (): void => {
  if (!isNotificationsAvailable()) {
    return;
  }

  LocalNotifications.addListener('localNotificationReceived', (notification) => {
    console.log('Notification received:', notification);
  });

  LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    console.log('Notification action performed:', action);
  });
};
