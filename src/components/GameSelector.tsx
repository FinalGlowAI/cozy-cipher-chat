import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Brain, Zap, Hash, Palette } from "lucide-react";
import { MemoryGame } from "./MemoryGame";
import { SymbolMatchGame } from "./SymbolMatchGame";
import { FlashNumberGame } from "./FlashNumberGame";
import { ColorSequenceGame } from "./ColorSequenceGame";
import ocxLogo from "@/assets/ocx-logo.png";

interface GameSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWin?: () => void;
}

type SelectedGame = "none" | "memory" | "symbol-match" | "flash-number" | "color-sequence";

export const GameSelector = ({ open, onOpenChange, onWin }: GameSelectorProps) => {
  const [selectedGame, setSelectedGame] = useState<SelectedGame>("none");

  const handleClose = () => {
    setSelectedGame("none");
    onOpenChange(false);
  };

  const handleGameClose = (gameOpen: boolean) => {
    if (!gameOpen) {
      setSelectedGame("none");
    }
  };

  if (selectedGame === "memory") {
    return (
      <MemoryGame
        open={true}
        onOpenChange={(isOpen) => {
          handleGameClose(isOpen);
          if (!isOpen) onOpenChange(false);
        }}
        onWin={onWin}
      />
    );
  }

  if (selectedGame === "symbol-match") {
    return (
      <SymbolMatchGame
        open={true}
        onOpenChange={(isOpen) => {
          handleGameClose(isOpen);
          if (!isOpen) onOpenChange(false);
        }}
        onWin={onWin}
      />
    );
  }

  if (selectedGame === "flash-number") {
    return (
      <FlashNumberGame
        open={true}
        onOpenChange={(isOpen) => {
          handleGameClose(isOpen);
          if (!isOpen) onOpenChange(false);
        }}
        onWin={onWin}
      />
    );
  }

  if (selectedGame === "color-sequence") {
    return (
      <ColorSequenceGame
        open={true}
        onOpenChange={(isOpen) => {
          handleGameClose(isOpen);
          if (!isOpen) onOpenChange(false);
        }}
        onWin={onWin}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <img src={ocxLogo} alt="OCODX Logo" className="h-8 w-8 object-contain" />
            Daily Challenge Games
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Choose a game to play and earn credits!
          </p>

          <div className="grid gap-3">
            <Button
              variant="outline"
              className="w-full h-auto py-4 justify-start hover:border-primary hover:bg-primary/10 transition-all"
              onClick={() => setSelectedGame("memory")}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20">
                  <Brain className="h-6 w-6 text-blue-500" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Memory Challenge</h3>
                  <p className="text-xs text-muted-foreground">
                    Memorize symbol sequences across 7 levels
                  </p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-auto py-4 justify-start hover:border-primary hover:bg-primary/10 transition-all"
              onClick={() => setSelectedGame("symbol-match")}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/20">
                  <Zap className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Symbol Match</h3>
                  <p className="text-xs text-muted-foreground">
                    Tap matching symbols as they fall
                  </p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-auto py-4 justify-start hover:border-primary hover:bg-primary/10 transition-all"
              onClick={() => setSelectedGame("flash-number")}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20">
                  <Hash className="h-6 w-6 text-green-500" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Flash Number</h3>
                  <p className="text-xs text-muted-foreground">
                    Remember flashing number sequences
                  </p>
                </div>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
