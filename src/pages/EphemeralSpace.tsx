import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

const EphemeralSpace = () => {
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isPremium, loading: subscriptionLoading } = useSubscription();

  useEffect(() => {
    if (!subscriptionLoading && !isPremium) {
      toast.error("This feature is only available for premium users");
      navigate("/");
    }
  }, [isPremium, subscriptionLoading, navigate]);

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-8 left-8">
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
