import { useEffect, useState } from 'react';
import { 
  requestNotificationPermission, 
  checkNotificationPermission, 
  registerNotificationListeners,
  isNotificationsAvailable,
  isInstalledPWA
} from '@/lib/notifications';

export const useNotifications = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const init = async () => {
      const available = isNotificationsAvailable();
      setIsAvailable(available);
      setIsPWA(isInstalledPWA());
      
      if (available) {
        await registerNotificationListeners();
        const permission = checkNotificationPermission();
        setPermissionGranted(permission === 'granted');
      }
    };

    init();

    // Listen for PWA install state changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => setIsPWA(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    return granted;
  };

  return {
    isAvailable,
    isPWA,
    permissionGranted,
    requestPermission,
  };
};
