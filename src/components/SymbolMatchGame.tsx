import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Zap, Trophy, X, Star, Heart, Clock, Lock, ChevronLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const SYMBOLS = ["△", "7", "⬡", "A", "●", "9", "◇", "B", "★", "3", "⬢", "Z", "◯", "5", "♦", "K", "⬟", "8", "◆", "M"];

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

interface GameProgress {
  unlockedLevel: number;
  savedAt: number;
}

interface DifficultyLevel {
  level: number;
  name: string;
  targetCount: number;
  spawnInterval: number;
  fallSpeed: number;
  winScore: number;
  gameDuration: number;
}

const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  { level: 1, name: "Novice", targetCount: 2, spawnInterval: 1000, fallSpeed: 1.5, winScore: 80, gameDuration: 45 },
  { level: 2, name: "Beginner", targetCount: 2, spawnInterval: 900, fallSpeed: 1.8, winScore: 100, gameDuration: 50 },
  { level: 3, name: "Intermediate", targetCount: 3, spawnInterval: 850, fallSpeed: 2, winScore: 120, gameDuration: 55 },
  { level: 4, name: "Advanced", targetCount: 3, spawnInterval: 800, fallSpeed: 2.2, winScore: 140, gameDuration: 55 },
  { level: 5, name: "Expert", targetCount: 4, spawnInterval: 750, fallSpeed: 2.5, winScore: 160, gameDuration: 60 },
  { level: 6, name: "Master", targetCount: 4, spawnInterval: 700, fallSpeed: 2.8, winScore: 180, gameDuration: 60 },
  { level: 7, name: "Legend", targetCount: 5, spawnInterval: 650, fallSpeed: 3, winScore: 200, gameDuration: 65 },
];

const ROUNDS_PER_LEVEL = 5;

interface FallingSymbol {
  id: number;
  symbol: string;
  x: number;
  y: number;
  isTarget: boolean;
}

interface SymbolMatchGameProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWin?: () => void;
}

const POINTS_PER_CORRECT = 10;
const POINTS_PENALTY = 5;

const getGameProgress = (): GameProgress => {
  try {
    const saved = localStorage.getItem("symbolMatchProgress");
    if (saved) {
      const progress: GameProgress = JSON.parse(saved);
      const now = Date.now();
      if (now - progress.savedAt >= TWENTY_FOUR_HOURS) {
        const newProgress: GameProgress = { unlockedLevel: 1, savedAt: now };
        localStorage.setItem("symbolMatchProgress", JSON.stringify(newProgress));
        return newProgress;
      }
      return progress;
    }
  } catch (e) {
    console.error("Error loading symbol match progress:", e);
  }
  const newProgress: GameProgress = { unlockedLevel: 1, savedAt: Date.now() };
  localStorage.setItem("symbolMatchProgress", JSON.stringify(newProgress));
  return newProgress;
};

const saveGameProgress = (unlockedLevel: number) => {
  try {
    const existing = localStorage.getItem("symbolMatchProgress");
    let savedAt = Date.now();
    if (existing) {
      const parsed: GameProgress = JSON.parse(existing);
      if (Date.now() - parsed.savedAt < TWENTY_FOUR_HOURS) {
        savedAt = parsed.savedAt;
      }
    }
    const progress: GameProgress = { unlockedLevel, savedAt };
    localStorage.setItem("symbolMatchProgress", JSON.stringify(progress));
  } catch (e) {
    console.error("Error saving symbol match progress:", e);
  }
};

