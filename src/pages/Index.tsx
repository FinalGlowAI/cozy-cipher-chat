import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { LogOut, Settings, Loader2, Shield, Key, Clock, Image, MessageSquare, ShieldCheck, Zap, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { useAdmin } from "@/hooks/useAdmin";
import { NeuralBackground } from "@/components/NeuralBackground";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ocxLogo from "@/assets/ocx-logo.png";

const Index = () => {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
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
      if (sess) {
        refreshSubscription();
      }
    });

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
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      <NeuralBackground key="neural-bg" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <header className="border-b border-primary/20 backdrop-blur-xl bg-card/30">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={ocxLogo} alt="OCX Logo" className="h-12 w-12 object-contain" />
                <h1 className="text-2xl font-bold">
                  OCX encryption
                </h1>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
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
                  onClick={() => navigate("/settings")}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden md:inline">Settings</span>
                </Button>
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
        <main className="container mx-auto px-4 py-12 flex-1">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                You Can Trust
              </span>
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
              Built with AES-256-GCM Military-Grade encryption and zero-knowledge architecture. Your data remains encrypted end-to-end - we never have access.
            </p>
          </div>

          {/* Security Badges */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <Badge variant="outline" className="flex items-center gap-2 px-4 py-3 text-sm">
              <ShieldCheck className="h-4 w-4" />
              AES-256-GCM
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2 px-4 py-3 text-sm">
              <Key className="h-4 w-4" />
              PBKDF2 Key Derivation
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2 px-4 py-3 text-sm">
              <Eye className="h-4 w-4" />
              Zero-Knowledge
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2 px-4 py-3 text-sm">
              <Zap className="h-4 w-4" />
              Client-Side Only
            </Badge>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card 
              className="cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => navigate("/ephemeral")}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="flex items-center gap-2">
                  Text Encryption
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Military-grade message protection</CardDescription>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => navigate("/image-encryption")}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Image className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="flex items-center gap-2">
                  Image Encryption
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Secure image sharing</CardDescription>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => navigate("/ephemeral")}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="flex items-center gap-2">
                  Ephemeral Rooms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Temporary encrypted chat</CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Security Standards Section */}
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Shield className="h-6 w-6 text-primary" />
                <h3 className="text-2xl font-bold">Built on Proven Security Standards</h3>
              </div>
              <p className="text-muted-foreground">
                Don't just trust us - verify our security claims
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold mb-2">Encryption Algorithm</h4>
                <p className="text-sm text-muted-foreground">
                  AES-256-GCM (Advanced Encryption Standard in Galois/Counter Mode) - approved by NSA for TOP SECRET information.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Browser Security</h4>
                <p className="text-sm text-muted-foreground">
                  Web Crypto API - native browser encryption that never exposes keys to JavaScript. All encryption happens client-side.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Key Derivation</h4>
                <p className="text-sm text-muted-foreground">
                  PBKDF2 with SHA-256 using 100,000 iterations and random salt generation for each encryption.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Backward Compatible</h4>
                <p className="text-sm text-muted-foreground">
                  Legacy encrypted messages are automatically supported while all new encryptions use the latest AES-256-GCM standard.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-primary/20 backdrop-blur-xl bg-card/30 mt-auto">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-wrap justify-center items-center gap-6 mb-4">
              <div className="flex items-center gap-2 text-accent">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">Text Encryption Works Offline</span>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 mb-4">
              <button 
                onClick={() => navigate("/about")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                About Us
              </button>
              <button 
                onClick={() => navigate("/disclaimer")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Disclaimer
              </button>
              <button 
                onClick={() => navigate("/terms")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Use
              </button>
              <button 
                onClick={() => navigate("/privacy")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => navigate("/refund-policy")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Refund Policy
              </button>
              <button 
                onClick={() => navigate("/settings")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Settings
              </button>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                © 2025 OCX. Your privacy is our priority.
              </p>
              <p className="text-xs text-muted-foreground">
                Client-side encryption · Zero-knowledge architecture · Military-grade security
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
