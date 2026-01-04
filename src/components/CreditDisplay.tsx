import { Coins, Loader2 } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const CreditDisplay = () => {
  const { credits, loading } = useCredits();

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
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Play games to earn more credits!</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
