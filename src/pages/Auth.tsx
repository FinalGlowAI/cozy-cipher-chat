import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Users, Shield, Key, Clock, Image, MessageSquare, ShieldCheck, Zap, FileKey } from "lucide-react";
import ocxLogo from "@/assets/ocx-logo.png";

interface Testimonial {
  id: string;
  user_name: string;
  user_title: string | null;
  comment: string;
  rating: number;
  created_at: string;
}

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
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [newTestimonial, setNewTestimonial] = useState({ name: "", title: "", comment: "", rating: 5 });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in (but not if we're in the middle of signing up)
    if (!isSigningUp) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          navigate("/");
        }
      });
    }

    // Fetch testimonials
    const fetchTestimonials = async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(10);

      if (data && !error) {
        setTestimonials(data);
      }
    };

    fetchTestimonials();

    // Subscribe to new testimonials
    const channel = supabase
      .channel("testimonials-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "testimonials",
          filter: "is_approved=eq.true",
        },
        (payload) => {
          setTestimonials((prev) => [payload.new as Testimonial, ...prev].slice(0, 10));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate, isSigningUp]);

  // Auto-rotate testimonials
  useEffect(() => {
    if (testimonials.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password match for signup
    if (!isLogin && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
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
      toast.error(error.message);
      setIsSigningUp(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTestimonial.name.trim() || !newTestimonial.comment.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const { error } = await supabase.from("testimonials").insert({
      user_name: newTestimonial.name.trim(),
      user_title: newTestimonial.title.trim() || null,
      comment: newTestimonial.comment.trim(),
      rating: newTestimonial.rating,
    });

    if (error) {
      toast.error("Failed to submit testimonial");
    } else {
      toast.success("Thank you! Your testimonial will be reviewed.");
      setNewTestimonial({ name: "", title: "", comment: "", rating: 5 });
      setIsDialogOpen(false);
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
              OCX encryption
              <span className="block text-primary mt-2">You Can Trust</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built with AES-256-GCM Military-Grade encryption and zero-knowledge architecture. 
              Your data remains encrypted end-to-end - we never have access.
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

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Text Encryption Card */}
            <Card 
              className="border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all"
            >
              <CardHeader 
                className="cursor-pointer"
                onClick={() => setExpandedCard(expandedCard === "text" ? null : "text")}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Text Encryption</CardTitle>
                </div>
                <CardDescription>Military-grade message protection</CardDescription>
              </CardHeader>
              {expandedCard === "text" && (
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
                  <Button 
                    onClick={() => setShowLoginForm(true)} 
                    className="w-full mt-4"
                  >
                    Go to Text Encryption
                  </Button>
                </CardContent>
              )}
            </Card>

            {/* Image Encryption Card */}
            <Card 
              className="border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all"
            >
              <CardHeader 
                className="cursor-pointer"
                onClick={() => setExpandedCard(expandedCard === "image" ? null : "image")}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Image className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Image Encryption</CardTitle>
                </div>
                <CardDescription className="flex items-center gap-1">
                  Secure image sharing
                  <Badge variant="outline" className="ml-2">Premium</Badge>
                </CardDescription>
              </CardHeader>
              {expandedCard === "image" && (
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
                    <Zap className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                    <p><strong className="text-foreground">Zero Access:</strong> We can't see your images - they're encrypted client-side before upload.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                    <p><strong className="text-foreground">Self-Destruct:</strong> Set automatic deletion after a specific time. Perfect for temporary sharing.</p>
                  </div>
                  <Button 
                    onClick={() => setShowLoginForm(true)} 
                    className="w-full mt-4"
                  >
                    Go to Image Encryption
                  </Button>
                </CardContent>
              )}
            </Card>

            {/* Ephemeral Space Card */}
            <Card 
              className="border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all"
            >
              <CardHeader 
                className="cursor-pointer"
                onClick={() => setExpandedCard(expandedCard === "ephemeral" ? null : "ephemeral")}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Ephemeral Rooms</CardTitle>
                </div>
                <CardDescription className="flex items-center gap-1">
                  Temporary encrypted chat
                  <Badge variant="outline" className="ml-2">Premium</Badge>
                </CardDescription>
              </CardHeader>
              {expandedCard === "ephemeral" && (
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
                    <p><strong className="text-foreground">End-to-End:</strong> Messages are encrypted in transit and only visible to room participants.</p>
                  </div>
                  <Button 
                    onClick={() => setShowLoginForm(true)} 
                    className="w-full mt-4"
                  >
                    Go to Ephemeral Rooms
                  </Button>
                </CardContent>
              )}
            </Card>
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
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-start">
        <div className="space-y-6 lg:space-y-8">
          <div className="text-center mb-6 lg:mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Join 100,000+ Users</h2>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 rounded-full animate-pulse">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-primary">TRUSTED</span>
              </div>
            </div>
            <p className="text-sm lg:text-base text-muted-foreground">Who trust us with their secure encryption</p>
          </div>
          
          <div className="space-y-4 min-h-[400px] flex flex-col">
            {testimonials.length > 0 ? (
              <Card className="border-primary/20 bg-card/60 backdrop-blur-sm transition-all duration-500 flex-1">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-3">
                    {[...Array(testimonials[currentTestimonialIndex].rating)].map((_, i) => (
                      <span key={i} className="text-primary">★</span>
                    ))}
                  </div>
                  <p className="text-foreground mb-4">"{testimonials[currentTestimonialIndex].comment}"</p>
                  <p className="text-sm text-muted-foreground font-semibold">
                    - {testimonials[currentTestimonialIndex].user_name}
                    {testimonials[currentTestimonialIndex].user_title && `, ${testimonials[currentTestimonialIndex].user_title}`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-primary/20 bg-card/60 backdrop-blur-sm flex-1">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center">Loading testimonials...</p>
                </CardContent>
              </Card>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full min-h-[44px]">Share Your Experience</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Your Testimonial</DialogTitle>
                  <DialogDescription>
                    Tell us about your experience. Your testimonial will be reviewed before appearing on the page.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitTestimonial} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="testimonial-name">Name *</Label>
                    <Input
                      id="testimonial-name"
                      value={newTestimonial.name}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, name: e.target.value })}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="testimonial-title">Title (Optional)</Label>
                    <Input
                      id="testimonial-title"
                      value={newTestimonial.title}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, title: e.target.value })}
                      placeholder="e.g., Security Analyst"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="testimonial-comment">Your Experience *</Label>
                    <Textarea
                      id="testimonial-comment"
                      value={newTestimonial.comment}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, comment: e.target.value })}
                      placeholder="Share your thoughts..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rating</Label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setNewTestimonial({ ...newTestimonial, rating })}
                          className={`text-2xl ${rating <= newTestimonial.rating ? "text-primary" : "text-muted-foreground"}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button type="submit" className="w-full min-h-[44px]">Submit Testimonial</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="w-full border-primary/20 bg-card/80 backdrop-blur-xl">
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
                  minLength={6}
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
                    minLength={6}
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
                <p>© 2025 OCX. Your privacy is our priority.</p>
                <p className="mt-2">Client-side encryption · Zero-knowledge architecture · Military-grade security</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Auth;
