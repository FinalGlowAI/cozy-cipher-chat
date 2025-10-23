import { supabase } from "@/integrations/supabase/client";

export const useSessionTracking = () => {
  const checkActiveSession = async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("active_sessions" as any)
      .select("session_id")
      .eq("user_id", userId)
      .gt("last_active", new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Active within last 5 minutes

    if (error) {
      console.error("Error checking active sessions:", error);
      return false;
    }

    return data && data.length > 0;
  };

  const createSession = async (userId: string) => {
    const sessionId = crypto.randomUUID();
    
    const { error } = await supabase
      .from("active_sessions" as any)
      .insert({
        user_id: userId,
        session_id: sessionId,
      });

    if (error) {
      console.error("Error creating session:", error);
      return null;
    }

    return sessionId;
  };

  const updateSessionActivity = async (sessionId: string) => {
    const { error } = await supabase
      .from("active_sessions" as any)
      .update({ last_active: new Date().toISOString() })
      .eq("session_id", sessionId);

    if (error) {
      console.error("Error updating session:", error);
    }
  };

  const removeSession = async (sessionId: string) => {
    const { error } = await supabase
      .from("active_sessions" as any)
      .delete()
      .eq("session_id", sessionId);

    if (error) {
      console.error("Error removing session:", error);
    }
  };

  return {
    checkActiveSession,
    createSession,
    updateSessionActivity,
    removeSession,
  };
};