const formatTimeRemaining = (ms: number): string => {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

export const SymbolMatchGame = ({ open, onOpenChange, onWin }: SymbolMatchGameProps) => {
  const [gameState, setGameState] = useState<"menu" | "playing" | "result">("menu");
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [targetSymbols, setTargetSymbols] = useState<string[]>([]);
  const [fallingSymbols, setFallingSymbols] = useState<FallingSymbol[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(60);
  const [combo, setCombo] = useState(0);
  const [won, setWon] = useState(false);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState("");
  
  const symbolIdRef = useRef(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const spawnIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const progress = getGameProgress();
    setUnlockedLevel(progress.unlockedLevel);
    const remaining = TWENTY_FOUR_HOURS - (Date.now() - progress.savedAt);
    setTimeRemaining(formatTimeRemaining(Math.max(0, remaining)));
  }, [open]);

  useEffect(() => {
    const interval = setInterval(() => {
      const progress = getGameProgress();
      const remaining = TWENTY_FOUR_HOURS - (Date.now() - progress.savedAt);
      setTimeRemaining(formatTimeRemaining(Math.max(0, remaining)));
      if (remaining <= 0) {
        setUnlockedLevel(1);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startGame = useCallback((level: DifficultyLevel) => {
    const shuffled = shuffleArray(SYMBOLS);
    setTargetSymbols(shuffled.slice(0, level.targetCount));
    setFallingSymbols([]);
    setScore(0);
    setLives(3);
    setTimeLeft(level.gameDuration);
    setCombo(0);
    setWon(false);
    symbolIdRef.current = 0;
    setSelectedLevel(level);
    setGameState("playing");
  }, []);

  const handleLevelSelect = (level: DifficultyLevel) => {
    if (level.level > unlockedLevel) {
      toast.error("Complete previous levels first!");
      return;
    }
    setCurrentRound(1);
    startGame(level);
  };

  const spawnSymbol = useCallback(() => {
    if (!gameAreaRef.current || !selectedLevel) return;
    
    const areaWidth = gameAreaRef.current.offsetWidth - 40;
    const x = Math.random() * areaWidth + 20;
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const isTarget = targetSymbols.includes(symbol);
    
    const newSymbol: FallingSymbol = {
      id: symbolIdRef.current++,
      symbol,
      x,
      y: -40,
      isTarget,
    };
    
    setFallingSymbols(prev => [...prev, newSymbol]);
  }, [targetSymbols, selectedLevel]);

  const handleSymbolClick = useCallback((clickedSymbol: FallingSymbol) => {
    if (gameState !== "playing") return;
    
    setFallingSymbols(prev => prev.filter(s => s.id !== clickedSymbol.id));
    
    if (clickedSymbol.isTarget) {
      const comboBonus = Math.floor(combo / 3);
      const points = POINTS_PER_CORRECT + comboBonus;
      setScore(prev => prev + points);
      setCombo(prev => prev + 1);
      if (combo > 0 && combo % 5 === 0) {
        toast.success(`${combo} Combo! +${comboBonus} bonus`);
      }
    } else {
      setScore(prev => Math.max(0, prev - POINTS_PENALTY));
      setCombo(0);
      setLives(prev => prev - 1);
    }
  }, [gameState, combo]);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing" || !selectedLevel) return;

    const gameLoop = () => {
      setFallingSymbols(prev => {
        const areaHeight = gameAreaRef.current?.offsetHeight || 400;
        
        return prev
          .map(symbol => ({
            ...symbol,
            y: symbol.y + selectedLevel.fallSpeed,
          }))
          .filter(symbol => {
            if (symbol.y > areaHeight) {
              if (symbol.isTarget) {
                setLives(l => l - 1);
                setCombo(0);
              }
              return false;
            }
            return true;
          });
      });
      
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, selectedLevel]);

  // Spawn symbols
  useEffect(() => {
    if (gameState !== "playing" || !selectedLevel) return;

    spawnIntervalRef.current = setInterval(spawnSymbol, selectedLevel.spawnInterval);
    
    return () => {
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current);
      }
    };
  }, [gameState, spawnSymbol, selectedLevel]);

  // Timer
  useEffect(() => {
    if (gameState !== "playing") return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState("result");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // Check win/lose conditions
  useEffect(() => {
    if (gameState !== "playing" || !selectedLevel) return;

    if (lives <= 0) {
      setWon(false);
      setGameState("result");
    } else if (score >= selectedLevel.winScore) {
      setWon(true);
      setGameState("result");
      
      if (currentRound >= ROUNDS_PER_LEVEL) {
        if (selectedLevel.level >= unlockedLevel && selectedLevel.level < DIFFICULTY_LEVELS.length) {
          const newUnlockedLevel = selectedLevel.level + 1;
          setUnlockedLevel(newUnlockedLevel);
          saveGameProgress(newUnlockedLevel);
          toast.success(`Level ${selectedLevel.level + 1} unlocked!`);
        }
        onWin?.();
      }
    }
  }, [lives, score, gameState, selectedLevel, currentRound, unlockedLevel, onWin]);

  const handleNextRound = () => {
    if (!selectedLevel) return;
    if (currentRound < ROUNDS_PER_LEVEL) {
      setCurrentRound(prev => prev + 1);
      startGame(selectedLevel);
    } else {
      setGameState("menu");
      setSelectedLevel(null);
    }
  };

  const handleClose = () => {
    setGameState("menu");
    setSelectedLevel(null);
    setFallingSymbols([]);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (spawnIntervalRef.current) {
      clearInterval(spawnIntervalRef.current);
    }
    onOpenChange(false);
  };

  const handleBackToMenu = () => {
    setGameState("menu");
    setSelectedLevel(null);
    setFallingSymbols([]);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (spawnIntervalRef.current) {
      clearInterval(spawnIntervalRef.current);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-xl border-primary/30 max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Zap className="h-5 w-5 text-yellow-500" />
            Symbol Match
            {selectedLevel && gameState === "playing" && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                Level {selectedLevel.level} - Round {currentRound}/{ROUNDS_PER_LEVEL}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Menu */}
          {gameState === "menu" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Daily Challenge</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Resets in {timeRemaining}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Select Difficulty</h3>
                <div className="grid gap-2">
                  {DIFFICULTY_LEVELS.map((level) => {
                    const isLocked = level.level > unlockedLevel;
                    return (
                      <button
                        key={level.level}
                        onClick={() => handleLevelSelect(level)}
                        disabled={isLocked}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                          isLocked
                            ? "bg-muted/30 border-border/50 opacity-60 cursor-not-allowed"
                            : "bg-primary/10 border-primary/30 hover:bg-primary/20 hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            isLocked ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
                          }`}>
                            {isLocked ? <Lock className="h-4 w-4" /> : level.level}
                          </div>
                          <div className="text-left">
                            <div className={`font-medium ${isLocked ? "text-muted-foreground" : ""}`}>
                              {level.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {level.targetCount} targets • {level.winScore} pts to win
                            </div>
                          </div>
                        </div>
                        {!isLocked && (
                          <Zap className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="text-xs text-muted-foreground text-center pt-2">
                Complete {ROUNDS_PER_LEVEL} rounds to unlock the next level
              </div>
            </div>
          )}

          {/* Playing */}
          {gameState === "playing" && selectedLevel && (
            <div className="space-y-3">
              {/* Stats Bar */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Heart
                      key={i}
                      className={`h-5 w-5 ${i < lives ? "text-red-500 fill-red-500" : "text-muted-foreground"}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Star className="h-4 w-4" />
                  {score} / {selectedLevel.winScore}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {timeLeft}s
                </div>
              </div>
              
              <Progress value={(score / selectedLevel.winScore) * 100} className="h-2" />

              {/* Combo indicator */}
              {combo >= 3 && (
                <div className="text-center text-sm font-bold text-yellow-500 animate-pulse">
                  🔥 {combo}x Combo!
                </div>
              )}

              {/* Game Area */}
              <div
                ref={gameAreaRef}
                className="relative h-64 bg-background/50 rounded-lg border border-primary/20 overflow-hidden"
              >
                {fallingSymbols.map(symbol => (
                  <button
                    key={symbol.id}
                    onClick={() => handleSymbolClick(symbol)}
                    className={`absolute w-10 h-10 flex items-center justify-center text-xl font-bold rounded-full transition-transform hover:scale-110 active:scale-95 ${
                      symbol.isTarget
                        ? "bg-primary/20 text-primary border-2 border-primary"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                    style={{
                      left: symbol.x,
                      top: symbol.y,
                      transform: "translateX(-50%)",
                    }}
                  >
                    {symbol.symbol}
                  </button>
                ))}
              </div>

              {/* Target Symbols */}
              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground">Match these symbols:</p>
                <div className="flex justify-center gap-3">
                  {targetSymbols.map((symbol, index) => (
                    <div
                      key={index}
                      className="w-12 h-12 flex items-center justify-center text-2xl font-bold bg-primary/20 text-primary rounded-lg border-2 border-primary"
                    >
                      {symbol}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Result */}
          {gameState === "result" && selectedLevel && (
            <div className="text-center space-y-6">
              {won ? (
                <>
                  <div className="flex justify-center">
                    <Trophy className="h-16 w-16 text-yellow-500 animate-bounce" />
                  </div>
                  <h3 className="text-2xl font-bold text-primary">
                    Round {currentRound} Complete!
                  </h3>
                  <p className="text-muted-foreground">
                    Score: <span className="text-primary font-bold">{score}</span>
                    {currentRound < ROUNDS_PER_LEVEL && (
                      <span className="block text-sm mt-1">
                        {ROUNDS_PER_LEVEL - currentRound} rounds remaining
                      </span>
                    )}
                    {currentRound >= ROUNDS_PER_LEVEL && (
                      <span className="block text-sm mt-1 text-primary">
                        Level Complete! 🎉
                      </span>
                    )}
                  </p>
                </>
              ) : (
                <>
                  <div className="flex justify-center">
                    <X className="h-16 w-16 text-destructive" />
                  </div>
                  <h3 className="text-2xl font-bold text-destructive">
                    {lives <= 0 ? "Out of Lives!" : "Time's Up!"}
                  </h3>
                  <p className="text-muted-foreground">
                    Score: <span className="text-primary font-bold">{score}</span> / {selectedLevel.winScore}
                  </p>
                </>
              )}
              <div className="flex gap-3 justify-center pt-4">
                <Button variant="outline" onClick={handleBackToMenu}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Menu
                </Button>
                {won && currentRound < ROUNDS_PER_LEVEL ? (
                  <Button onClick={handleNextRound} className="bg-primary hover:bg-primary/90">
                    Next Round
                  </Button>
                ) : (
                  <Button onClick={() => startGame(selectedLevel)} className="bg-primary hover:bg-primary/90">
                    {won ? "Play Again" : "Try Again"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
