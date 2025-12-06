export const isIOSPWA = (): boolean => {
  // Check if running in standalone mode (installed PWA)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
    || (window.navigator as any).standalone 
    || document.referrer.includes('android-app://');
  
  // Check if iOS device
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  
  // Only return true if BOTH conditions are met (installed PWA on iOS)
  return isStandalone && isIOS;
};
