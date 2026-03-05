import { useState, useEffect } from "react";
import { Coins, Loader2, Clock } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const formatTimeRemaining = (ms: number): string => {
  if (ms <= 0) return "Now";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const CreditDisplay = () => {
  const { credits, loading, decayTime } = useCredits();
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    if (!decayTime) return;

    const updateTimer = () => {
      const remaining = decayTime.getTime() - Date.now();
      setTimeRemaining(formatTimeRemaining(remaining));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [decayTime]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 cursor-default">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
            ) : (
              <>
                <Coins className="h-4 w-4 text-yellow-500" />
                <span className="font-semibold text-sm text-yellow-500">{credits}</span>
                {decayTime && timeRemaining && (
                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground ml-1 border-l border-yellow-500/30 pl-1.5">
                    <Clock className="h-3 w-3" />
                    {timeRemaining}
                  </span>
                )}
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            {credits} credits • Free refill in {timeRemaining || "—"}
          </p>
          <p className="text-xs text-muted-foreground">Play games to earn more!</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
