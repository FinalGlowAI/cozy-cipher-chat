import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Info, Coins, Lock, GraduationCap } from "lucide-react";
import { NeuralBackground } from "@/components/NeuralBackground";
import { useCredits } from "@/hooks/useCredits";
import { FeatureGateModal } from "@/components/FeatureGateModal";
import { GameSelector } from "@/components/GameSelector";
import { EphemeralSpaceTutorial } from "@/components/EphemeralSpaceTutorial";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ROOM_CREATION_COST = 10;
const EPHEMERAL_SPACE_TUTORIAL_KEY = "ocx_ephemeral_space_tutorial_seen";

const EphemeralSpace = () => {
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGateModal, setShowGateModal] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const navigate = useNavigate();
  const { credits, spendCredits, checkCanAfford, refetch } = useCredits();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please log in to access Ephemeral Rooms");
        navigate("/auth");
      }
    };
    
    checkAuth();
  }, [navigate]);

  // Show tutorial on first visit
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem(EPHEMERAL_SPACE_TUTORIAL_KEY);
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    localStorage.setItem(EPHEMERAL_SPACE_TUTORIAL_KEY, "true");
  };

  const handleDontShowAgain = () => {
    localStorage.setItem(EPHEMERAL_SPACE_TUTORIAL_KEY, "permanent");
  };

  const createNewRoom = async () => {
    // Check if user can afford room creation
    if (!checkCanAfford(ROOM_CREATION_COST)) {
      setShowGateModal(true);
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to create a room");
        navigate("/auth");
        return;
      }

      // Spend credits first
      const success = await spendCredits(ROOM_CREATION_COST, "ephemeral_room_creation");
      if (!success) {
        toast.error("Failed to process credits");
        setLoading(false);
        return;
      }

      // Generate unique room code
      let code = "";
      let isUnique = false;
      
      while (!isUnique) {
        code = await generateRoomCode();
        const { data: existing } = await supabase
          .from("ephemeral_rooms")
          .select("id")
          .eq("room_code", code)
          .single();
        
        if (!existing) isUnique = true;
      }

      const { data, error } = await supabase
        .from("ephemeral_rooms")
        .insert({
          room_code: code,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as first participant
      const { error: participantError } = await supabase
        .from("room_participants")
        .insert({
          room_id: data.id,
          user_id: user.id,
        });

      if (participantError) {
        console.error("Error adding participant:", participantError);
      }

      toast.success(`Room created! ${ROOM_CREATION_COST} credits used.`);
      navigate(`/room/${code}`);
    } catch (error: any) {
      console.error("Error creating room:", error);
      toast.error(error.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  const generateRoomCode = async (): Promise<string> => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let randomPart = "";
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `ER-${randomPart}`;
  };

  // Normalize room code input (handles both with and without ER- prefix)
  const normalizeRoomCode = (code: string): string => {
    const upper = code.toUpperCase().trim();
    if (upper.startsWith('ER-')) {
      return upper;
    }
    return `ER-${upper}`;
  };

  const joinRoom = async () => {
    if (!roomCode.trim()) {
      toast.error("Please enter a room code");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to join a room");
        navigate("/auth");
        return;
      }

      const normalizedCode = normalizeRoomCode(roomCode);

      // Use RPC function to look up room by code (bypasses restricted SELECT policy)
      const { data: roomData, error } = await supabase
        .rpc('get_room_by_code', { _room_code: normalizedCode });

      if (error || !roomData || roomData.length === 0) {
        toast.error("Room not found");
        return;
      }

      const room = roomData[0];

      // Check if room is locked
      if (room.is_locked) {
        // Check if user is already a participant
        const { data: participant } = await supabase
          .from("room_participants")
          .select("id")
          .eq("room_id", room.id)
          .eq("user_id", user.id)
          .single();

        if (!participant) {
          toast.error("This room is locked by the creator", {
            icon: <Lock className="h-4 w-4" />,
            description: "No new users can join this room.",
          });
          return;
        }
      }

      navigate(`/room/${normalizedCode}`);
    } catch (error: any) {
      console.error("Error joining room:", error);
      toast.error("Failed to join room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <NeuralBackground key="neural-bg" />
      <div className="absolute top-8 left-8 z-10">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </div>

      <Card className="w-full max-w-md backdrop-blur-xl bg-card/50 border-primary/20 shadow-glow-primary">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            Create or Join an Ephemeral Room
          </CardTitle>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1.5"
              onClick={() => setShowTutorial(true)}
              title="Show Tutorial"
            >
              <GraduationCap className="h-4 w-4" />
              <span className="text-sm">Tutorial</span>
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Info className="h-4 w-4" />
                  <span className="text-sm">How it Works</span>
                </Button>
              </DialogTrigger>
            <DialogContent className="backdrop-blur-xl bg-card/95 border-primary/20">
              <DialogHeader>
                <DialogTitle>How Ephemeral Rooms Work</DialogTitle>
                <DialogDescription className="space-y-3 text-left pt-4">
                  <p>
                    <strong>🔒 Temporary & Secure:</strong> Ephemeral rooms are temporary chat spaces with end-to-end encryption. All messages are automatically deleted when the last user leaves.
                  </p>
                  <p>
                    <strong>📝 Create a Room:</strong> Click "Create New Room" to generate a unique room code. Share this code with people you want to chat with securely.
                  </p>
                  <p>
                    <strong>🚪 Join a Room:</strong> Enter a room code or paste a room link to join an existing conversation. You'll see who's active in real-time.
                  </p>
                  <p>
                    <strong>🗑️ Complete Privacy:</strong> When everyone leaves the room, all messages are permanently erased. No history, no traces—perfect for sensitive conversations.
                  </p>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Credit Cost Notice */}
          <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <Coins className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-yellow-500 font-medium">
              Creating a room costs {ROOM_CREATION_COST} credits
            </span>
          </div>

          <Button
            onClick={createNewRoom}
            disabled={loading}
            className="w-full shadow-glow-primary"
            size="lg"
          >
            {loading ? "Creating..." : `Create New Room (${ROOM_CREATION_COST} credits)`}
          </Button>

          <div className="text-center text-muted-foreground text-sm">
            OR JOIN AN EPHEMERAL ROOM (FREE)
          </div>

          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Paste room link or ID"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && joinRoom()}
              className="bg-background/50 border-primary/30 focus:border-primary"
            />
            <Button
              onClick={joinRoom}
              disabled={loading || !roomCode.trim()}
            >
              Join
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feature Gate Modal */}
      <FeatureGateModal
        open={showGateModal}
        onOpenChange={setShowGateModal}
        featureName="Ephemeral Room Creation"
        creditCost={ROOM_CREATION_COST}
        currentCredits={credits}
        onPlayGames={() => setGameOpen(true)}
      />

      {/* Game Selector */}
      <GameSelector 
        open={gameOpen} 
        onOpenChange={(open) => {
          setGameOpen(open);
          // Refetch credits when game modal closes
          if (!open) {
            refetch();
          }
        }}
        onWin={() => {
          refetch();
        }}
      />

      {/* Tutorial Overlay */}
      <EphemeralSpaceTutorial 
        isVisible={showTutorial} 
        onComplete={handleTutorialComplete}
        onDontShowAgain={handleDontShowAgain}
      />
    </div>
  );
};

export default EphemeralSpace;
