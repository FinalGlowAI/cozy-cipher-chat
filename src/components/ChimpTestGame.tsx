import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, Trophy, X, Star, ChevronRight, Lock, Clock, Coins } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useCredits, LEVEL_CREDITS } from "@/hooks/useCredits";

const LEVELS = [
  { level: 1, count: 4, revealMs: 3000, name: "Beginner" },
  { level: 2, count: 5, revealMs: 2500, name: "Easy" },
  { level: 3, count: 6, revealMs: 2000, name: "Medium" },
  { level: 4, count: 7, revealMs: 1500, name: "Challenging" },
  { level: 5, count: 8, revealMs: 1200, name: "Hard" },
  { level: 6, count: 9, revealMs: 1000, name: "Expert" },
  { level: 7, count: 10, revealMs: 800, name: "Master" },
];

const GRID_COLS = 5;
const GRID_ROWS = 4;
const TOTAL_CELLS = GRID_COLS * GRID_ROWS;
const ROUNDS_PER_LEVEL = 5;
const STORAGE_KEY = "chimp-test-game-progress";
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

interface GameProgress {
  unlockedLevel: number;
  savedAt: number;
}

interface Tile {
  number: number;
  position: number;
}

const generateTiles = (count: number): Tile[] => {
  const positions = Array.from({ length: TOTAL_CELLS }, (_, i) => i);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  return Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    position: positions[i],
  }));
};

const getGameProgress = () => {
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

type GameState = "menu" | "reveal" | "input" | "round-result" | "level-complete" | "game-complete";

export const ChimpTestGame = ({ open, onOpenChange, onWin }: Props) => {
  const { earnCredits } = useCredits();
  const [gameState, setGameState] = useState<GameState>("menu");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [nextExpected, setNextExpected] = useState(1);
  const [revealed, setRevealed] = useState(true);
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
      if (progress.unlockedLevel !== unlockedLevel) setUnlockedLevel(progress.unlockedLevel);
    }, 60000);
    return () => clearInterval(interval);
  }, [timeRemaining, unlockedLevel]);

  const startRound = useCallback((level: number) => {
    const config = LEVELS[level - 1];
    const newTiles = generateTiles(config.count);
    setTiles(newTiles);
    setNextExpected(1);
    setRevealed(true);
    setRoundWon(false);
    setGameState("reveal");
    setTimeout(() => {
      setRevealed(false);
      setGameState("input");
    }, config.revealMs);
  }, []);

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
      const success = await earnCredits(currentLevel, `chimp_test_game_level_${currentLevel}`);
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

  const handleTileTap = (tile: Tile) => {
    if (gameState !== "input") return;
    if (tile.number !== nextExpected) {
      setRevealed(true);
      finishRound(false);
      return;
    }
    if (tile.number === tiles.length) {
      finishRound(true);
      return;
    }
    setNextExpected(nextExpected + 1);
    // hide the tapped tile by removing it from visible set (track via nextExpected)
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
    setGameState("menu");
    setCurrentLevel(1);
    setCurrentRound(1);
    setNextExpected(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-xl border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Eye className="h-5 w-5 text-primary" />
            Chimp Test
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {gameState === "menu" && (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground mb-4">
                Memorize the numbers, then tap them in order
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
                        <span>{level.count} numbers</span>
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

          {(gameState === "reveal" || gameState === "input") && (
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
                {gameState === "reveal"
                  ? "Memorize the positions..."
                  : `Tap in order — next: ${nextExpected}`}
              </p>

              <div
                className="grid gap-2 max-w-sm mx-auto"
                style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: TOTAL_CELLS }).map((_, position) => {
                  const tile = tiles.find((t) => t.position === position);
                  const isHidden = tile && !revealed && tile.number < nextExpected;
                  const showNumber = tile && revealed;
                  return (
                    <button
                      key={position}
                      type="button"
                      disabled={gameState !== "input" || !tile || tile.number < nextExpected}
                      onClick={() => tile && handleTileTap(tile)}
                      className={`aspect-square rounded-md flex items-center justify-center font-bold text-lg transition-all ${
                        !tile
                          ? "bg-transparent"
                          : isHidden
                          ? "bg-transparent"
                          : showNumber
                          ? "bg-primary/20 border-2 border-primary/40 text-primary"
                          : "bg-primary border-2 border-primary text-primary-foreground hover:scale-105 cursor-pointer"
                      }`}
                      aria-label={tile ? `Number ${tile.number}` : "empty"}
                    >
                      {showNumber ? tile!.number : ""}
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
                  <p className="text-muted-foreground">You missed the sequence.</p>
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
              <p className="text-muted-foreground">You're a Chimp Test Master!</p>
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
