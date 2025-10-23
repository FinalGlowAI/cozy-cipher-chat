import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useFreeUser = () => {
  const [isFreeUser, setIsFreeUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFreeUserStatus = async () => {
      console.log('[useFreeUser] Starting free user check...');
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('[useFreeUser] User:', user?.id, user?.email);
        
        if (!user?.email) {
          console.log('[useFreeUser] No user or email found');
          setIsFreeUser(false);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('free_users')
          .select('features')
          .eq('email', user.email.toLowerCase())
          .maybeSingle();

        if (error) {
          console.error('[useFreeUser] Error checking free user status:', error);
          setIsFreeUser(false);
        } else {
          console.log('[useFreeUser] Free user status:', !!data);
          setIsFreeUser(!!data);
        }
      } catch (error) {
        console.error('[useFreeUser] Exception:', error);
        setIsFreeUser(false);
      } finally {
        console.log('[useFreeUser] Check complete');
        setLoading(false);
      }
    };

    checkFreeUserStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkFreeUserStatus();
      } else {
        setIsFreeUser(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isFreeUser, loading };
};
