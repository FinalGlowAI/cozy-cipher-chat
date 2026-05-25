import { useEffect, useState, useRef } from "react";
import { Lock } from "lucide-react";

export const PrivacyShield = () => {
  const [hidden, setHidden] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const show = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setHidden(true);
    };

    const hide = () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        setHidden(false);
        timeoutRef.current = null;
      }, 500);
    };

    const onVisibility = () => {
      if (document.hidden) show();
      else hide();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", show);
    window.addEventListener("focus", hide);
    window.addEventListener("pagehide", show);
    window.addEventListener("pageshow", hide);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", show);
      window.removeEventListener("focus", hide);
      window.removeEventListener("pagehide", show);
      window.removeEventListener("pageshow", hide);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!hidden) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-2xl animate-in fade-in duration-200"
    >
      <div className="flex flex-col items-center gap-4 text-center px-6">
        <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <p className="text-lg font-semibold text-foreground">
          Privacy protection enabled
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Content is hidden while the app is not in focus
        </p>
      </div>
    </div>
  );
};
