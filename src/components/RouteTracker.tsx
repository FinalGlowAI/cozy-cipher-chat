import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackScreenView } from '@/lib/analytics';

const routeNames: Record<string, string> = {
  '/': 'Home',
  '/auth': 'Auth',
  '/install': 'Install',
  '/about': 'About',
  '/disclaimer': 'Disclaimer',
  '/terms': 'Terms',
  '/privacy': 'Privacy',
  '/refund-policy': 'Refund Policy',
  '/ephemeral': 'Ephemeral Space',
  '/image-encryption': 'Image Encryption',
  '/subscription': 'Subscription',
  '/admin': 'Admin',
  '/settings': 'Settings',
  '/features': 'Features',
  '/contact': 'Contact',
};

export const RouteTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const name =
      routeNames[location.pathname] ||
      (location.pathname.startsWith('/room/') ? 'Ephemeral Room' : location.pathname);
    trackScreenView(name);
  }, [location.pathname]);

  return null;
};
