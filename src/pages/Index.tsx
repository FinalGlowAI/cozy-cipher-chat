import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { EncryptionPanel } from "@/components/EncryptionPanel";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Lock, LogOut, Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { useAdmin } from "@/hooks/useAdmin";
import { NeuralBackground } from "@/components/NeuralBackground";
import ocxLogo from "@/assets/ocx-logo.png";

const Index = () => {
  const [actionsRemaining, setActionsRemaining] = useState(5);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [previousPremiumStatus, setPreviousPremiumStatus] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { isPremium, isFreeUser, loading: subscriptionLoading, refreshSubscription } = useSubscription();
  const { isAdmin } = useAdmin();

  useEffect(() => {
    let mounted = true;

    // Safety to avoid indefinite loading
    const safetyTimeout = setTimeout(() => {
      if (!mounted) return;
      setSession((prev) => (prev === undefined ? null : prev));
    }, 7000);

    // Check authentication once on mount
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        clearTimeout(safetyTimeout);
        setSession(session ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setSession(null);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!mounted) return;
      clearTimeout(safetyTimeout);
      setSession(sess ?? null);
      if (!sess) {
        // Clear localStorage when user logs out or is deleted
        localStorage.removeItem("ocx_actions");
        localStorage.removeItem("ocx_last_reset");
      } else {
        refreshSubscription();
      }
    });

    // Load actions from localStorage
    const saved = localStorage.getItem("ocx_actions");
    const lastReset = localStorage.getItem("ocx_last_reset");
    const today = new Date().toDateString();

    if (lastReset !== today) {
      setActionsRemaining(5);
      localStorage.setItem("ocx_actions", "5");
      localStorage.setItem("ocx_last_reset", today);
    } else if (saved) {
      setActionsRemaining(parseInt(saved));
    }

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [refreshSubscription]);

  // Redirect to auth when session is confirmed missing
  useEffect(() => {
    if (session === null) {
      navigate("/auth", { replace: true });
    }
  }, [session, navigate]);

  // Reset action count when subscription expires (premium -> free)
  useEffect(() => {
    if (!subscriptionLoading && previousPremiumStatus !== null) {
      // User went from premium to free (subscription expired/cancelled)
      if (previousPremiumStatus && !isPremium) {
        setActionsRemaining(3);
        localStorage.setItem("ocx_actions", "3");
        localStorage.setItem("ocx_last_reset", new Date().toDateString());
        toast.info("Your subscription has ended. You now have 3 daily actions.");
      }
    }
    if (!subscriptionLoading) {
      setPreviousPremiumStatus(isPremium);
    }
  }, [isPremium, subscriptionLoading, previousPremiumStatus]);

  const handleActionPerformed = () => {
    if (isPremium || isAdmin || isFreeUser) {
      // Premium users, admins, and free users (admin-granted) have unlimited actions
      return;
    }
    
    const newCount = actionsRemaining - 1;
    setActionsRemaining(newCount);
    localStorage.setItem("ocx_actions", newCount.toString());
    
    if (newCount === 0) {
      setShowUpgradeModal(true);
    }
  };

  const handlePremiumFeatureClick = (path: string) => {
    if (isPremium || isAdmin || isFreeUser) {
      navigate(path);
    } else {
      setShowUpgradeModal(true);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  if (session === undefined) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <NeuralBackground key="neural-bg" />
        <div className="relative z-10 flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Loading your session…</span>
        </div>
      </div>
    );
  }

  if (session === null) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <NeuralBackground key="neural-bg" />
        <div className="relative z-10 flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Redirecting…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <NeuralBackground key="neural-bg" />
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-surface opacity-30" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-primary/20 backdrop-blur-xl bg-card/30">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={ocxLogo} alt="OCX Logo" className="h-12 w-12 object-contain" />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    OCX
                  </h1>
                  <p className="text-xs text-muted-foreground">Secure Messaging</p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>100% Private</span>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePremiumFeatureClick("/ephemeral")}
                    className={isPremium || isAdmin || isFreeUser ? "" : "opacity-75"}
                  >
                    <span className="hidden md:inline">Ephemeral Space {!isPremium && !isAdmin && !isFreeUser && "🔒"}</span>
                    <span className="md:hidden">💬 {!isPremium && !isAdmin && !isFreeUser && "🔒"}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePremiumFeatureClick("/image-encryption")}
                    className={isPremium || isAdmin || isFreeUser ? "" : "opacity-75"}
                  >
                    <span className="hidden md:inline">Image Encryption {!isPremium && !isAdmin && !isFreeUser && "🔒"}</span>
                    <span className="md:hidden">🖼️ {!isPremium && !isAdmin && !isFreeUser && "🔒"}</span>
                  </Button>
                </div>
                {isAdmin && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate("/admin")}
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="hidden md:inline">Admin</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden md:inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Encrypt Your Messages,
              <br />
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Protect Your Privacy
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Transform your sensitive messages into secure, unreadable formats with just a few
              clicks. Whether you're sharing confidential business information or personal messages,
              OCX ensures your communications stay private.
            </p>
          </div>

          <EncryptionPanel
            onActionPerformed={handleActionPerformed}
            actionsRemaining={isPremium || isAdmin || isFreeUser ? Infinity : actionsRemaining}
            onUpgradeNeeded={() => setShowUpgradeModal(true)}
          />
        </main>

        {/* Footer */}
        <footer className="border-t border-primary/20 backdrop-blur-xl bg-card/30 mt-20">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <div className="flex flex-wrap justify-center gap-4 mb-4">
                <Button
                  variant="link"
                  onClick={() => navigate("/about")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  About Us
                </Button>
                <Button
                  variant="link"
                  onClick={() => navigate("/disclaimer")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Disclaimer
                </Button>
                <Button
                  variant="link"
                  onClick={() => navigate("/terms")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Terms of Use
                </Button>
                <Button
                  variant="link"
                  onClick={() => navigate("/privacy")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Privacy Policy
                </Button>
                <Button
                  variant="link"
                  onClick={() => navigate("/refund-policy")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Refund Policy
                </Button>
                {isPremium && (
                  <Button
                    variant="link"
                    onClick={async () => {
                      try {
                        const { data, error } = await supabase.functions.invoke('customer-portal');
                        if (error) throw error;
                        if (data?.url) {
                          window.open(data.url, '_blank');
                        }
                      } catch (error) {
                        toast.error("Failed to open subscription portal");
                        console.error(error);
                      }
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Manage Subscription
                  </Button>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                <p>© 2024 OCX. Your privacy is our priority.</p>
                <p className="mt-2">No data stored · Offline capable · Open source</p>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
    </div>
  );
};

export default Index;
