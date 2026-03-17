/**
 * FIX: iPadOS 13+ reports itself as "Macintosh" in the userAgent — not "iPad".
 * The old check `/iPad|iPhone|iPod/.test(navigator.userAgent)` always returns
 * false on modern iPads, breaking iOS-specific logic (subscription portal, etc).
 *
 * The correct detection uses navigator.maxTouchPoints: a Mac with a mouse
 * has 0 touch points, while an iPad has 5.
 */

export const isIOS = (): boolean => {
  // Classic iOS devices (iPhone, iPod, older iPad)
  const classicIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  // iPadOS 13+ identifies as Mac but has touch support
  const modernIPad =
    navigator.userAgent.includes('Macintosh') &&
    navigator.maxTouchPoints > 1;

  return classicIOS || modernIPad;
};

export const isIOSPWA = (): boolean => {
  // Check if running in standalone mode (installed PWA)
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://');

  return isStandalone && isIOS();
};
