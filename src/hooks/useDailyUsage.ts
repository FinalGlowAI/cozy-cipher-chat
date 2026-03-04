import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DailyUsageState {
  textEncryptions: number;
  textDecryptions: number;
  loading: boolean;
}

const FREE_LIMIT = 5;

export const useDailyUsage = () => {
  const [state, setState] = useState<DailyUsageState>({
    textEncryptions: 0,
    textDecryptions: 0,
    loading: true,
  });

  const fetchUsage = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("daily_usage")
        .select("text_encryptions, text_decryptions") // ✅ Fix #2 : select explicite
        .eq("user_id", user.id)
        .eq("usage_date", today)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching daily usage:", error);
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      setState({
        textEncryptions: data?.text_encryptions ?? 0,
        textDecryptions: data?.text_decryptions ?? 0,
        loading: false,
      });
    } catch (error) {
      console.error("Error in fetchUsage:", error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const incrementUsage = useCallback(async (
    feature: "text_encryption" | "text_decryption"
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // ✅ Fix #1 : RPC atomique, pas de race condition
      const { error } = await supabase.rpc("increment_daily_usage", {
        p_user_id: user.id,
        p_feature: feature,
        p_date: new Date().toISOString().split("T")[0],
      });

      if (error) {
        console.error("Error incrementing usage:", error);
        return false;
      }

      setState(prev => ({
        ...prev,
        textEncryptions: feature === "text_encryption"
          ? prev.textEncryptions + 1
          : prev.textEncryptions,
        textDecryptions: feature === "text_decryption"
          ? prev.textDecryptions + 1
          : prev.textDecryptions,
      }));

      return true;
    } catch (error) {
      console.error("Error in incrementUsage:", error);
      return false;
    }
  }, []);

  const getRemainingFreeUses = useCallback((
    feature: "text_encryption" | "text_decryption"
  ): number => {
    const used = feature === "text_encryption"
      ? state.textEncryptions
      : state.textDecryptions;
    return Math.max(0, FREE_LIMIT - used);
  }, [state.textEncryptions, state.textDecryptions]);

  const isWithinFreeLimit = useCallback((
    feature: "text_encryption" | "text_decryption"
  ): boolean => {
    const used = feature === "text_encryption"
      ? state.textEncryptions
      : state.textDecryptions;
    return used < FREE_LIMIT;
  }, [state.textEncryptions, state.textDecryptions]);

  return {
    textEncryptions: state.textEncryptions,
    textDecryptions: state.textDecryptions,
    loading: state.loading,
    incrementUsage,
    getRemainingFreeUses,
    isWithinFreeLimit,
    refetch: fetchUsage,
    FREE_LIMIT,
  };
};
