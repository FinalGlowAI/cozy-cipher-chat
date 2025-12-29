import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Zap, Trophy, X, Star, Heart, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const SYMBOLS = ["△", "7", "⬡", "A", "●", "9", "◇", "B", "★", "3", "⬢", "Z", "◯", "5", "♦", "K", "⬟", "8", "◆", "M"];

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

const GAME_DURATION = 60; // seconds
const SPAWN_INTERVAL = 800; // ms
const FALL_SPEED = 2; // pixels per frame
const TARGET_SYMBOL_COUNT = 3;
const POINTS_PER_CORRECT = 10;
const POINTS_PENALTY = 5;
const WIN_SCORE = 150;

export const SymbolMatchGame = ({ open, onOpenChange, onWin }: SymbolMatchGameProps) => {
  const [gameState, setGameState] = useState<"menu" | "playing" | "result">("menu");
  const [targetSymbols, setTargetSymbols] = useState<string[]>([]);
  const [fallingSymbols, setFallingSymbols] = useState<FallingSymbol[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [combo, setCombo] = useState(0);
  const [won, setWon] = useState(false);
  
  const symbolIdRef = useRef(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const spawnIntervalRef = useRef<NodeJS.Timeout>();

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startGame = useCallback(() => {
    const shuffled = shuffleArray(SYMBOLS);
    setTargetSymbols(shuffled.slice(0, TARGET_SYMBOL_COUNT));
    setFallingSymbols([]);
    setScore(0);
    setLives(3);
    setTimeLeft(GAME_DURATION);
    setCombo(0);
    setWon(false);
    symbolIdRef.current = 0;
    setGameState("playing");
  }, []);

  const spawnSymbol = useCallback(() => {
    if (!gameAreaRef.current) return;
    
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
  }, [targetSymbols]);

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
    if (gameState !== "playing") return;

    const gameLoop = () => {
      setFallingSymbols(prev => {
        const areaHeight = gameAreaRef.current?.offsetHeight || 400;
        
        return prev
          .map(symbol => ({
            ...symbol,
            y: symbol.y + FALL_SPEED,
          }))
          .filter(symbol => {
            // Remove symbols that fell past the bottom
            if (symbol.y > areaHeight) {
              // Missed a target symbol - lose a life
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
  }, [gameState]);

  // Spawn symbols
  useEffect(() => {
    if (gameState !== "playing") return;

    spawnIntervalRef.current = setInterval(spawnSymbol, SPAWN_INTERVAL);
    
    return () => {
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current);
      }
    };
  }, [gameState, spawnSymbol]);

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
    if (gameState !== "playing") return;

    if (lives <= 0) {
      setWon(false);
      setGameState("result");
    } else if (score >= WIN_SCORE) {
      setWon(true);
      setGameState("result");
      onWin?.();
    }
  }, [lives, score, gameState, onWin]);

  const handleClose = () => {
    setGameState("menu");
    setFallingSymbols([]);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (spawnIntervalRef.current) {
      clearInterval(spawnIntervalRef.current);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-xl border-primary/30 max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Zap className="h-5 w-5 text-yellow-500" />
            Symbol Match
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Menu */}
          {gameState === "menu" && (
            <div className="space-y-6 text-center">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">How to Play</h3>
                <p className="text-sm text-muted-foreground">
                  Symbols will fall from the top. Tap only the symbols that match the target symbols shown at the bottom.
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center py-4">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-primary">{WIN_SCORE}</div>
                  <div className="text-xs text-muted-foreground">Points to Win</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-primary">{GAME_DURATION}s</div>
                  <div className="text-xs text-muted-foreground">Time Limit</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-red-500">3</div>
                  <div className="text-xs text-muted-foreground">Lives</div>
                </div>
              </div>

              <Button onClick={startGame} className="w-full bg-primary hover:bg-primary/90">
                <Zap className="h-4 w-4 mr-2" />
                Start Game
              </Button>
            </div>
          )}

          {/* Playing */}
          {gameState === "playing" && (
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
                  {score} / {WIN_SCORE}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {timeLeft}s
                </div>
              </div>
              
              <Progress value={(score / WIN_SCORE) * 100} className="h-2" />

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
          {gameState === "result" && (
            <div className="text-center space-y-6">
              {won ? (
                <>
                  <div className="flex justify-center">
                    <Trophy className="h-16 w-16 text-yellow-500 animate-bounce" />
                  </div>
                  <h3 className="text-2xl font-bold text-primary">You Win!</h3>
                  <p className="text-muted-foreground">
                    Final Score: <span className="text-primary font-bold">{score}</span>
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
                    Final Score: <span className="text-primary font-bold">{score}</span> / {WIN_SCORE}
                  </p>
                </>
              )}
              <div className="flex gap-3 justify-center pt-4">
                <Button variant="outline" onClick={handleClose}>
                  Exit
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
