import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ChevronLeft, ChevronRight, ImageIcon, Upload, Clock, Key, Unlock, Zap } from "lucide-react";

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to Image Encryption",
    description: "Learn how to securely encrypt and share images using a simple 6-character code. Let's walk through the process!",
    icon: <Zap className="h-6 w-6 text-primary" />,
  },
  {
    title: "Choose Your Mode",
    description: "Toggle between 'Encrypt' to secure a new image, or 'Decrypt' to view an image using a code you received.",
    icon: <ImageIcon className="h-6 w-6 text-primary" />,
  },
  {
    title: "Upload Your Image",
    description: "Take a photo with your camera or choose an image from your gallery. Maximum file size is 5MB. All processing happens locally.",
    icon: <Upload className="h-6 w-6 text-primary" />,
  },
  {
    title: "Set Code Validity",
    description: "Choose how long your code should remain valid—from 5 minutes to never. After expiration, the image is automatically deleted.",
    icon: <Clock className="h-6 w-6 text-primary" />,
  },
  {
    title: "Get Your Code",
    description: "Click 'Generate Code' to receive a unique 6-character code. Share this code with anyone you want to access your image.",
    icon: <Key className="h-6 w-6 text-primary" />,
  },
  {
    title: "Decrypt Images",
    description: "In decrypt mode, enter the 6-character code to view the encrypted image. Make sure the code hasn't expired!",
    icon: <Unlock className="h-6 w-6 text-primary" />,
  },
];

interface ImageEncryptionTutorialProps {
  onComplete: () => void;
  onDontShowAgain?: () => void;
  isVisible: boolean;
}

export const ImageEncryptionTutorial = ({ onComplete, onDontShowAgain, isVisible }: ImageEncryptionTutorialProps) => {
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

  const handleDontShowAgain = () => {
    onDontShowAgain?.();
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

        {/* Skip Links */}
        {!isLastStep && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={handleSkip}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip tutorial
            </button>
            <span className="text-muted-foreground/50">•</span>
            <button
              onClick={handleDontShowAgain}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Don't show again
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};
