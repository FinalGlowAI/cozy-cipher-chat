import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Info } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { NeuralBackground } from "@/components/NeuralBackground";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const EphemeralSpace = () => {
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isPremium, isFreeUser, loading: subscriptionLoading } = useSubscription();

  useEffect(() => {
    if (!subscriptionLoading && !isPremium && !isFreeUser) {
      toast.error("This feature is only available for premium users");
      navigate("/");
    }
  }, [isPremium, isFreeUser, subscriptionLoading, navigate]);

  const createNewRoom = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to create a room");
        navigate("/auth");
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

      toast.success("Room created successfully!");
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
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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

      const { data: room, error } = await supabase
        .from("ephemeral_rooms")
        .select("*")
        .eq("room_code", roomCode.toUpperCase())
        .single();

      if (error || !room) {
        toast.error("Room not found");
        return;
      }

      navigate(`/room/${roomCode.toUpperCase()}`);
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
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="mt-2">
                <Info className="mr-2 h-4 w-4" />
                How it Works
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
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            onClick={createNewRoom}
            disabled={loading}
            className="w-full shadow-glow-primary"
            size="lg"
          >
            {loading ? "Creating..." : "Create New Room"}
          </Button>

          <div className="text-center text-muted-foreground text-sm">
            OR JOIN AN EPHEMERAL ROOM
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
    </div>
  );
};

export default EphemeralSpace;
