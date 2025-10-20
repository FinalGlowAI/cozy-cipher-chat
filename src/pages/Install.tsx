import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Check } from "lucide-react";
import ocxLogo from "@/assets/ocx-logo.png";

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-surface opacity-50" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <Card className="w-full max-w-md relative z-10 border-primary/20 bg-card/80 backdrop-blur-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <img src={ocxLogo} alt="OCX Logo" className="h-20 w-20 object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Install OCX App
          </CardTitle>
          <CardDescription>
            Get the full app experience on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isInstalled ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-green-500/20 rounded-full">
                  <Check className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <p className="text-muted-foreground">
                OCX is already installed on your device!
              </p>
              <Button onClick={() => navigate("/")} className="w-full">
                Go to App
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Smartphone className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Works Offline</p>
                    <p className="text-sm text-muted-foreground">
                      Access your encrypted messages anytime
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Download className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Fast & Secure</p>
                    <p className="text-sm text-muted-foreground">
                      Native app experience with local encryption
                    </p>
                  </div>
                </div>
              </div>

              {deferredPrompt ? (
                <Button onClick={handleInstall} className="w-full">
                  Install App
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    To install this app:
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>iPhone/iPad:</strong> Tap Share → Add to Home Screen</p>
                    <p><strong>Android:</strong> Tap Menu → Install App or Add to Home Screen</p>
                  </div>
                </div>
              )}

              <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                Continue in Browser
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
