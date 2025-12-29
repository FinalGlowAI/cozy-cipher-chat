import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Gamepad2, Trophy, X, Star, ChevronRight, Lock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const SYMBOLS = ["△", "7", "⬡", "A", "●", "9", "◇", "B", "★", "3", "⬢", "Z", "◯", "5", "♦", "K", "⬟", "8", "◆", "M"];

const LEVELS = [
  { level: 1, symbolCount: 3, memorizeTime: 6, name: "Beginner" },
  { level: 2, symbolCount: 4, memorizeTime: 6, name: "Easy" },
  { level: 3, symbolCount: 5, memorizeTime: 5, name: "Medium" },
  { level: 4, symbolCount: 6, memorizeTime: 5, name: "Challenging" },
  { level: 5, symbolCount: 7, memorizeTime: 4, name: "Hard" },
  { level: 6, symbolCount: 8, memorizeTime: 4, name: "Expert" },
  { level: 7, symbolCount: 9, memorizeTime: 3, name: "Master" },
];

const ROUNDS_PER_LEVEL = 5;
const STORAGE_KEY = "memory-game-unlocked-level";

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
  
  for (let i = 0; i < 2; i++) {
    const wrongSequence = [...correctSequence];
    const swapIndex = Math.floor(Math.random() * (wrongSequence.length - 1));
    [wrongSequence[swapIndex], wrongSequence[swapIndex + 1]] = 
      [wrongSequence[swapIndex + 1], wrongSequence[swapIndex]];
    choices.push(wrongSequence);
  }
  
  return shuffleArray(choices);
};

const getUnlockedLevel = (): number => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? Math.min(parseInt(stored, 10), 7) : 1;
  } catch {
    return 1;
  }
};

const saveUnlockedLevel = (level: number) => {
  try {
    localStorage.setItem(STORAGE_KEY, String(level));
  } catch {
    // Ignore storage errors
  }
};

interface MemoryGameProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWin?: () => void;
}

type GameState = "menu" | "memorize" | "choose" | "round-result" | "level-complete" | "game-complete";

