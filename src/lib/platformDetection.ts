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

export const isWebView = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Check for common webview indicators
  const isAndroidWebView = /wv/.test(userAgent) || /Android.*Version\/[\d.]+.*Chrome\/[\d.]+ Mobile/.test(userAgent);
  const isIOSWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(userAgent);
  const isMedianApp = /median/i.test(userAgent) || /gonative/i.test(userAgent);
  const isCapacitor = !!(window as any).Capacitor;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
  
  return isAndroidWebView || isIOSWebView || isMedianApp || isCapacitor || isStandalone;
};
