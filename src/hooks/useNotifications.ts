import { useEffect, useState } from 'react';
import { 
  requestNotificationPermission, 
  checkNotificationPermission, 
  registerNotificationListeners,
  isNotificationsAvailable 
} from '@/lib/notifications';

export const useNotifications = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const init = async () => {
      const available = isNotificationsAvailable();
      setIsAvailable(available);
      
      if (available) {
        registerNotificationListeners();
        const permission = await checkNotificationPermission();
        setPermissionGranted(permission?.display === 'granted');
      }
    };

    init();
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    return granted;
  };

  return {
    isAvailable,
    permissionGranted,
    requestPermission,
  };
};
