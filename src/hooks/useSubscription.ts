import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSubscription = () => {
  const [isPremium, setIsPremium] = useState(false);
  const [isFreeUser, setIsFreeUser] = useState(false);
  const [isBasicUser, setIsBasicUser] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
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
  };

  useEffect(() => {
    checkSubscription();

    // Check subscription every 60 seconds
    const interval = setInterval(checkSubscription, 60000);

    return () => clearInterval(interval);
  }, []);

  return { isPremium, isFreeUser, isBasicUser, loading, refreshSubscription: checkSubscription };
};
