import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      console.log('[useAdmin] Starting admin check...');
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('[useAdmin] User:', user?.id);
        
        if (!user) {
          console.log('[useAdmin] No user found');
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (error) {
          console.error('[useAdmin] Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          console.log('[useAdmin] Admin status:', !!data);
          setIsAdmin(!!data);
        }
      } catch (error) {
        console.error('[useAdmin] Exception:', error);
        setIsAdmin(false);
      } finally {
        console.log('[useAdmin] Check complete');
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  return { isAdmin, loading };
};
