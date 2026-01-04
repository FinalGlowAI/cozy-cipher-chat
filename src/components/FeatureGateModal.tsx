import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Coins, Gamepad2, Lock } from "lucide-react";

interface FeatureGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
  creditCost: number;
  currentCredits: number;
  onPlayGames: () => void;
}

export const FeatureGateModal = ({
  open,
  onOpenChange,
  featureName,
  creditCost,
  currentCredits,
  onPlayGames,
}: FeatureGateModalProps) => {
  const creditsNeeded = creditCost - currentCredits;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md backdrop-blur-xl bg-card/95 border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Lock className="h-5 w-5 text-primary" />
            Credits Required
          </DialogTitle>
          <DialogDescription className="text-left pt-2">
            <span className="font-medium text-foreground">{featureName}</span> requires credits to use.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Credit Cost Display */}
          <div className="flex items-center justify-center gap-8 p-4 rounded-lg bg-muted/50">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Required</p>
              <div className="flex items-center gap-1.5">
                <Coins className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold text-yellow-500">{creditCost}</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">You Have</p>
              <div className="flex items-center gap-1.5">
                <Coins className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold text-muted-foreground">{currentCredits}</span>
              </div>
            </div>
          </div>

          {/* Message */}
          <p className="text-center text-muted-foreground">
            You need <span className="font-semibold text-primary">{creditsNeeded} more credits</span> to use this feature.
            Play games to earn credits!
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => {
                onOpenChange(false);
                onPlayGames();
              }}
              className="w-full gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500"
            >
              <Gamepad2 className="h-5 w-5" />
              Play Games to Earn Credits
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </div>

          {/* Credit Info */}
          <p className="text-xs text-center text-muted-foreground">
            Complete game levels to earn 5-50 credits each. Total possible: 310 credits/day!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
