import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ChevronLeft, ChevronRight, Lock, Unlock, ShieldCheck, KeyRound, Zap } from "lucide-react";

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to Text Encryption",
    description: "This quick guide will walk you through encrypting your first message. Let's get started!",
    icon: <Zap className="h-6 w-6 text-primary" />,
  },
  {
    title: "Choose Your Mode",
    description: "Click 'Encrypt' to secure a message, or 'Decrypt' to unlock one you've received.",
    icon: <Lock className="h-6 w-6 text-primary" />,
    highlight: "mode-toggle",
  },
  {
    title: "Standard vs Secure Mode",
    description: "Standard Mode uses your own password. Secure Mode generates a unique key with optional expiration for enhanced security.",
    icon: <ShieldCheck className="h-6 w-6 text-primary" />,
    highlight: "secure-mode",
  },
  {
    title: "Enter Your Password",
    description: "In Standard Mode, create a strong password (8+ characters with uppercase, lowercase, and numbers). Share it securely with your recipient.",
    icon: <KeyRound className="h-6 w-6 text-primary" />,
    highlight: "password-input",
  },
  {
    title: "Type Your Message",
    description: "Enter the text you want to encrypt in the input area. Your message stays on your device until encrypted.",
    icon: <Lock className="h-6 w-6 text-primary" />,
    highlight: "input-panel",
  },
  {
    title: "Get Your Encrypted Text",
    description: "Click the button to encrypt! Copy or share the result. In Secure Mode, you'll also get a decryption key to share.",
    icon: <Unlock className="h-6 w-6 text-primary" />,
    highlight: "output-panel",
  },
];

interface EncryptionTutorialProps {
  onComplete: () => void;
  isVisible: boolean;
}

export const EncryptionTutorial = ({ onComplete, isVisible }: EncryptionTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setCurrentStep(0);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const step = tutorialSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tutorialSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleSkip}
      />
      
      {/* Tutorial Card */}
      <Card className="relative z-10 w-full max-w-md mx-4 p-6 bg-card border-primary/30 shadow-glow-primary animate-in fade-in zoom-in-95 duration-300">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={handleSkip}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Step Indicator */}
        <div className="flex justify-center gap-1.5 mb-6">
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? "w-6 bg-primary"
                  : index < currentStep
                  ? "w-1.5 bg-primary/50"
                  : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-primary/10">
              {step.icon}
            </div>
          </div>
          
          <h3 className="text-xl font-semibold">{step.title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={isFirstStep}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          <span className="text-xs text-muted-foreground">
            {currentStep + 1} / {tutorialSteps.length}
          </span>

          <Button
            onClick={handleNext}
            className="gap-1"
          >
            {isLastStep ? "Get Started" : "Next"}
            {!isLastStep && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Skip Link */}
        {!isLastStep && (
          <div className="text-center mt-4">
            <button
              onClick={handleSkip}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip tutorial
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};
