import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Route, Trophy, X, Star, ChevronRight, Lock, Clock, Coins } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useCredits, LEVEL_CREDITS } from "@/hooks/useCredits";

const LEVELS = [
  { level: 1, grid: 4, length: 4, stepMs: 600, name: "Beginner" },
  { level: 2, grid: 4, length: 5, stepMs: 550, name: "Easy" },
  { level: 3, grid: 5, length: 6, stepMs: 500, name: "Medium" },
  { level: 4, grid: 5, length: 7, stepMs: 450, name: "Challenging" },
  { level: 5, grid: 5, length: 8, stepMs: 400, name: "Hard" },
  { level: 6, grid: 6, length: 9, stepMs: 350, name: "Expert" },
  { level: 7, grid: 6, length: 10, stepMs: 300, name: "Master" },
];

const ROUNDS_PER_LEVEL = 5;
export const STORAGE_KEY = "path-tracer-game-progress";
export const STORAGE_RESET_MS = 24 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS = STORAGE_RESET_MS;

interface GameProgress {
  unlockedLevel: number;
  savedAt: number;
}

// Generate a connected path of `length` cells on a `grid x grid` board.
const generatePath = (grid: number, length: number): number[] => {
  const total = grid * grid;
  const maxAttempts = 50;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const start = Math.floor(Math.random() * total);
    const path = [start];
    const visited = new Set(path);
    let current = start;
    let stuck = false;
    while (path.length < length) {
      const row = Math.floor(current / grid);
      const col = current % grid;
      const neighbors: number[] = [];
      if (row > 0) neighbors.push(current - grid);
      if (row < grid - 1) neighbors.push(current + grid);
      if (col > 0) neighbors.push(current - 1);
      if (col < grid - 1) neighbors.push(current + 1);
      const available = neighbors.filter((n) => !visited.has(n));
      if (available.length === 0) {
        stuck = true;
        break;
      }
      const next = available[Math.floor(Math.random() * available.length)];
      path.push(next);
      visited.add(next);
      current = next;
    }
    if (!stuck) return path;
  }
  // Fallback: simple horizontal line
  return Array.from({ length }, (_, i) => i % total);
};

export const getGameProgress = () => {
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

export const PathTracerGame = ({ open, onOpenChange, onWin }: Props) => {
  const { earnCredits } = useCredits();
  const [gameState, setGameState] = useState<GameState>("menu");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [path, setPath] = useState<number[]>([]);
  const [userIndex, setUserIndex] = useState(0);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [tappedCells, setTappedCells] = useState<Set<number>>(new Set());
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

  const playPath = useCallback((p: number[], stepMs: number) => {
    clearTimeouts();
    setHighlightIndex(-1);
    p.forEach((_, i) => {
      timeoutsRef.current.push(
        setTimeout(() => setHighlightIndex(i), i * stepMs + 300)
      );
    });
    timeoutsRef.current.push(
      setTimeout(() => {
        setHighlightIndex(-1);
        setGameState("input");
      }, p.length * stepMs + 600)
    );
  }, []);

  const startRound = useCallback((level: number) => {
    const config = LEVELS[level - 1];
    const newPath = generatePath(config.grid, config.length);
    setPath(newPath);
    setUserIndex(0);
    setTappedCells(new Set());
    setRoundWon(false);
    setGameState("watch");
    playPath(newPath, config.stepMs);
  }, [playPath]);

  const startLevel = useCallback((level: number) => {
    setCurrentLevel(level);
    setCurrentRound(1);
    startRound(level);
  }, [startRound]);

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
      const success = await earnCredits(currentLevel, `path_tracer_game_level_${currentLevel}`);
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

  const handleCellTap = (cell: number) => {
    if (gameState !== "input") return;
    const expected = path[userIndex];
    if (cell !== expected) {
      finishRound(false);
      return;
    }
    const nextTapped = new Set(tappedCells);
    nextTapped.add(userIndex); // store by step index since path may revisit (but our generator doesn't revisit)
    setTappedCells(nextTapped);
    const nextIndex = userIndex + 1;
    setUserIndex(nextIndex);
    if (nextIndex >= path.length) {
      finishRound(true);
    }
  };

  const handleNextRound = () => {
    if (roundWon) setCurrentRound(currentRound + 1);
    startRound(currentLevel);
  };

  const handleNextLevel = () => {
    const next = currentLevel + 1;
    setCurrentLevel(next);
    setCurrentRound(1);
    setTimeout(() => startLevel(next), 0);
  };

  const handleClose = () => {
    clearTimeouts();
    setGameState("menu");
    setCurrentLevel(1);
    setCurrentRound(1);
    setUserIndex(0);
    setTappedCells(new Set());
    onOpenChange(false);
  };

  useEffect(() => () => clearTimeouts(), []);

  const gridSize = levelConfig.grid;
  const totalCells = gridSize * gridSize;
  // Map cell index -> step index in path (first occurrence)
  const pathStepByCell = new Map<number, number>();
  path.forEach((c, i) => {
    if (!pathStepByCell.has(c)) pathStepByCell.set(c, i);
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-xl border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Route className="h-5 w-5 text-primary" />
            Path Tracer
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {gameState === "menu" && (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground mb-4">
                Watch the glowing path, then retrace it
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
                        <span>{level.grid}×{level.grid} · {level.length} steps</span>
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
                  ? "Watch the glowing path..."
                  : `Retrace the path (${userIndex}/${path.length})`}
              </p>

              <div
                className="grid gap-2 max-w-sm mx-auto"
                style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: totalCells }).map((_, cell) => {
                  const stepIndex = pathStepByCell.get(cell);
                  const isLitNow = gameState === "watch" && stepIndex !== undefined && stepIndex === highlightIndex;
                  const wasLit = gameState === "watch" && stepIndex !== undefined && highlightIndex >= 0 && stepIndex < highlightIndex;
                  const isTapped = gameState === "input" && stepIndex !== undefined && stepIndex < userIndex;
                  return (
                    <button
                      key={cell}
                      type="button"
                      disabled={gameState !== "input"}
                      onClick={() => handleCellTap(cell)}
                      className={`aspect-square rounded-md border-2 transition-all duration-150 ${
                        isLitNow
                          ? "bg-primary border-primary scale-95 shadow-[0_0_20px_hsl(var(--primary))]"
                          : wasLit
                          ? "bg-primary/30 border-primary/40"
                          : isTapped
                          ? "bg-primary/40 border-primary/60"
                          : "bg-muted/40 border-border hover:border-primary/40"
                      } ${gameState === "input" ? "cursor-pointer hover:scale-105" : ""}`}
                      aria-label={`Cell ${cell}`}
                    />
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
                  <h3 className="text-2xl font-bold text-destructive">Wrong path!</h3>
                  <p className="text-muted-foreground">Try to focus on the order.</p>
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
              <p className="text-muted-foreground">You're a Path Tracer Master!</p>
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
