import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Hash, Trophy, X, Star, ChevronRight, Lock, Clock, Coins } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useCredits, LEVEL_CREDITS } from "@/hooks/useCredits";

const LEVELS = [
  { level: 1, digitCount: 3, flashTime: 1000, name: "Beginner" },
  { level: 2, digitCount: 4, flashTime: 900, name: "Easy" },
  { level: 3, digitCount: 5, flashTime: 800, name: "Medium" },
  { level: 4, digitCount: 6, flashTime: 700, name: "Challenging" },
  { level: 5, digitCount: 7, flashTime: 600, name: "Hard" },
  { level: 6, digitCount: 8, flashTime: 500, name: "Expert" },
  { level: 7, digitCount: 9, flashTime: 400, name: "Master" },
];

const ROUNDS_PER_LEVEL = 5;
const STORAGE_KEY = "flash-number-game-progress";
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

interface GameProgress {
  unlockedLevel: number;
  savedAt: number;
}

const generateSequence = (length: number): number[] => {
  const sequence: number[] = [];
  for (let i = 0; i < length; i++) {
    sequence.push(Math.floor(Math.random() * 10));
  }
  return sequence;
};

const getGameProgress = (): { unlockedLevel: number; timeRemaining: number } => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { unlockedLevel: 1, timeRemaining: 0 };
    
    const progress: GameProgress = JSON.parse(stored);
    const elapsed = Date.now() - progress.savedAt;
    
    if (elapsed >= TWENTY_FOUR_HOURS) {
      localStorage.removeItem(STORAGE_KEY);
      return { unlockedLevel: 1, timeRemaining: 0 };
    }
    
    const timeRemaining = TWENTY_FOUR_HOURS - elapsed;
    return { 
      unlockedLevel: Math.min(progress.unlockedLevel, 7), 
      timeRemaining 
    };
  } catch {
    return { unlockedLevel: 1, timeRemaining: 0 };
  }
};

const saveGameProgress = (level: number) => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    let savedAt = Date.now();
    
    if (existing) {
      const progress: GameProgress = JSON.parse(existing);
      savedAt = progress.savedAt;
    }
    
    const progress: GameProgress = { unlockedLevel: level, savedAt };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage errors
  }
};

const formatTimeRemaining = (ms: number): string => {
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  return `${hours}h ${minutes}m`;
};

interface FlashNumberGameProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWin?: () => void;
}

type GameState = "menu" | "flashing" | "input" | "round-result" | "level-complete" | "game-complete";

