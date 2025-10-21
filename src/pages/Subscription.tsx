import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { NeuralBackground } from "@/components/NeuralBackground";
import { ArrowLeft, Check, Crown } from "lucide-react";
import ocxLogo from "@/assets/ocx-logo.png";

const Subscription = () => {
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

  const handleUpgrade = async () => {
    if (!session?.user?.email) {
      toast.error("Please log in first");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error("Failed to start checkout process");
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
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
                    OCX Subscription
                  </h1>
                  <p className="text-xs text-muted-foreground">Manage Your Plan</p>
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
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Choose Your Plan
              </h2>
              <p className="text-muted-foreground text-lg">
                Unlock unlimited encryption and premium features
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Free Plan */}
              <Card className="border-primary/20 bg-card/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-2xl">Free</CardTitle>
                  <CardDescription>For occasional users</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$0</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span>3 encryptions per day</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span>Basic encryption & decryption</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span>Secure offline processing</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    disabled={!isPremium}
                  >
                    Current Plan
                  </Button>
                </CardFooter>
              </Card>

              {/* Premium Plan */}
              <Card className="border-primary bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-xl relative">
                {isPremium && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <Crown className="h-4 w-4" />
                      Active Plan
                    </div>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    Premium
                    <Crown className="h-5 w-5 text-primary" />
                  </CardTitle>
                  <CardDescription>For power users</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$9.99</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="font-semibold">Unlimited encryptions</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span>Image encryption & decryption</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span>Ephemeral messaging spaces</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span>Priority support</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span>All future features</span>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  {isPremium ? (
                    <Button 
                      className="w-full" 
                      onClick={handleManageSubscription}
                      disabled={loading || subscriptionLoading}
                    >
                      Manage Subscription
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={handleUpgrade}
                      disabled={loading || subscriptionLoading}
                    >
                      {loading ? "Processing..." : "Upgrade to Premium"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Subscription;
