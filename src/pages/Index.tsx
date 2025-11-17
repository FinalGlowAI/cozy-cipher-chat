import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { EncryptionPanel } from "@/components/EncryptionPanel";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Lock, LogOut, Settings, Loader2, Shield, Key, Clock, Image, MessageSquare, ShieldCheck, Zap, Eye, FileKey } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { useAdmin } from "@/hooks/useAdmin";
import { isIOSPWA } from "@/lib/platformDetection";
import { NeuralBackground } from "@/components/NeuralBackground";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ocxLogo from "@/assets/ocx-logo.png";

const Index = () => {
  const [actionsRemaining, setActionsRemaining] = useState(5);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [previousPremiumStatus, setPreviousPremiumStatus] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { isPremium, isFreeUser, isBasicUser, loading: subscriptionLoading, refreshSubscription } = useSubscription();
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
        setActionsRemaining(5);
        localStorage.setItem("ocx_actions", "5");
        localStorage.setItem("ocx_last_reset", new Date().toDateString());
        toast.info("Your subscription has ended. You now have 5 daily actions.");
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
              Military-grade AES-256-GCM encryption protecting your sensitive communications with
              zero-knowledge architecture. Your data remains encrypted end-to-end - we never have access.
            </p>
            
            {/* Security Badges */}
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <Badge variant="secondary" className="px-4 py-2 text-sm gap-2">
                <ShieldCheck className="h-4 w-4" />
                AES-256-GCM
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm gap-2">
                <Key className="h-4 w-4" />
                PBKDF2 Key Derivation
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm gap-2">
                <Lock className="h-4 w-4" />
                Zero-Knowledge
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm gap-2">
                <Eye className="h-4 w-4 line-through" />
                No Server Access
              </Badge>
            </div>
          </div>

          {/* Feature Cards Section */}
          <div className="max-w-6xl mx-auto mb-16">
            <h3 className="text-2xl font-bold text-center mb-8">How Our Security Features Work</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Text Encryption Card */}
              <Card className="border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Text Encryption</CardTitle>
                  </div>
                  <CardDescription>Military-grade message protection</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                    <p><strong className="text-foreground">AES-256-GCM:</strong> Your text is encrypted using Advanced Encryption Standard with Galois/Counter Mode - the same encryption used by governments and military.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Key className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                    <p><strong className="text-foreground">PBKDF2:</strong> Keys are derived using 100,000 iterations of secure hashing, making brute-force attacks virtually impossible.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Zap className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                    <p><strong className="text-foreground">Client-Side:</strong> All encryption happens in your browser. Your original text never touches our servers.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileKey className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                    <p><strong className="text-foreground">Secure Mode:</strong> Generate a unique decryption key with optional expiration. Share the key separately for maximum security.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Image Encryption Card */}
              <Card className="border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Image className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Image Encryption</CardTitle>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    Secure image sharing
                    {!isPremium && !isAdmin && !isFreeUser && <Badge variant="outline" className="ml-2">Premium</Badge>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                    <p><strong className="text-foreground">Encrypted Storage:</strong> Images are encrypted before upload using AES-256-GCM and stored in secure isolated storage buckets.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Key className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                    <p><strong className="text-foreground">Short Codes:</strong> Each image gets a unique 6-character code. Only someone with this code can retrieve the encrypted image.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                    <p><strong className="text-foreground">Auto-Expiration:</strong> Set images to self-destruct after 1 hour, 24 hours, or 7 days. They're automatically deleted from our servers.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Eye className="h-4 w-4 mt-0.5 text-primary flex-shrink-0 line-through" />
                    <p><strong className="text-foreground">No Access:</strong> Even we cannot view your images - they remain encrypted at rest using your unique encryption key.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Ephemeral Space Card */}
              <Card className="border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Ephemeral Rooms</CardTitle>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    Temporary encrypted chat
                    {!isPremium && !isAdmin && !isFreeUser && <Badge variant="outline" className="ml-2">Premium</Badge>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                    <p><strong className="text-foreground">Real-Time Chat:</strong> Create temporary chat rooms with unique codes. Perfect for sensitive discussions that shouldn't leave a trace.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                    <p><strong className="text-foreground">Auto-Destroy:</strong> Rooms automatically expire 24 hours after creation. All messages are permanently deleted.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                    <p><strong className="text-foreground">End-to-End:</strong> Messages are encrypted in transit and only visible to room participants. No message history is retained.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Key className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                    <p><strong className="text-foreground">Secure Access:</strong> Only users with the 6-character room code can join. Each room is completely isolated.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Encryption Panel */}
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Try Text Encryption Now</h3>
              <p className="text-muted-foreground">
                Encrypt any message instantly with military-grade security
              </p>
            </div>
            <EncryptionPanel
              onActionPerformed={handleActionPerformed}
              actionsRemaining={isPremium || isAdmin || isFreeUser ? Infinity : actionsRemaining}
              onUpgradeNeeded={() => setShowUpgradeModal(true)}
            />
          </div>

          {/* Technical Transparency Section */}
          <div className="max-w-4xl mx-auto mt-16 p-6 rounded-lg border border-primary/20 bg-card/30 backdrop-blur-sm">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Built on Proven Security Standards
              </h3>
              <p className="text-sm text-muted-foreground">
                Don't just trust us - verify our security claims
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Encryption Algorithm</h4>
                  <p className="text-muted-foreground">AES-256-GCM (Advanced Encryption Standard in Galois/Counter Mode) - approved by NSA for TOP SECRET information.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Key Derivation</h4>
                  <p className="text-muted-foreground">PBKDF2 with SHA-256 using 100,000 iterations and random salt generation for each encryption.</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Browser Security</h4>
                  <p className="text-muted-foreground">Web Crypto API - native browser encryption that never exposes keys to JavaScript. All encryption happens client-side.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Backward Compatible</h4>
                  <p className="text-muted-foreground">Legacy encrypted messages are automatically supported while all new encryptions use the latest AES-256-GCM standard.</p>
                </div>
              </div>
            </div>
          </div>
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
                <Button
                  variant="link"
                  onClick={() => navigate("/settings")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Settings
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>© 2024 OCX. Your privacy is our priority.</p>
                <p className="mt-2">Client-side encryption · Zero-knowledge architecture · Military-grade security</p>
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
