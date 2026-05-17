import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, Image, Users, Gamepad2, Shield, Key, Clock, Zap } from "lucide-react";
import ocxLogo from "@/assets/ocx-logo.png";
import textEncryptionImage from "@/assets/feature-text-encryption.jpg";
import imageEncryptionImage from "@/assets/feature-image-encryption.jpg";
import ephemeralRoomsImage from "@/assets/feature-ephemeral-rooms.jpg";
import creditsGamesImage from "@/assets/feature-credits-games.jpg";

const features = [
  {
    id: "text-encryption",
    title: "Text Encryption",
    description: "AES-256-GCM encryption for your messages",
    image: textEncryptionImage,
    icon: MessageSquare,
    badge: null,
    details: [
      { icon: Shield, text: "AES-256-GCM encryption - the industry standard for secure communications" },
      { icon: Key, text: "PBKDF2 key derivation with 100,000 iterations for maximum security" },
      { icon: Zap, text: "Client-side only - your original text never touches our servers" },
      { icon: Clock, text: "Optional time-limited keys for enhanced security" },
    ],
  },
  {
    id: "image-encryption",
    title: "Image Encryption",
    description: "Secure image sharing with unique 6-character codes",
    image: imageEncryptionImage,
    icon: Image,
    badge: "Premium",
    details: [
      { icon: Shield, text: "Images encrypted client-side using AES-256-GCM before upload" },
      { icon: Key, text: "Unique 6-character codes for secure sharing" },
      { icon: Zap, text: "Zero-knowledge architecture - we can never see your images" },
      { icon: Clock, text: "Set automatic expiration for temporary sharing" },
    ],
  },
  {
    id: "ephemeral-rooms",
    title: "Ephemeral Rooms",
    description: "Temporary encrypted chat rooms that leave no trace",
    image: ephemeralRoomsImage,
    icon: Users,
    badge: "Premium",
    details: [
      { icon: MessageSquare, text: "Real-time encrypted messaging with unique room codes" },
      { icon: Clock, text: "Messages automatically deleted when all users leave" },
      { icon: Shield, text: "Room creator can lock rooms to prevent new participants" },
      { icon: Zap, text: "No message history retained - perfect privacy" },
    ],
  },
  {
    id: "credits-games",
    title: "Gamified Credits",
    description: "Earn credits by playing brain-training games",
    image: creditsGamesImage,
    icon: Gamepad2,
    badge: null,
    details: [
      { icon: Gamepad2, text: "Three brain-training games: Memory Challenge, Symbol Match & Flash Number" },
      { icon: Zap, text: "Earn 5-50 credits per level based on difficulty" },
      { icon: Clock, text: "Daily progress reset keeps the challenge fresh" },
      { icon: Shield, text: "Use credits for premium features without subscription" },
    ],
  },
];

const Features = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-surface opacity-50" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10">
        <header className="border-b border-primary/20 backdrop-blur-xl bg-card/30">
          <div className="container mx-auto px-4 py-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <Button onClick={() => navigate("/auth")}>
              Get Started
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="text-center mb-12">
            <img 
              src={ocxLogo} 
              alt="OcodX Logo" 
              className="h-20 w-20 mx-auto mb-6"
            />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              OcodX Features
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover the powerful security tools that make OcodX the ultimate privacy-first encryption platform.
            </p>
          </div>

          <div className="space-y-16">
            {features.map((feature, index) => (
              <Card
                key={feature.id}
                className="border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden"
              >
                <div className={`grid md:grid-cols-2 gap-6 ${index % 2 === 1 ? 'md:grid-flow-dense' : ''}`}>
                  {/* Image Section */}
                  <div className={`relative aspect-video ${index % 2 === 1 ? 'md:col-start-2' : ''}`}>
                    <img
                      src={feature.image}
                      alt={feature.title}
                      loading="lazy"
                      width={1280}
                      height={720}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent pointer-events-none" />
                  </div>

                  {/* Content Section */}
                  <div className="p-6 md:p-8 flex flex-col justify-center">
                    <CardHeader className="p-0 mb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <feature.icon className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">{feature.title}</CardTitle>
                        {feature.badge && (
                          <Badge variant="outline">{feature.badge}</Badge>
                        )}
                      </div>
                      <CardDescription className="text-base">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-0">
                      <ul className="space-y-3">
                        {feature.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-start gap-3 text-sm text-muted-foreground">
                            <detail.icon className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                            <span>{detail.text}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => navigate("/auth")}
                        className="mt-6"
                      >
                        Try {feature.title}
                      </Button>
                    </CardContent>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <Card className="border-primary/20 bg-card/50 backdrop-blur-sm p-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Ready to Secure Your Data?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Join thousands of users who trust OCX for their privacy needs. 
                Get started for free with 5 daily text encryptions.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" onClick={() => navigate("/auth")}>
                  Create Free Account
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/about")}>
                  Learn More
                </Button>
              </div>
            </Card>
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

export default Features;
