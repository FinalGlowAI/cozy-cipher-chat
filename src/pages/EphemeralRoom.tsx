import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Send, Copy } from "lucide-react";

interface Message {
  id: string;
  content: string;
  user_color: string;
  created_at: string;
  user_id: string;
}

const USER_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
  "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B739", "#52B788"
];

const EphemeralRoom = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [userColor, setUserColor] = useState("");
  const [activeUsers, setActiveUsers] = useState<{ id: string; color: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkRoomAndLoadMessages();
    
    // Assign random color to user
    const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
    setUserColor(color);
  }, [roomCode]);

  useEffect(() => {
    if (!roomId) return;

    // Subscribe to realtime messages and presence
    const channel = supabase
      .channel(`room_${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ephemeral_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message]);
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat().map((presence: any) => ({
          id: presence.user_id,
          color: presence.color,
        }));
        setActiveUsers(users);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        console.log("User joined:", newPresences);
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        console.log("User left:", leftPresences);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await channel.track({
              user_id: user.id,
              color: userColor,
              online_at: new Date().toISOString(),
            });
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, userColor]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkRoomAndLoadMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        navigate("/auth");
        return;
      }

      const { data: room, error: roomError } = await supabase
        .from("ephemeral_rooms")
        .select("*")
        .eq("room_code", roomCode)
        .single();

      if (roomError || !room) {
        toast.error("Room not found");
        navigate("/ephemeral");
        return;
      }

      setRoomId(room.id);

      // Load existing messages
      const { data: existingMessages, error: messagesError } = await supabase
        .from("ephemeral_messages")
        .select("*")
        .eq("room_id", room.id)
        .order("created_at", { ascending: true });

      if (!messagesError && existingMessages) {
        setMessages(existingMessages);
      }
    } catch (error: any) {
      console.error("Error loading room:", error);
      toast.error("Failed to load room");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !roomId) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const { error } = await supabase.from("ephemeral_messages").insert({
        room_id: roomId,
        user_id: user.id,
        content: newMessage.trim(),
        user_color: userColor,
      });

      if (error) throw error;

      setNewMessage("");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode || "");
    toast.success("Room code copied!");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/ephemeral")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Leave Room
          </Button>
          
          {/* Active Users Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {activeUsers.map((user, index) => (
                <div
                  key={user.id}
                  className="w-8 h-8 rounded-full border-2 border-background shadow-lg"
                  style={{ 
                    backgroundColor: user.color,
                    marginLeft: index > 0 ? '-8px' : '0',
                    zIndex: activeUsers.length - index
                  }}
                  title={`User ${index + 1}`}
                />
              ))}
            </div>
            {activeUsers.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {activeUsers.length} {activeUsers.length === 1 ? 'user' : 'users'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-lg text-primary">{roomCode}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyRoomCode}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground mt-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => (
              <Card
                key={message.id}
                className="backdrop-blur-xl bg-card/50 border-primary/20"
                style={{ borderLeftColor: message.user_color, borderLeftWidth: "4px" }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: message.user_color }}
                    />
                    <p className="text-foreground text-sm flex-1 break-words">{message.content}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card/50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type your message..."
            className="bg-background/50 border-primary/30 focus:border-primary resize-none"
            rows={2}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !newMessage.trim()}
            className="shadow-glow-primary"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EphemeralRoom;
