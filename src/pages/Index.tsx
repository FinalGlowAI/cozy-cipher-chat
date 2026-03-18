import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { EncryptionPanel } from "@/components/EncryptionPanel";
import { Lock, LogOut, Settings, Loader2, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAdmin } from "@/hooks/useAdmin";
import { NeuralBackground } from "@/components/NeuralBackground";
import { GameSelector } from "@/components/GameSelector";
import { CreditDisplay } from "@/components/CreditDisplay";
import { consumeCapturedOAuthTokens } from "@/lib/oauthHashCapture";
import ocxLogo from "@/assets/ocx-logo.png";

const Index = () => {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [gameOpen, setGameOpen] = useState(false);
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();

  useEffect(() => {
    let mounted = true;

    // Try to restore session from captured OAuth hash tokens (captured before React Router mounted)
    const tokens = consumeCapturedOAuthTokens();
    if (tokens) {
      supabase.auth.setSession({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      }).then(({ data, error }) => {
        if (!mounted) return;
        if (!error && data.session) {
          setSession(data.session);
        }
        // If setSession fails, the normal getSession() flow below will handle it
        if (error) {
          console.warn("setSession from hash failed, falling back:", error.message);
        }
      });
    }

    const safetyTimeout = setTimeout(async () => {
      if (!mounted) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(session ?? null);
      } catch {
        if (!mounted) return;
        setSession(null);
      }
    }, 3000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!mounted) return;
      clearTimeout(safetyTimeout);
      setSession(sess ?? null);
    });

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        clearTimeout(safetyTimeout);
        setSession(session ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        clearTimeout(safetyTimeout);
        setSession(null);
      });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session !== null) return;

    let cancelled = false;
    (async () => {
      try {
        const { data: { session: latest } } = await supabase.auth.getSession();
        if (cancelled) return;
        if (latest) {
          setSession(latest);
        } else {
          navigate("/auth", { replace: true });
        }
      } catch {
        if (!cancelled) navigate("/auth", { replace: true });
      }
    })();

    return () => { cancelled = true; };
  }, [session, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-surface opacity-30" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <img src={ocxLogo} alt="OCX Logo" className="h-16 w-16 object-contain animate-pulse" />
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Loading your session…</span>
          </div>
        </div>
      </div>
    );
  }

  if (session === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-surface opacity-30" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <img src={ocxLogo} alt="OCX Logo" className="h-16 w-16 object-contain animate-pulse" />
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Redirecting…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <NeuralBackground key="neural-bg" />
      <div className="absolute inset-0 bg-gradient-surface opacity-30" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10">
        <header className="border-b border-primary/20 backdrop-blur-xl bg-card/30">
          <div className="container mx-auto px-4 py-4">
            {/* Mobile Layout */}
            <div className="flex flex-col gap-3 md:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={ocxLogo} alt="OCX Logo" className="h-10 w-10 object-contain" />
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">OCX</h1>
                    <p className="text-[10px] text-muted-foreground">Designed with privacy-first</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => navigate("/ephemeral")} className="h-9 w-9">💬</Button>
                  <Button variant="outline" size="icon" onClick={() => navigate("/image-encryption")} className="h-9 w-9">🖼️</Button>
                  {isAdmin && (
                    <Button variant="secondary" size="icon" onClick={() => navigate("/admin")} className="h-9 w-9">
                      <Settings className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3">
                <CreditDisplay />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setGameOpen(true)}
                  className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 shadow-lg hover:shadow-pink-500/30 transition-all"
                  title="Play Games to Earn Credits"
                >
                  <Gamepad2 className="h-5 w-5 text-white" />
                </Button>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={ocxLogo} alt="OCX Logo" className="h-12 w-12 object-contain" />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">OCX</h1>
                  <p className="text-xs text-muted-foreground">Designed with privacy-first</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CreditDisplay />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setGameOpen(true)}
                  className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 shadow-lg hover:shadow-pink-500/30 transition-all"
                  title="Play Games to Earn Credits"
                >
                  <Gamepad2 className="h-6 w-6 text-white" />
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>100% Private</span>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate("/ephemeral")}>Ephemeral Space</Button>
                  <Button variant="outline" size="sm" onClick={() => navigate("/image-encryption")}>Image Encryption</Button>
                </div>
                {isAdmin && (
                  <Button variant="secondary" size="sm" onClick={() => navigate("/admin")} className="gap-2">
                    <Settings className="h-4 w-4" />
                    Admin
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

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
              AES-256 encryption for your sensitive communications. Start encrypting instantly.
            </p>
          </div>
          <EncryptionPanel onOpenGames={() => setGameOpen(true)} />
        </main>

        <footer className="border-t border-primary/20 backdrop-blur-xl bg-card/30 mt-20">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <div className="flex flex-wrap justify-center gap-4 mb-4">
                <Button variant="link" onClick={() => navigate("/about")} className="text-muted-foreground hover:text-foreground">About Us</Button>
                <Button variant="link" onClick={() => navigate("/disclaimer")} className="text-muted-foreground hover:text-foreground">Disclaimer</Button>
                <Button variant="link" onClick={() => navigate("/terms")} className="text-muted-foreground hover:text-foreground">Terms of Use</Button>
                <Button variant="link" onClick={() => navigate("/privacy")} className="text-muted-foreground hover:text-foreground">Privacy Policy</Button>
                <Button variant="link" onClick={() => navigate("/settings")} className="text-muted-foreground hover:text-foreground">Settings</Button>
                <Button variant="link" onClick={() => navigate("/contact")} className="text-muted-foreground hover:text-foreground">Contact Us</Button>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>© 2026 OCX. Your privacy is our priority.</p>
                <p className="mt-2">Client-side encryption · Zero-knowledge architecture · AES-256 encryption</p>
                <p className="mt-1">Text & Image Encryption · Ephemeral Rooms · Gamified Credits</p>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <GameSelector open={gameOpen} onOpenChange={setGameOpen} onWin={() => {}} />
    </div>
  );
};

export default Index;
