import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { NeuralBackground } from "@/components/NeuralBackground";
import { isIOSPWA } from "@/lib/platformDetection";
import { ArrowLeft, CreditCard, User } from "lucide-react";
import ocxLogo from "@/assets/ocx-logo.png";

const Settings = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isPremium, loading: subscriptionLoading } = useSubscription();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      // iOS PWA users go to website
      if (isIOSPWA()) {
        window.open('https://ocodx.website/subscription', '_blank');
        return;
      }
      
      // All other platforms: Stripe Customer Portal
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      toast.error("Failed to open subscription portal");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <NeuralBackground key="neural-bg" />
      <div className="absolute inset-0 bg-gradient-surface opacity-30" />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-primary/20 backdrop-blur-xl bg-card/30">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={ocxLogo} alt="OCX Logo" className="h-12 w-12 object-contain" />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    Settings
                  </h1>
                  <p className="text-xs text-muted-foreground">Manage Your Account</p>
                </div>
              </div>
              <Button variant="ghost" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Account Info Card */}
            <Card className="border-primary/20 bg-card/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <p className="text-foreground">{session.user.email}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Subscription Status</label>
                  <p className="text-foreground font-semibold">
                    {subscriptionLoading ? "Loading..." : isPremium ? "Premium ⭐" : "Free"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Management Card */}
            {isPremium && (
              <Card className="border-primary/20 bg-card/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Subscription Management
                  </CardTitle>
                  <CardDescription>Manage your premium subscription</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    onClick={handleManageSubscription}
                    disabled={loading || subscriptionLoading}
                  >
                    {loading ? "Opening..." : "Manage Subscription"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3">
                    View invoices, update payment method, or cancel your subscription
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
