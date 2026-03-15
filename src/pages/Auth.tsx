import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { NeuralBackground } from "@/components/NeuralBackground";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { isNativeApp, nativeGoogleSignIn } from "@/lib/nativeGoogleAuth";
import ocxLogo from "@/assets/ocx-logo.png";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          toast.error(error.message);
          trackEvent('signup_failed', { error_message: error.message });
        } else {
          toast.success("Check your email to confirm your account!");
          trackEvent('signup_success');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error(error.message);
          trackEvent('login_failed', { error_message: error.message });
        } else {
          trackEvent('login_success');
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <NeuralBackground />
      
      <div className="w-full max-w-md z-10">
        <div className="flex justify-center mb-6">
          <img src={ocxLogo} alt="OcodX" className="h-16 w-auto" />
        </div>

        <Card className="bg-card/80 backdrop-blur-xl border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {isSignUp ? "Sign up to get started" : "Sign in to your account"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Social Sign In */}
            <div className="space-y-3">
              {/* Apple Sign In */}
              <Button
                type="button"
                variant="outline"
                className="w-full min-h-[48px] text-base font-medium gap-3"
                onClick={async () => {
                  setLoading(true);
                  try {
                    const { error } = await lovable.auth.signInWithOAuth("apple", {
                      redirect_uri: window.location.origin + "/",
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
                className="w-full min-h-[48px] text-base font-medium gap-3"
                onClick={async () => {
                  setLoading(true);
                  try {
                    if (isNativeApp()) {
                      const { error } = await nativeGoogleSignIn();
                      if (error) {
                        toast.error(error.message || "Google sign-in failed");
                        trackEvent('google_login_failed', { error_message: error.message });
                      }
                    } else {
                      const { error } = await lovable.auth.signInWithOAuth("google", {
                        redirect_uri: window.location.origin + "/",
                      });
                      if (error) {
                        toast.error(error.message || "Google sign-in failed");
                        trackEvent('google_login_failed', { error_message: error.message });
                      }
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
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full min-h-[48px]" disabled={loading}>
                {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
              </Button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-primary hover:underline"
              >
                {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" /> Back to home
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
