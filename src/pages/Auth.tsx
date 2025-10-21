import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import ocxLogo from "@/assets/ocx-logo.png";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Successfully logged in!");
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        toast.success("Account created successfully!");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-surface opacity-50" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="w-full max-w-6xl relative z-10 grid md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:block space-y-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-foreground mb-2">Join 100,000+ Users</h2>
            <p className="text-muted-foreground">Who trust us with their secure communications</p>
          </div>
          
          <div className="space-y-4">
            <Card className="border-primary/20 bg-card/60 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-primary">★</span>
                  ))}
                </div>
                <p className="text-foreground mb-4">"The most secure messaging platform I've used. Love the encryption features!"</p>
                <p className="text-sm text-muted-foreground font-semibold">- Sarah Chen, Security Analyst</p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-card/60 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-primary">★</span>
                  ))}
                </div>
                <p className="text-foreground mb-4">"Finally, a platform where I can trust my data is truly private. Highly recommend!"</p>
                <p className="text-sm text-muted-foreground font-semibold">- Michael Rodriguez, Developer</p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-card/60 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-primary">★</span>
                  ))}
                </div>
                <p className="text-foreground mb-4">"Seamless experience with top-notch security. This is the future of messaging."</p>
                <p className="text-sm text-muted-foreground font-semibold">- Emma Williams, Privacy Advocate</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="w-full border-primary/20 bg-card/80 backdrop-blur-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <img src={ocxLogo} alt="OCX Logo" className="h-20 w-20 object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {isLogin ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? "Sign in to access your secure messaging"
              : "Sign up to start encrypting your messages"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {!isLogin && (
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/terms")}
                    className="text-primary hover:underline"
                  >
                    Terms of Use
                  </button>
                </label>
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || (!isLogin && !agreedToTerms)}
            >
              {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Auth;