export const MemoryGame = ({ open, onOpenChange, onWin }: MemoryGameProps) => {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [sequence, setSequence] = useState<string[]>([]);
  const [choices, setChoices] = useState<string[][]>([]);
  const [countdown, setCountdown] = useState(5);
  const [roundWon, setRoundWon] = useState(false);

  const levelConfig = LEVELS[currentLevel - 1];

  // Load unlocked level on mount
  useEffect(() => {
    setUnlockedLevel(getUnlockedLevel());
  }, []);

  const startRound = useCallback(() => {
    const config = LEVELS[currentLevel - 1];
    const newSequence = generateSequence(config.symbolCount);
    setSequence(newSequence);
    setChoices(generateChoices(newSequence));
    setGameState("memorize");
    setCountdown(config.memorizeTime);
    setRoundWon(false);
  }, [currentLevel]);

  const startLevel = useCallback((level: number) => {
    setCurrentLevel(level);
    setCurrentRound(1);
    const config = LEVELS[level - 1];
    const newSequence = generateSequence(config.symbolCount);
    setSequence(newSequence);
    setChoices(generateChoices(newSequence));
    setGameState("memorize");
    setCountdown(config.memorizeTime);
    setRoundWon(false);
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
    setRoundWon(isCorrect);
    
    if (isCorrect) {
      if (currentRound >= ROUNDS_PER_LEVEL) {
        // Level completed - unlock next level
        if (currentLevel < 7 && currentLevel >= unlockedLevel) {
          const newUnlockedLevel = currentLevel + 1;
          setUnlockedLevel(newUnlockedLevel);
          saveUnlockedLevel(newUnlockedLevel);
          toast.success(`Level ${currentLevel + 1} unlocked!`);
        }
        
        if (currentLevel >= 7) {
          setGameState("game-complete");
          onWin?.();
        } else {
          setGameState("level-complete");
        }
      } else {
        setGameState("round-result");
      }
    } else {
      setGameState("round-result");
    }
  };

  const handleNextRound = () => {
    if (roundWon) {
      setCurrentRound(currentRound + 1);
      startRound();
    } else {
      startRound();
    }
  };

  const handleNextLevel = () => {
    setCurrentLevel(currentLevel + 1);
    setCurrentRound(1);
    startRound();
  };

  const handleClose = () => {
    setGameState("menu");
    setCurrentLevel(1);
    setCurrentRound(1);
    onOpenChange(false);
  };

  useEffect(() => {
    if (open && gameState === "menu") {
      // Reset to menu when opening
    }
  }, [open, gameState]);

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
          {/* Level Selection Menu */}
          {gameState === "menu" && (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground mb-4">
                Select a difficulty level to start
              </p>
              <div className="grid gap-2">
                {LEVELS.map((level) => {
                  const isLocked = level.level > unlockedLevel;
                  const isCompleted = level.level < unlockedLevel;
                  
                  return (
                    <Button
                      key={level.level}
                      variant="outline"
                      className={`w-full justify-between py-4 transition-all ${
                        isLocked 
                          ? "opacity-50 cursor-not-allowed" 
                          : "hover:border-primary hover:bg-primary/10"
                      } ${isCompleted ? "border-green-500/30 bg-green-500/5" : ""}`}
                      onClick={() => !isLocked && startLevel(level.level)}
                      disabled={isLocked}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                          isLocked 
                            ? "bg-muted text-muted-foreground" 
                            : isCompleted 
                              ? "bg-green-500/20 text-green-500" 
                              : "bg-primary/20 text-primary"
                        }`}>
                          {isLocked ? <Lock className="h-4 w-4" /> : level.level}
                        </span>
                        <span className={isLocked ? "text-muted-foreground" : ""}>
                          {level.name}
                        </span>
                        {isCompleted && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <span>{level.symbolCount} symbols</span>
                        <span>•</span>
                        <span>{level.memorizeTime}s</span>
                        {isLocked ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </Button>
                  );
                })}
              </div>
              <p className="text-center text-xs text-muted-foreground mt-4">
                Complete 5 rounds to unlock the next level
              </p>
            </div>
          )}

          {/* Level & Round Progress */}
          {(gameState === "memorize" || gameState === "choose") && (
            <div className="mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Level {currentLevel}: {levelConfig.name}
                </span>
                <span className="text-primary font-medium">
                  Round {currentRound}/{ROUNDS_PER_LEVEL}
                </span>
              </div>
              <Progress value={(currentRound - 1) / ROUNDS_PER_LEVEL * 100} className="h-2" />
            </div>
          )}

          {/* Memorize Phase */}
          {gameState === "memorize" && (
            <div className="text-center space-y-6">
              <p className="text-muted-foreground">
                Memorize this sequence! Time left: <span className="text-primary font-bold">{countdown}s</span>
              </p>
              <div className="flex flex-wrap justify-center gap-3 py-8 px-4 bg-background/50 rounded-lg border border-primary/20">
                {sequence.map((symbol, index) => (
                  <span
                    key={index}
                    className="text-2xl md:text-3xl font-bold text-primary animate-pulse"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {symbol}
                  </span>
                ))}
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(countdown / levelConfig.memorizeTime) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Choose Phase */}
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
                    <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                      {choice.map((symbol, symbolIndex) => (
                        <span key={symbolIndex} className="font-mono text-base md:text-lg">
                          {symbol}
                        </span>
                      ))}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Round Result */}
          {gameState === "round-result" && (
            <div className="text-center space-y-6">
              {roundWon ? (
                <>
                  <div className="flex justify-center">
                    <div className="flex gap-1">
                      {Array.from({ length: currentRound }).map((_, i) => (
                        <Star key={i} className="h-8 w-8 text-yellow-500 fill-yellow-500" />
                      ))}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-primary">Correct!</h3>
                  <p className="text-muted-foreground">
                    Round {currentRound} of {ROUNDS_PER_LEVEL} complete
                  </p>
                </>
              ) : (
                <>
                  <div className="flex justify-center">
                    <X className="h-16 w-16 text-destructive" />
                  </div>
                  <h3 className="text-2xl font-bold text-destructive">Wrong!</h3>
                  <p className="text-muted-foreground">The correct sequence was:</p>
                  <div className="flex flex-wrap justify-center gap-3 py-4">
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
                  Exit
                </Button>
                <Button onClick={handleNextRound} className="bg-primary hover:bg-primary/90">
                  {roundWon ? "Next Round" : "Try Again"}
                </Button>
              </div>
            </div>
          )}

          {/* Level Complete */}
          {gameState === "level-complete" && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <Trophy className="h-16 w-16 text-yellow-500 animate-bounce" />
              </div>
              <h3 className="text-2xl font-bold text-primary">Level {currentLevel} Complete!</h3>
              <div className="flex justify-center gap-1">
                {Array.from({ length: ROUNDS_PER_LEVEL }).map((_, i) => (
                  <Star key={i} className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <p className="text-muted-foreground">
                Ready for Level {currentLevel + 1}: {LEVELS[currentLevel].name}?
              </p>
              <div className="flex gap-3 justify-center pt-4">
                <Button variant="outline" onClick={handleClose}>
                  Exit
                </Button>
                <Button onClick={handleNextLevel} className="bg-primary hover:bg-primary/90">
                  Next Level
                </Button>
              </div>
            </div>
          )}

          {/* Game Complete */}
          {gameState === "game-complete" && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <Trophy className="h-20 w-20 text-yellow-500 animate-bounce" />
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-primary bg-clip-text text-transparent">
                Master Complete!
              </h3>
              <p className="text-muted-foreground">
                You have completed all 7 levels with 35 rounds!
              </p>
              <div className="flex justify-center gap-1 flex-wrap">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className="text-xs text-muted-foreground mb-1">L{i + 1}</span>
                    <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 justify-center pt-4">
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
                <Button onClick={() => startLevel(1)} className="bg-primary hover:bg-primary/90">
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
