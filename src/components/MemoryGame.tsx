import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Gamepad2, Trophy, X } from "lucide-react";

const SYMBOLS = ["△", "7", "⬡", "A", "●", "9", "◇", "B", "★", "3", "⬢", "Z", "◯", "5", "♦", "K"];

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const generateSequence = (length: number): string[] => {
  const shuffled = shuffleArray(SYMBOLS);
  return shuffled.slice(0, length);
};

const generateChoices = (correctSequence: string[]): string[][] => {
  const choices: string[][] = [correctSequence];
  
  // Generate 2 wrong choices by swapping 2 adjacent elements
  for (let i = 0; i < 2; i++) {
    const wrongSequence = [...correctSequence];
    // Pick a random position to swap (not the last one)
    const swapIndex = Math.floor(Math.random() * (wrongSequence.length - 1));
    [wrongSequence[swapIndex], wrongSequence[swapIndex + 1]] = 
      [wrongSequence[swapIndex + 1], wrongSequence[swapIndex]];
    choices.push(wrongSequence);
  }
  
  return shuffleArray(choices);
};

interface MemoryGameProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWin?: () => void;
}

type GameState = "idle" | "memorize" | "choose" | "result";

export const MemoryGame = ({ open, onOpenChange, onWin }: MemoryGameProps) => {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [sequence, setSequence] = useState<string[]>([]);
  const [choices, setChoices] = useState<string[][]>([]);
  const [countdown, setCountdown] = useState(5);
  const [won, setWon] = useState(false);

  const startGame = useCallback(() => {
    const newSequence = generateSequence(6);
    setSequence(newSequence);
    setChoices(generateChoices(newSequence));
    setGameState("memorize");
    setCountdown(5);
    setWon(false);
  }, []);

  useEffect(() => {
    if (gameState === "memorize" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState === "memorize" && countdown === 0) {
      setGameState("choose");
    }
  }, [gameState, countdown]);

  const handleChoice = (chosenSequence: string[]) => {
    const isCorrect = chosenSequence.every((symbol, index) => symbol === sequence[index]);
    setWon(isCorrect);
    setGameState("result");
    
    if (isCorrect) {
      toast.success("Correct! You have a great memory!");
      onWin?.();
    } else {
      toast.error("Wrong sequence. Try again!");
    }
  };

  const handleClose = () => {
    setGameState("idle");
    onOpenChange(false);
  };

  useEffect(() => {
    if (open && gameState === "idle") {
      startGame();
    }
  }, [open, gameState, startGame]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-xl border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Gamepad2 className="h-5 w-5 text-primary" />
            Memory Challenge
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {gameState === "memorize" && (
            <div className="text-center space-y-6">
              <p className="text-muted-foreground">
                Memorize this sequence! Time left: <span className="text-primary font-bold">{countdown}s</span>
              </p>
              <div className="flex justify-center gap-3 py-8 px-4 bg-background/50 rounded-lg border border-primary/20">
                {sequence.map((symbol, index) => (
                  <span
                    key={index}
                    className="text-3xl font-bold text-primary animate-pulse"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {symbol}
                  </span>
                ))}
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(countdown / 5) * 100}%` }}
                />
              </div>
            </div>
          )}

          {gameState === "choose" && (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground mb-6">
                Select the correct sequence:
              </p>
              <div className="space-y-3">
                {choices.map((choice, choiceIndex) => (
                  <Button
                    key={choiceIndex}
                    variant="outline"
                    className="w-full py-6 text-lg hover:border-primary hover:bg-primary/10 transition-all"
                    onClick={() => handleChoice(choice)}
                  >
                    <div className="flex gap-3">
                      {choice.map((symbol, symbolIndex) => (
                        <span key={symbolIndex} className="font-mono">
                          {symbol}
                        </span>
                      ))}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {gameState === "result" && (
            <div className="text-center space-y-6">
              {won ? (
                <>
                  <div className="flex justify-center">
                    <Trophy className="h-16 w-16 text-yellow-500 animate-bounce" />
                  </div>
                  <h3 className="text-2xl font-bold text-primary">Congratulations!</h3>
                  <p className="text-muted-foreground">
                    You remembered the sequence correctly!
                  </p>
                </>
              ) : (
                <>
                  <div className="flex justify-center">
                    <X className="h-16 w-16 text-destructive" />
                  </div>
                  <h3 className="text-2xl font-bold text-destructive">Oops!</h3>
                  <p className="text-muted-foreground">
                    The correct sequence was:
                  </p>
                  <div className="flex justify-center gap-3 py-4">
                    {sequence.map((symbol, index) => (
                      <span key={index} className="text-2xl font-bold text-primary">
                        {symbol}
                      </span>
                    ))}
                  </div>
                </>
              )}
              <div className="flex gap-3 justify-center pt-4">
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
                <Button onClick={startGame} className="bg-primary hover:bg-primary/90">
                  Play Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
