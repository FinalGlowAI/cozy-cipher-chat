import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UpgradeModal = ({ open, onOpenChange }: UpgradeModalProps) => {
  const features = [
    "Unlimited encryption & decryption",
    "Access to ephemeral chat rooms",
    "Priority support",
    "Ad-free experience",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md backdrop-blur-xl bg-card/95 border-primary/30">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-primary rounded-full">
              <Crown className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center">Upgrade to Premium</DialogTitle>
          <DialogDescription className="text-center">
            You've reached your daily limit. Upgrade for unlimited access!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 my-6">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>

        <div className="text-center mb-6">
          <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            $7.99
          </div>
          <div className="text-sm text-muted-foreground">per month</div>
        </div>

        <Button className="w-full bg-gradient-primary hover:opacity-90 transition-opacity">
          Upgrade Now
        </Button>
        <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
          Maybe Later
        </Button>
      </DialogContent>
    </Dialog>
  );
};
