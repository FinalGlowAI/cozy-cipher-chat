import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Palette, Trophy, X, Star, ChevronRight, Lock, Clock, Coins } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useCredits, LEVEL_CREDITS } from "@/hooks/useCredits";

const COLORS = [
  { id: 0, name: "Red Circle", className: "bg-red-500", active: "bg-red-300", shape: "rounded-full" },
  { id: 1, name: "Blue Square", className: "bg-blue-500", active: "bg-blue-300", shape: "rounded-md" },
  { id: 2, name: "Green Diamond", className: "bg-green-500", active: "bg-green-300", shape: "rounded-md rotate-45" },
  { id: 3, name: "Yellow Triangle", className: "bg-yellow-500", active: "bg-yellow-300", shape: "[clip-path:polygon(50%_0%,0%_100%,100%_100%)]" },
];

const LEVELS = [
  { level: 1, length: 3, flashMs: 700, name: "Beginner" },
  { level: 2, length: 4, flashMs: 650, name: "Easy" },
  { level: 3, length: 5, flashMs: 600, name: "Medium" },
  { level: 4, length: 6, flashMs: 550, name: "Challenging" },
  { level: 5, length: 7, flashMs: 500, name: "Hard" },
  { level: 6, length: 8, flashMs: 450, name: "Expert" },
  { level: 7, length: 9, flashMs: 400, name: "Master" },
];

const ROUNDS_PER_LEVEL = 5;
const STORAGE_KEY = "color-sequence-game-progress";
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

interface GameProgress {
  unlockedLevel: number;
  savedAt: number;
}

const generateSequence = (length: number): number[] =>
  Array.from({ length }, () => Math.floor(Math.random() * COLORS.length));

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
    return {
      unlockedLevel: Math.min(progress.unlockedLevel, 7),
      timeRemaining: TWENTY_FOUR_HOURS - elapsed,
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ unlockedLevel: level, savedAt }));
  } catch {
    // ignore
  }
};

const formatTimeRemaining = (ms: number): string => {
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  return `${hours}h ${minutes}m`;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWin?: () => void;
}

type GameState = "menu" | "watch" | "input" | "round-result" | "level-complete" | "game-complete";