export const FlashNumberGame = ({ open, onOpenChange, onWin }: FlashNumberGameProps) => {
  const { earnCredits } = useCredits();
  const [gameState, setGameState] = useState<GameState>("menu");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sequence, setSequence] = useState<number[]>([]);
  const [currentFlashIndex, setCurrentFlashIndex] = useState(0);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [roundWon, setRoundWon] = useState(false);

  const levelConfig = LEVELS[currentLevel - 1];

  useEffect(() => {
    const progress = getGameProgress();
    setUnlockedLevel(progress.unlockedLevel);
    setTimeRemaining(progress.timeRemaining);
  }, []);

  useEffect(() => {
    if (timeRemaining <= 0) return;
    
    const interval = setInterval(() => {
      const progress = getGameProgress();
      setTimeRemaining(progress.timeRemaining);
      if (progress.unlockedLevel !== unlockedLevel) {
        setUnlockedLevel(progress.unlockedLevel);
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [timeRemaining, unlockedLevel]);

  // Flash sequence effect
  useEffect(() => {
    if (gameState !== "flashing") return;
    
    if (currentFlashIndex < sequence.length) {
      const timer = setTimeout(() => {
        setCurrentFlashIndex(currentFlashIndex + 1);
      }, levelConfig.flashTime);
      return () => clearTimeout(timer);
    } else {
      // Wait a moment after last flash before showing input
      const timer = setTimeout(() => {
        setGameState("input");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [gameState, currentFlashIndex, sequence.length, levelConfig.flashTime]);

  const startRound = useCallback(() => {
    const config = LEVELS[currentLevel - 1];
    const newSequence = generateSequence(config.digitCount);
    setSequence(newSequence);
    setCurrentFlashIndex(0);
    setUserInput([]);
    setGameState("flashing");
    setRoundWon(false);
  }, [currentLevel]);

  const startLevel = useCallback((level: number) => {
    setCurrentLevel(level);
    setCurrentRound(1);
    const config = LEVELS[level - 1];
    const newSequence = generateSequence(config.digitCount);
    setSequence(newSequence);
    setCurrentFlashIndex(0);
    setUserInput([]);
    setGameState("flashing");
    setRoundWon(false);
  }, []);

  const handleNumberPress = async (num: number) => {
    const newInput = [...userInput, num];
    setUserInput(newInput);

    // Check if user has entered enough digits
    if (newInput.length === sequence.length) {
      const isCorrect = newInput.every((digit, index) => digit === sequence[index]);
      setRoundWon(isCorrect);

      if (isCorrect) {
        if (currentRound >= ROUNDS_PER_LEVEL) {
          if (currentLevel < 7 && currentLevel >= unlockedLevel) {
            const newUnlockedLevel = currentLevel + 1;
            setUnlockedLevel(newUnlockedLevel);
            saveGameProgress(newUnlockedLevel);
            toast.success(`Level ${currentLevel + 1} unlocked!`);
          }
          
          const creditsAwarded = LEVEL_CREDITS[currentLevel] || 5;
          const success = await earnCredits(currentLevel, `flash_number_game_level_${currentLevel}`);
          if (success) {
            toast.success(`+${creditsAwarded} Credits Earned!`, {
              icon: "🪙",
            });
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
    }
  };

  const handleNextRound = () => {
    if (roundWon) {
      setCurrentRound(currentRound + 1);
    }
    startRound();
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
    setUserInput([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-xl border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Hash className="h-5 w-5 text-primary" />
            Flash Number
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Level Selection Menu */}
          {gameState === "menu" && (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground mb-4">
                Remember the flashing numbers in order!
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
                        <span>{level.digitCount} digits</span>
                        <span>•</span>
                        <span>{level.flashTime}ms</span>
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
              {timeRemaining > 0 && (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-2 py-2 px-3 bg-muted/30 rounded-lg">
                  <Clock className="h-3 w-3" />
                  <span>Progress resets in {formatTimeRemaining(timeRemaining)}</span>
                </div>
              )}
            </div>
          )}

          {/* Level & Round Progress */}
          {(gameState === "flashing" || gameState === "input") && (
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

          {/* Flashing Phase */}
          {gameState === "flashing" && (
            <div className="text-center space-y-6">
              <p className="text-muted-foreground">
                Watch the numbers carefully!
              </p>
              <div className="flex items-center justify-center py-12">
                <div className="w-24 h-24 flex items-center justify-center rounded-2xl bg-primary/20 border-2 border-primary">
                  {currentFlashIndex < sequence.length && (
                    <span className="text-5xl font-bold text-primary animate-pulse">
                      {sequence[currentFlashIndex]}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-center gap-1">
                {sequence.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index < currentFlashIndex ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Input Phase */}
          {gameState === "input" && (
            <div className="space-y-6">
              <p className="text-center text-muted-foreground">
                Enter the numbers in order ({userInput.length}/{sequence.length})
              </p>
              
              {/* User input display */}
              <div className="flex justify-center gap-2 py-4">
                {sequence.map((_, index) => (
                  <div
                    key={index}
                    className={`w-10 h-12 flex items-center justify-center rounded-lg border-2 transition-all ${
                      index < userInput.length
                        ? "border-primary bg-primary/20"
                        : "border-muted bg-muted/20"
                    }`}
                  >
                    <span className="text-xl font-bold text-primary">
                      {userInput[index] !== undefined ? userInput[index] : ""}
                    </span>
                  </div>
                ))}
              </div>

              {/* Number pad */}
              <div className="grid grid-cols-5 gap-2 max-w-xs mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                  <Button
                    key={num}
                    variant="outline"
                    className="h-12 text-xl font-bold hover:bg-primary/20 hover:border-primary transition-all"
                    onClick={() => handleNumberPress(num)}
                    disabled={userInput.length >= sequence.length}
                  >
                    {num}
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
                  <div className="flex justify-center gap-3 py-4">
                    {sequence.map((digit, index) => (
                      <span key={index} className="text-2xl font-bold text-primary">
                        {digit}
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
              <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/30 w-fit mx-auto">
                <Coins className="h-5 w-5 text-yellow-500" />
                <span className="font-bold text-yellow-500">+{LEVEL_CREDITS[currentLevel] || 5} Credits</span>
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
              <h3 className="text-2xl font-bold text-primary">Congratulations!</h3>
              <p className="text-muted-foreground">
                You've mastered all 7 levels of Flash Number!
              </p>
              <div className="flex justify-center gap-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Star key={i} className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/30 w-fit mx-auto">
                <Coins className="h-5 w-5 text-yellow-500" />
                <span className="font-bold text-yellow-500">+{LEVEL_CREDITS[7] || 50} Credits</span>
              </div>
              <Button onClick={handleClose} className="mt-4">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};