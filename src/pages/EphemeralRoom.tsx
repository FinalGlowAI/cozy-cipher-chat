import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Send, Copy, Loader2, Lock, Unlock, GraduationCap, RefreshCw, Flag, UserX, MoreVertical, LogOut, Ban } from "lucide-react";
import { NeuralBackground } from "@/components/NeuralBackground";
import { EphemeralRoomTutorial } from "@/components/EphemeralRoomTutorial";
import { ReportDialog } from "@/components/ReportDialog";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import { filterContent } from "@/lib/contentFilter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const EPHEMERAL_TUTORIAL_STORAGE_KEY = "ocx_ephemeral_room_tutorial_seen";
import { notifyNewMessage } from "@/lib/notifications";

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

const MESSAGES_PER_PAGE = 50;

const EphemeralRoom = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [userColor, setUserColor] = useState("");
  const [activeUsers, setActiveUsers] = useState<{ id: string; color: string }[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ userId?: string; color?: string; messagePreview?: string } | null>(null);
  const [kickedUsers, setKickedUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isInitialLoad = useRef(true);
  
  const { blockedUsers, blockUser, isBlocked } = useBlockedUsers();

  // Check if tutorial should be shown on first visit
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem(EPHEMERAL_TUTORIAL_STORAGE_KEY);
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    localStorage.setItem(EPHEMERAL_TUTORIAL_STORAGE_KEY, "true");
  };

  const handleDontShowAgain = () => {
    localStorage.setItem(EPHEMERAL_TUTORIAL_STORAGE_KEY, "permanent");
  };

  useEffect(() => {
    checkRoomAndLoadMessages();
    
    // Assign random color to user
    const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
    setUserColor(color);

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        console.log("[EphemeralRoom] Cleaning up channel subscription");
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomCode]);

  useEffect(() => {
    if (!roomId || !userColor) return;

    // Cleanup previous channel if exists
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Subscribe to realtime messages, presence, and kick events
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
        async (payload) => {
          const newMsg = payload.new as Message;
          setMessages((current) => [...current, newMsg]);
          
          // Send local notification for new messages from others
          const { data: { user } } = await supabase.auth.getUser();
          if (user && newMsg.user_id !== user.id && document.hidden) {
            notifyNewMessage(roomCode || 'unknown');
          }
        }
      )
      .on(
        "broadcast",
        { event: "user_kicked" },
        async (payload) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user && payload.payload.kicked_user_id === user.id) {
            toast.error("You have been removed from this room by the creator.");
            navigate("/ephemeral");
          }
        }
      )
      .on("presence", { event: "sync" }, async () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat().map((presence: any) => ({
          id: presence.user_id,
          color: presence.color,
        }));
        setActiveUsers(users);
        
        // If no users left, clean up all messages
        if (users.length === 0 && roomId) {
          try {
            await supabase
              .from("ephemeral_messages")
              .delete()
              .eq("room_id", roomId);
            setMessages([]);
          } catch (error) {
            console.error("Error cleaning up messages:", error);
          }
        }
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
        } else if (status === "CHANNEL_ERROR") {
          console.error("[EphemeralRoom] Channel error, attempting reconnect...");
          // Exponential backoff reconnection
          setTimeout(() => {
            if (channelRef.current) {
              supabase.removeChannel(channelRef.current);
              channelRef.current = null;
            }
          }, 1000);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId, userColor, roomCode, navigate]);

  useEffect(() => {
    if (isInitialLoad.current && messages.length > 0) {
      scrollToBottom();
      isInitialLoad.current = false;
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMoreMessages = useCallback(async () => {
    if (!roomId || loadingMore || !hasMore || messages.length === 0) return;

    setLoadingMore(true);
    const oldestMessage = messages[0];
    
    try {
      const { data: olderMessages, error } = await supabase
        .from("ephemeral_messages")
        .select("*")
        .eq("room_id", roomId)
        .lt("created_at", oldestMessage.created_at)
        .order("created_at", { ascending: false })
        .limit(MESSAGES_PER_PAGE);

      if (error) throw error;

      if (olderMessages && olderMessages.length > 0) {
        // Preserve scroll position
        const container = messagesContainerRef.current;
        const previousScrollHeight = container?.scrollHeight || 0;
        
        setMessages((current) => [...olderMessages.reverse(), ...current]);
        
        // Restore scroll position after state update
        requestAnimationFrame(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - previousScrollHeight;
          }
        });

        setHasMore(olderMessages.length === MESSAGES_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
      toast.error("Failed to load older messages");
    } finally {
      setLoadingMore(false);
    }
  }, [roomId, loadingMore, hasMore, messages]);

  // Handle scroll for infinite scroll
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Load more when scrolled near the top
    if (container.scrollTop < 100 && hasMore && !loadingMore) {
      loadMoreMessages();
    }
  }, [hasMore, loadingMore, loadMoreMessages]);

  const checkRoomAndLoadMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        navigate("/auth");
        return;
      }

      // Use RPC function to look up room by code (bypasses restricted SELECT policy)
      const { data: roomData, error: roomError } = await supabase
        .rpc('get_room_by_code', { _room_code: roomCode });

      if (roomError || !roomData || roomData.length === 0) {
        toast.error("Room not found");
        navigate("/ephemeral");
        return;
      }

      const room = roomData[0];

      setRoomId(room.id);
      setIsLocked(room.is_locked);
      setIsCreator(room.created_by === user.id);
      setCurrentUserId(user.id);

      // Add user to room_participants (upsert to handle rejoin)
      const { error: participantError } = await supabase
        .from("room_participants")
        .upsert({
          room_id: room.id,
          user_id: user.id,
        }, { onConflict: 'room_id,user_id' });

      if (participantError) {
        console.error("Error joining room:", participantError);
        toast.error("Failed to join room");
        navigate("/ephemeral");
        return;
      }

      // Load initial messages (most recent MESSAGES_PER_PAGE)
      const { data: existingMessages, error: messagesError, count } = await supabase
        .from("ephemeral_messages")
        .select("*", { count: 'exact' })
        .eq("room_id", room.id)
        .order("created_at", { ascending: false })
        .limit(MESSAGES_PER_PAGE);

      if (!messagesError && existingMessages) {
        // Reverse to show oldest first
        setMessages(existingMessages.reverse());
        setHasMore(count ? count > MESSAGES_PER_PAGE : false);
      }
    } catch (error: any) {
      console.error("Error loading room:", error);
      toast.error("Failed to load room");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !roomId) return;

    // Client-side content filtering
    const filterResult = filterContent(newMessage);
    if (filterResult.isBlocked) {
      toast.error(filterResult.reason || "This message cannot be sent.");
      return;
    }
    if (filterResult.hasWarning) {
      toast.warning(filterResult.reason || "Please review your message.");
    }

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
      // Scroll to bottom on new message sent
      setTimeout(scrollToBottom, 100);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleReportUser = (message: Message) => {
    setReportTarget({
      userId: message.user_id,
      color: message.user_color,
      messagePreview: message.content,
    });
    setShowReportDialog(true);
  };

  const handleBlockUser = (message: Message) => {
    blockUser(message.user_id, message.user_color, roomCode);
    toast.success("User blocked. Their messages will be hidden.");
  };

  const handleKickUser = async (message: Message) => {
    if (!roomId || !isCreator) return;

    try {
      // Remove user from room_participants
      const { error } = await supabase
        .from("room_participants")
        .delete()
        .eq("room_id", roomId)
        .eq("user_id", message.user_id);

      if (error) throw error;

      // Broadcast kick event to notify the user in real-time
      if (channelRef.current) {
        await channelRef.current.send({
          type: "broadcast",
          event: "user_kicked",
          payload: { kicked_user_id: message.user_id },
        });
      }

      // Track kicked user locally to show indicator
      setKickedUsers((prev) => new Set(prev).add(message.user_id));

      toast.success("User has been removed from the room.");
    } catch (error) {
      console.error("Error kicking user:", error);
      toast.error("Failed to remove user from room.");
    }
  };

  // Filter out blocked users' messages
  const visibleMessages = messages.filter((msg) => !isBlocked(msg.user_id));

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode || "");
    toast.success("Room code copied!");
  };

  const toggleRoomLock = async () => {
    if (!roomId || !isCreator) return;

    try {
      const newLockState = !isLocked;
      const { error } = await supabase
        .from("ephemeral_rooms")
        .update({ is_locked: newLockState })
        .eq("id", roomId);

      if (error) throw error;

      setIsLocked(newLockState);
      toast.success(newLockState ? "Room locked - no new users can join" : "Room unlocked - anyone with the code can join");
    } catch (error) {
      console.error("Error toggling room lock:", error);
      toast.error("Failed to update room lock status");
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <NeuralBackground key="neural-bg" />
      {/* Header */}
      <div className="p-2 border-b border-border bg-card/50 backdrop-blur-xl relative z-10">
        {/* Room ID - Top Center */}
        <div className="flex justify-center items-center gap-1 mb-1">
          <span className="font-mono text-xs text-primary">{roomCode}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={copyRoomCode}
            title="Copy Room Code"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
        
        {/* Main Header Row */}
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/ephemeral")}
              title="Leave Room"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={checkRoomAndLoadMessages}
              title="Refresh Messages"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Active Users Indicator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {activeUsers.map((user, index) => (
                <div
                  key={user.id}
                  className="w-5 h-5 rounded-full border-2 border-background shadow-lg"
                  style={{ 
                    backgroundColor: user.color,
                    marginLeft: index > 0 ? '-4px' : '0',
                    zIndex: activeUsers.length - index
                  }}
                  title={`User ${index + 1}`}
                />
              ))}
            </div>
            {activeUsers.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {activeUsers.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {isLocked && (
              <div title="Room is locked">
                <Lock className="h-4 w-4 text-yellow-500" />
              </div>
            )}
            {isCreator && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleRoomLock}
                title={isLocked ? "Unlock room" : "Lock room"}
              >
                {isLocked ? (
                  <Unlock className="h-4 w-4 text-yellow-500" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowTutorial(true)}
              title="Show Tutorial"
            >
              <GraduationCap className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4"
        onScroll={handleScroll}
      >
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Load more indicator */}
          {loadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          
          {hasMore && !loadingMore && messages.length > 0 && (
            <div className="flex justify-center py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadMoreMessages}
                className="text-muted-foreground"
              >
                Load older messages
              </Button>
            </div>
          )}

          {visibleMessages.length === 0 ? (
            <div className="text-center text-muted-foreground mt-8">
              {messages.length > 0 && blockedUsers.length > 0
                ? "All messages are from blocked users."
                : "No messages yet. Start the conversation!"}
            </div>
          ) : (
            <TooltipProvider>
              {visibleMessages.map((message) => (
                <Card
                  key={message.id}
                  className="backdrop-blur-xl bg-card/50 border-primary/20 group"
                  style={{ borderLeftColor: message.user_color, borderLeftWidth: "4px" }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: message.user_color }}
                      />
                      <p className="text-foreground text-sm flex-1 break-words">{message.content}</p>
                      
                      {/* Kicked user indicator - only visible to creator */}
                      {isCreator && kickedUsers.has(message.user_id) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 border border-destructive/20 flex-shrink-0">
                              <Ban className="h-3 w-3 text-destructive" />
                              <span className="text-xs text-destructive font-medium">Removed</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>This user has been removed from the room</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      
                      {/* Report/Block menu - only show for other users' messages */}
                      {message.user_id !== currentUserId && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleReportUser(message)}>
                              <Flag className="h-4 w-4 mr-2 text-destructive" />
                              Report User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleBlockUser(message)}>
                              <UserX className="h-4 w-4 mr-2" />
                              Block User
                            </DropdownMenuItem>
                            {isCreator && (
                              <DropdownMenuItem 
                                onClick={() => handleKickUser(message)}
                                className="text-destructive focus:text-destructive"
                              >
                                <LogOut className="h-4 w-4 mr-2" />
                                Remove from Room
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TooltipProvider>
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

      {/* Tutorial Overlay */}
      <EphemeralRoomTutorial
        isVisible={showTutorial}
        onComplete={handleTutorialComplete}
        onDontShowAgain={handleDontShowAgain}
      />

      {/* Report Dialog */}
      <ReportDialog
        isOpen={showReportDialog}
        onClose={() => {
          setShowReportDialog(false);
          setReportTarget(null);
        }}
        reportedUserId={reportTarget?.userId}
        reportedUserColor={reportTarget?.color}
        roomCode={roomCode}
        messagePreview={reportTarget?.messagePreview}
      />
    </div>
  );
};

export default EphemeralRoom;