export const ColorSequenceGame = ({ open, onOpenChange, onWin }: Props) => {
  const { earnCredits } = useCredits();
  const [gameState, setGameState] = useState<GameState>("menu");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [roundWon, setRoundWon] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

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
      if (progress.unlockedLevel !== unlockedLevel) setUnlockedLevel(progress.unlockedLevel);
    }, 60000);
    return () => clearInterval(interval);
  }, [timeRemaining, unlockedLevel]);

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const playSequence = useCallback((seq: number[], flashMs: number) => {
    clearTimeouts();
    setActiveIndex(null);
    seq.forEach((colorId, i) => {
      timeoutsRef.current.push(
        setTimeout(() => setActiveIndex(colorId), i * flashMs + 300)
      );
      timeoutsRef.current.push(
        setTimeout(() => setActiveIndex(null), i * flashMs + 300 + flashMs * 0.6)
      );
    });
    timeoutsRef.current.push(
      setTimeout(() => {
        setActiveIndex(null);
        setGameState("input");
      }, seq.length * flashMs + 400)
    );
  }, []);

  const startRound = useCallback(() => {
    const config = LEVELS[currentLevel - 1];
    const newSequence = generateSequence(config.length);
    setSequence(newSequence);
    setUserInput([]);
    setRoundWon(false);
    setGameState("watch");
    playSequence(newSequence, config.flashMs);
  }, [currentLevel, playSequence]);

  const startLevel = useCallback((level: number) => {
    setCurrentLevel(level);
    setCurrentRound(1);
    const config = LEVELS[level - 1];
    const newSequence = generateSequence(config.length);
    setSequence(newSequence);
    setUserInput([]);
    setRoundWon(false);
    setGameState("watch");
    playSequence(newSequence, config.flashMs);
  }, [playSequence]);

  const finishRound = async (won: boolean) => {
    setRoundWon(won);
    if (won && currentRound >= ROUNDS_PER_LEVEL) {
      if (currentLevel < 7 && currentLevel >= unlockedLevel) {
        const newUnlockedLevel = currentLevel + 1;
        setUnlockedLevel(newUnlockedLevel);
        saveGameProgress(newUnlockedLevel);
        toast.success(`Level ${currentLevel + 1} unlocked!`);
      }
      const creditsAwarded = LEVEL_CREDITS[currentLevel] || 5;
      const success = await earnCredits(currentLevel, `color_sequence_game_level_${currentLevel}`);
      if (success) {
        toast.success(`+${creditsAwarded} Credits Earned!`, { icon: "🪙" });
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
  };

  const handleColorTap = (colorId: number) => {
    if (gameState !== "input") return;
    const nextInput = [...userInput, colorId];
    setActiveIndex(colorId);
    setTimeout(() => setActiveIndex(null), 200);

    const expected = sequence[nextInput.length - 1];
    if (colorId !== expected) {
      setUserInput(nextInput);
      finishRound(false);
      return;
    }

    setUserInput(nextInput);
    if (nextInput.length === sequence.length) {
      finishRound(true);
    }
  };

  const handleNextRound = () => {
    if (roundWon) setCurrentRound(currentRound + 1);
    startRound();
  };

  const handleNextLevel = () => {
    setCurrentLevel(currentLevel + 1);
    setCurrentRound(1);
    setTimeout(() => startLevel(currentLevel + 1), 0);
  };

  const handleClose = () => {
    clearTimeouts();
    setGameState("menu");
    setCurrentLevel(1);
    setCurrentRound(1);
    setUserInput([]);
    onOpenChange(false);
  };

  useEffect(() => () => clearTimeouts(), []);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-xl border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Palette className="h-5 w-5 text-primary" />
            Color Sequence
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {gameState === "menu" && (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground mb-4">
                Watch the color pattern, then repeat it
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
                        isLocked ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:bg-primary/10"
                      } ${isCompleted ? "border-green-500/30 bg-green-500/5" : ""}`}
                      onClick={() => !isLocked && startLevel(level.level)}
                      disabled={isLocked}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                          isLocked ? "bg-muted text-muted-foreground"
                            : isCompleted ? "bg-green-500/20 text-green-500"
                            : "bg-primary/20 text-primary"
                        }`}>
                          {isLocked ? <Lock className="h-4 w-4" /> : level.level}
                        </span>
                        <span className={isLocked ? "text-muted-foreground" : ""}>{level.name}</span>
                        {isCompleted && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <span>{level.length} colors</span>
                        {isLocked ? <Lock className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
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

          {(gameState === "watch" || gameState === "input") && (
            <div className="space-y-4">
              <div className="space-y-2">
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

              <p className="text-center text-muted-foreground">
                {gameState === "watch"
                  ? "Watch the sequence..."
                  : `Repeat the sequence (${userInput.length}/${sequence.length})`}
              </p>

              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                {COLORS.map((color) => {
                  const isActive = activeIndex === color.id;
                  return (
                    <button
                      key={color.id}
                      type="button"
                      disabled={gameState !== "input"}
                      onClick={() => handleColorTap(color.id)}
                      className={`aspect-square flex items-center justify-center transition-all duration-150 ${
                        gameState === "input" ? "hover:scale-105 cursor-pointer" : "cursor-default"
                      }`}
                      aria-label={color.name}
                    >
                      <span
                        className={`w-3/4 h-3/4 border-2 border-white/10 transition-all duration-150 ${color.shape} ${
                          isActive ? `${color.active} scale-95 shadow-lg` : color.className
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
                  <div className="flex flex-wrap justify-center gap-2 py-4">
                    {sequence.map((id, i) => (
                      <span
                        key={i}
                        className={`w-8 h-8 rounded-md ${COLORS[id].className} border border-white/10`}
                      />
                    ))}
                  </div>
                </>
              )}
              <div className="flex gap-3 justify-center pt-4">
                <Button variant="outline" onClick={handleClose}>Exit</Button>
                <Button onClick={handleNextRound} className="bg-primary hover:bg-primary/90">
                  {roundWon ? "Next Round" : "Try Again"}
                </Button>
              </div>
            </div>
          )}

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
                <Button variant="outline" onClick={handleClose}>Exit</Button>
                <Button onClick={handleNextLevel} className="bg-primary hover:bg-primary/90">
                  Next Level
                </Button>
              </div>
            </div>
          )}

          {gameState === "game-complete" && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <Trophy className="h-20 w-20 text-yellow-500 animate-bounce" />
              </div>
              <h3 className="text-3xl font-bold text-primary">All Levels Complete!</h3>
              <p className="text-muted-foreground">You're a Color Sequence Master!</p>
              <Button onClick={handleClose} className="bg-primary hover:bg-primary/90">
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
