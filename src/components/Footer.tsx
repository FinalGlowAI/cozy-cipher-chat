import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-primary/20 backdrop-blur-xl bg-card/30 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-center items-center gap-6 mb-4">
          <div className="flex items-center gap-2 text-accent">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">Text Encryption Works Offline</span>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-6 mb-4">
          <Link 
            to="/about" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            About Us
          </Link>
          <Link 
            to="/disclaimer" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Disclaimer
          </Link>
          <Link 
            to="/terms" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms of Use
          </Link>
          <Link 
            to="/privacy" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          <Link 
            to="/refund-policy" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Refund Policy
          </Link>
          <Link 
            to="/settings" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Settings
          </Link>
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
  );
};
