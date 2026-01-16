import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ChevronLeft, ChevronRight, MessageSquare, Users, Lock, Copy, Send, Zap } from "lucide-react";

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to Ephemeral Rooms",
    description: "Secure, temporary chat rooms that disappear when everyone leaves. Perfect for private conversations!",
    icon: <Zap className="h-6 w-6 text-primary" />,
  },
  {
    title: "Share the Room Code",
    description: "Copy the room code shown in the header and share it with people you want to chat with. They can join using this code.",
    icon: <Copy className="h-6 w-6 text-primary" />,
  },
  {
    title: "See Who's Online",
    description: "The colored circles in the header show active users in the room. Each person gets a unique color for easy identification.",
    icon: <Users className="h-6 w-6 text-primary" />,
  },
  {
    title: "Lock Your Room",
    description: "As the room creator, you can lock the room to prevent new users from joining. Existing participants can continue chatting.",
    icon: <Lock className="h-6 w-6 text-primary" />,
  },
  {
    title: "Send Messages",
    description: "Type your message and press Enter or click Send. Messages are color-coded to match each user's identity.",
    icon: <Send className="h-6 w-6 text-primary" />,
  },
  {
    title: "Messages Disappear",
    description: "When all users leave the room, all messages are automatically deleted. Nothing is stored permanently!",
    icon: <MessageSquare className="h-6 w-6 text-primary" />,
  },
];

interface EphemeralRoomTutorialProps {
  onComplete: () => void;
  onDontShowAgain?: () => void;
  isVisible: boolean;
}

export const EphemeralRoomTutorial = ({ onComplete, onDontShowAgain, isVisible }: EphemeralRoomTutorialProps) => {
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
