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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkRoomAndLoadMessages();
    
    // Assign random color to user
    const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
    setUserColor(color);
  }, [roomCode]);

  useEffect(() => {
    if (!roomId) return;

    // Subscribe to realtime messages
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/ephemeral")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Leave Room
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-white font-mono text-lg">{roomCode}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyRoomCode}
              className="text-white hover:bg-white/10"
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
            <div className="text-center text-slate-400 mt-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => (
              <Card
                key={message.id}
                className="bg-slate-800/30 border-slate-700 backdrop-blur-sm"
                style={{ borderLeftColor: message.user_color, borderLeftWidth: "4px" }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: message.user_color }}
                    />
                    <p className="text-white text-sm flex-1 break-words">{message.content}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-700 bg-slate-800/50 backdrop-blur-sm">
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
            className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 resize-none"
            rows={2}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !newMessage.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white"
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
