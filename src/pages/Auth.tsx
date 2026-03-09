import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Shield, Key, Clock, Image, MessageSquare, ShieldCheck, Zap, FileKey } from "lucide-react";
import ocxLogo from "@/assets/ocx-logo.png";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import { trackEvent, trackError } from "@/lib/analytics";
import { lovable } from "@/integrations/lovable/index";


const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    trackEvent('login_screen_opened');
  }, []);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      // Only redirect if we have a session and we're not currently signing up
      if (session && !isSigningUp && event !== 'SIGNED_OUT') {
        navigate("/", { replace: true });
      } else {
        setIsCheckingSession(false);
      }
    });

    // Then check current session
    if (!isSigningUp) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!mounted) return;
        if (session) {
          navigate("/", { replace: true });
        } else {
          setIsCheckingSession(false);
        }
      }).catch(() => {
        if (!mounted) return;
        setIsCheckingSession(false);
      });
    } else {
      setIsCheckingSession(false);
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, isSigningUp]);

  // Show branded loading screen while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-surface opacity-30" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <img src={ocxLogo} alt="OCX Logo" className="h-16 w-16 object-contain animate-pulse" />
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Loading…</span>
          </div>
        </div>
      </div>
    );
  }


  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password match for signup
    if (!isLogin && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Validate password strength for signup
    if (!isLogin) {
      if (password.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      
      if (!hasUppercase || !hasLowercase || !hasNumber) {
        toast.error("Password must contain uppercase, lowercase, and a number");
        return;
      }
    }
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        trackEvent('login_success');
        toast.success("Successfully logged in!");
        // Navigation will be handled by onAuthStateChange listener
      } else {
        setIsSigningUp(true);
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        
        // Wait for session to be properly established
        let sessionEstablished = false;
        let retries = 0;
        const maxRetries = 5;
        
        while (!sessionEstablished && retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 300));
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            sessionEstablished = true;
            toast.success("Account created successfully!");
            setTimeout(() => {
              setIsSigningUp(false);
              navigate("/");
            }, 100);
          }
          
          retries++;
        }
        
        if (!sessionEstablished) {
          toast.success("Account created! Please sign in.");
          setIsSigningUp(false);
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      trackEvent('login_failed', { error_message: error.message });
      toast.error(error.message);
      setIsSigningUp(false);
    } finally {
      setLoading(false);
    }
  };


  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setIsResettingPassword(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email: resetEmail }
      });

      if (error) throw error;

      toast.success("Password reset link sent! Check your email.");
      setResetEmail("");
      setIsForgotPasswordOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-6 sm:p-6 md:p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-surface opacity-50" />
      <div className="absolute top-0 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Sign In Button - Top Right */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-20">
        <Button 
          onClick={() => setShowLoginForm(!showLoginForm)}
          size="sm"
          className="shadow-lg text-xs sm:text-sm"
        >
          {showLoginForm ? "Back to Features" : "Sign In"}
        </Button>
      </div>

      <div className="w-full max-w-6xl relative z-10 pt-16 sm:pt-0">
        {/* Security Features Section */}
        {!showLoginForm && (
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              OcodX
              <span className="block text-primary mt-2">Designed with privacy in mind</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Privacy-first, client-side encryption using industry-standard cryptographic technologies.
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
                <Shield className="h-4 w-4" />
                Zero-Knowledge
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm gap-2">
                <Zap className="h-4 w-4" />
                Client-Side Only
              </Badge>
            </div>
          </div>

          {/* Features Link */}
          <div className="flex justify-center mb-12">
            <div
              onClick={() => navigate("/features")}
              className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 p-[1px] transition-all duration-300 hover:from-primary/40 hover:via-accent/40 hover:to-primary/40 hover:shadow-lg hover:shadow-primary/20"
            >
              <div className="relative flex items-center gap-4 rounded-2xl bg-card/80 backdrop-blur-sm px-8 py-5 transition-all duration-300 group-hover:bg-card/60">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 group-hover:from-primary/50 group-hover:to-accent/50 transition-all duration-300">
                  <Shield className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                    Explore All Features
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    See demos of Text, Image & Ephemeral encryption
                  </p>
                </div>
                <div className="ml-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Transparency */}
          <Card className="border-primary/20 bg-card/30 backdrop-blur-sm mb-12">
            <CardHeader className="text-center">
              <CardTitle className="text-xl flex items-center justify-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Built on Proven Security Standards
              </CardTitle>
              <CardDescription>Don't just trust us - verify our security claims</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6 text-sm">
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
            </CardContent>
          </Card>
        </div>
        )}

        {/* Login/Signup Section */}
        {showLoginForm && (
        <div className="flex justify-center">

        <Card className="w-full max-w-md border-primary/20 bg-card/80 backdrop-blur-xl">
        <CardHeader className="space-y-2 sm:space-y-3 text-center px-4 sm:px-6 pt-6 sm:pt-8">
          <div className="flex justify-center mb-3 sm:mb-4">
            <img src={ocxLogo} alt="OCX Logo" className="h-16 w-16 sm:h-20 sm:w-20 object-contain" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold">
            {isLogin ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {isLogin
              ? "Sign in to access your secure messaging"
              : "Sign up to start encrypting your messages"}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
          <form onSubmit={handleAuth} className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="min-h-[44px] text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm sm:text-base">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className="min-h-[44px] text-base pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-accent z-10"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </button>
              </div>
              {!isLogin && <PasswordStrengthIndicator password={password} />}
            </div>
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm sm:text-base">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="min-h-[44px] text-base pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-accent z-10"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                </div>
              </div>
            )}
            {isLogin && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me for 30 days
                </label>
              </div>
            )}
            {!isLogin && (
              <div className="flex items-start space-x-3 py-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                  className="mt-0.5"
                />
                <label
                  htmlFor="terms"
                  className="text-sm sm:text-base text-muted-foreground leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/terms")}
                    className="text-primary hover:underline inline-block min-h-[24px]"
                  >
                    Terms of Use
                  </button>
                </label>
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full min-h-[48px] text-base font-medium" 
              disabled={loading || (!isLogin && !agreedToTerms)}
            >
              {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card/80 px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          {/* Apple Sign In */}
          <Button
            type="button"
            variant="outline"
            className="w-full min-h-[48px] text-base font-medium gap-3"
            onClick={async () => {
              setLoading(true);
              try {
                const { error } = await lovable.auth.signInWithOAuth("apple", {
                  redirect_uri: window.location.origin + "/auth",
                });
                if (error) {
                  toast.error(error.message || "Apple sign-in failed");
                  trackEvent('apple_login_failed', { error_message: error.message });
                }
              } catch (err: any) {
                toast.error(err.message || "Apple sign-in failed");
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Continue with Apple
          </Button>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            className="w-full min-h-[48px] text-base font-medium gap-3 mt-3"
            onClick={async () => {
              setLoading(true);
              try {
                const { error } = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: window.location.origin + "/auth",
                });
                if (error) {
                  toast.error(error.message || "Google sign-in failed");
                  trackEvent('google_login_failed', { error_message: error.message });
                }
              } catch (err: any) {
                toast.error(err.message || "Google sign-in failed");
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>

          <div className="mt-5 sm:mt-6 text-center space-y-3">
            {isLogin && (
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(true)}
                className="text-primary hover:underline text-sm sm:text-base min-h-[44px] inline-flex items-center justify-center w-full"
              >
                Forgot your password?
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline text-sm sm:text-base min-h-[44px] inline-flex items-center justify-center w-full"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Your Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="you@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                className="min-h-[44px]"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full min-h-[44px]"
              disabled={isResettingPassword}
            >
              {isResettingPassword ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
        </div>
        )}

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
                  onClick={() => navigate("/settings")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Settings
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>© 2026 OCX. Your privacy is our priority.</p>
                <p className="mt-2">Client-side encryption · Zero-knowledge architecture · AES-256-GCM</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Auth;
