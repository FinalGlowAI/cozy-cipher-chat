import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useFreeUser = () => {
  const [isFreeUser, setIsFreeUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFreeUserStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
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
          console.error('Error checking free user status:', error);
          setIsFreeUser(false);
        } else {
          setIsFreeUser(!!data);
        }
      } catch (error) {
        console.error('Error checking free user status:', error);
        setIsFreeUser(false);
      } finally {
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
