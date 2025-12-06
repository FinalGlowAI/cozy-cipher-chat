import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crown, Check, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { isIOSPWA, isWebView } from "@/lib/platformDetection";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UpgradeModal = ({ open, onOpenChange }: UpgradeModalProps) => {
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  
  const features = [
    "Unlimited encryption & decryption",
    "Access to ephemeral chat rooms",
    "Access to image encryption",
    "Premium support",
  ];

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      
      // iOS PWA users must subscribe via website (App Store compliance)
      if (isIOSPWA()) {
        window.open('https://ocodx.website/subscription', '_blank');
        toast.info('Please complete your subscription on our website', {
          description: 'Apple requires external payment processing'
        });
        onOpenChange(false);
        return;
      }
      
      // All other platforms: use direct Stripe checkout
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { couponCode: couponCode.trim() || undefined }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        // In webview environments (native apps), redirect in same window
        if (isWebView()) {
          window.location.href = data.url;
        } else {
          window.open(data.url, '_blank');
        }
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to start checkout process');
    } finally {
      setLoading(false);
    }
  };

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
          <div className="flex flex-col items-center gap-1">
            <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent line-through">
              $8.40
            </div>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                or $4.20
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-primary/20 rounded-full">
                <Tag className="h-3 w-3 text-primary" />
                <span className="text-xs font-bold text-primary">50% OFF</span>
              </div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">per month</div>
        </div>

        {isIOSPWA() && (
          <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground text-center mb-4">
            ℹ️ Subscriptions are managed on our website per Apple's requirements
          </div>
        )}

        {!isIOSPWA() && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2 text-center">
              Use a coupon code for up to 50% off
            </p>
            <Input
              type="text"
              placeholder="Enter coupon code (optional)"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="w-full"
            />
          </div>
        )}

        <Button
          className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
          onClick={handleUpgrade}
          disabled={loading}
        >
          {loading ? "Loading..." : isIOSPWA() ? "Subscribe on ocodx.website" : "Upgrade Now"}
        </Button>
        <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
          Maybe Later
        </Button>
      </DialogContent>
    </Dialog>
  );
};
