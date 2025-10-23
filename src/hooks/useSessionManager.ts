import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useSessionManager = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let currentSessionId: string | null = null;

    const registerSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      currentSessionId = session.access_token;

      // Clear all other sessions for this user
      const { error: deleteError } = await supabase
        .from('active_sessions')
        .delete()
        .eq('user_id', session.user.id);

      if (deleteError) {
        console.error('Error clearing old sessions:', deleteError);
      }

      // Register this session
      const { error: insertError } = await supabase
        .from('active_sessions')
        .insert({
          user_id: session.user.id,
          session_id: currentSessionId,
        });

      if (insertError) {
        console.error('Error registering session:', insertError);
      }
    };

    registerSession();

    // Listen for session deletions (when user logs in elsewhere)
    const channel = supabase
      .channel('session-changes')
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'active_sessions',
        },
        async (payload) => {
          // Check if our session was deleted
          if (payload.old.session_id === currentSessionId) {
            toast.error('You have been logged in from another device');
            await supabase.auth.signOut();
            navigate('/auth');
          }
        }
      )
      .subscribe();

    // Handle auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          currentSessionId = session.access_token;
          await registerSession();
        } else if (event === 'SIGNED_OUT') {
          // Clean up session on logout
          if (currentSessionId) {
            await supabase
              .from('active_sessions')
              .delete()
              .eq('session_id', currentSessionId);
          }
          currentSessionId = null;
        }
      }
    );

    return () => {
      supabase.removeChannel(channel);
      subscription.unsubscribe();
    };
  }, [navigate]);
};
