import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Lock, MessageSquare, Image, Users, Gamepad2, ArrowRight } from "lucide-react";
import { NeuralBackground } from "@/components/NeuralBackground";
import ocxLogo from "@/assets/ocx-logo.png";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <NeuralBackground key="neural-bg-landing" />
      <div className="absolute inset-0 bg-gradient-surface opacity-30" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-primary/20 backdrop-blur-xl bg-card/30">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={ocxLogo} alt="OCX Logo" className="h-10 w-10 md:h-12 md:w-12 object-contain" />
              <div>
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">OCX</h1>
                <p className="text-[10px] md:text-xs text-muted-foreground">Designed with privacy-first</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/features")}>
                Features
              </Button>
              <Button variant="default" size="sm" onClick={() => navigate("/auth")} className="gap-1">
                Sign In <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Hero */}
        <main className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-6">
              <Shield className="h-3.5 w-3.5" />
              Zero-knowledge · Client-side encryption
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Encrypt Your Messages,
              <br />
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Protect Your Privacy
              </span>
            </h2>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-8">
              AES-256 encryption for your sensitive communications. Your data never touches our servers.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2 text-base px-8">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/features")} className="text-base px-8">
                See Features
              </Button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {[
              { icon: MessageSquare, title: "Text Encryption", desc: "AES-256-GCM encryption for instant secure messaging" },
              { icon: Image, title: "Image Encryption", desc: "Share encrypted images with unique 6-char codes" },
              { icon: Users, title: "Ephemeral Rooms", desc: "Self-destructing chat rooms that vanish automatically" },
              { icon: Gamepad2, title: "Earn Credits", desc: "Play games to earn credits for premium features" },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group p-6 rounded-xl border border-primary/15 bg-card/40 backdrop-blur-md hover:border-primary/40 hover:bg-card/60 transition-all cursor-pointer"
                onClick={() => navigate("/auth")}
              >
                <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary/25 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-16 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <span>100% Client-side</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Zero-knowledge</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <span>AES-256 Encryption</span>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-primary/20 backdrop-blur-xl bg-card/30 mt-20">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <div className="flex flex-wrap justify-center gap-4 mb-4">
                <Button variant="link" onClick={() => navigate("/about")} className="text-muted-foreground hover:text-foreground">About Us</Button>
                <Button variant="link" onClick={() => navigate("/disclaimer")} className="text-muted-foreground hover:text-foreground">Disclaimer</Button>
                <Button variant="link" onClick={() => navigate("/terms")} className="text-muted-foreground hover:text-foreground">Terms of Use</Button>
                <Button variant="link" onClick={() => navigate("/privacy")} className="text-muted-foreground hover:text-foreground">Privacy Policy</Button>
                <Button variant="link" onClick={() => navigate("/contact")} className="text-muted-foreground hover:text-foreground">Contact Us</Button>
              </div>
              <p className="text-sm text-muted-foreground">© 2026 OCX. Your privacy is our priority.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
