import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSubscription = () => {
  const [isPremium, setIsPremium] = useState(false);
  const [isFreeUser, setIsFreeUser] = useState(false);
  const [isBasicUser, setIsBasicUser] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkSubscription = useCallback(async () => {
    try {
      // ✅ Fix #2 : getUser() vérifie côté serveur
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsPremium(false);
        setIsFreeUser(false);
        setIsBasicUser(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) {
        console.error('Error checking subscription:', error);
        setIsPremium(false);
        setIsFreeUser(false);
        setIsBasicUser(false);
      } else {
        setIsPremium(data?.subscribed || false);
        setIsFreeUser(data?.is_free_user || false);
        setIsBasicUser(data?.is_basic_user || false);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsPremium(false);
      setIsFreeUser(false);
      setIsBasicUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSubscription();

    // ✅ Fix #1 : écoute les changements auth au lieu de polling
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkSubscription();
      }
      if (event === 'SIGNED_OUT') {
        setIsPremium(false);
        setIsFreeUser(false);
        setIsBasicUser(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkSubscription]);

  return { 
    isPremium, 
    isFreeUser, 
    isBasicUser, 
    loading, 
    refreshSubscription: checkSubscription 
  };
};
