import { useState, useRef, useCallback, ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

interface TapToRevealProps {
  children: ReactNode;
  /** Auto-hide after N ms once released. Default 0 = hide immediately on release. */
  holdMode?: boolean;
  /** Auto re-hide after this many ms when in toggle mode. Default 15000. */
  autoHideMs?: number;
  label?: string;
  className?: string;
}

/**
 * Hides sensitive content under a blur until the user taps (or holds) to reveal.
 * - holdMode=true: visible only while pressed (best anti-screenshot)
 * - holdMode=false (default): tap to reveal, auto-hides after autoHideMs
 */
export const TapToReveal = ({
  children,
  holdMode = false,
  autoHideMs = 15000,
  label = "Tap to reveal",
  className = "",
}: TapToRevealProps) => {
  const [revealed, setRevealed] = useState(false);
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const hide = useCallback(() => {
    clearTimer();
    setRevealed(false);
  }, []);

  const reveal = useCallback(() => {
    clearTimer();
    setRevealed(true);
    if (!holdMode && autoHideMs > 0) {
      timerRef.current = window.setTimeout(() => setRevealed(false), autoHideMs);
    }
  }, [holdMode, autoHideMs]);

  const holdHandlers = holdMode
    ? {
        onPointerDown: (e: React.PointerEvent) => {
          e.preventDefault();
          reveal();
        },
        onPointerUp: hide,
        onPointerLeave: hide,
        onPointerCancel: hide,
        onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
      }
    : {
        onClick: () => (revealed ? hide() : reveal()),
      };

  return (
    <div
      className={`relative select-none ${className}`}
      style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
      {...holdHandlers}
    >
      <div
        className={`transition-all duration-300 ${
          revealed ? "blur-0 opacity-100" : "blur-xl opacity-60 pointer-events-none"
        }`}
        aria-hidden={!revealed}
      >
        {children}
      </div>

      {!revealed && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 backdrop-blur-md rounded-lg cursor-pointer">
          <div className="flex flex-col items-center gap-2 text-foreground/90">
            <Eye className="h-6 w-6" />
            <span className="text-sm font-medium">
              {holdMode ? "Hold to reveal" : label}
            </span>
            <span className="text-xs text-muted-foreground">
              {holdMode ? "Release to hide" : "Auto-hides in 15s"}
            </span>
          </div>
        </div>
      )}

      {revealed && !holdMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            hide();
          }}
          className="absolute top-2 right-2 z-20 p-1.5 rounded-md bg-background/70 backdrop-blur hover:bg-background border border-border"
          aria-label="Hide"
        >
          <EyeOff className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
