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
        .select("*")
        .eq("user_id", user.id)
        .eq("usage_date", today)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching daily usage:", error);
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      if (data) {
        setState({
          textEncryptions: data.text_encryptions,
          textDecryptions: data.text_decryptions,
          loading: false,
        });
      } else {
        setState({
          textEncryptions: 0,
          textDecryptions: 0,
          loading: false,
        });
      }
    } catch (error) {
      console.error("Error in fetchUsage:", error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const incrementUsage = useCallback(async (feature: "text_encryption" | "text_decryption"): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const today = new Date().toISOString().split("T")[0];

      // Try to get existing record
      const { data: existing, error: fetchError } = await supabase
        .from("daily_usage")
        .select("*")
        .eq("user_id", user.id)
        .eq("usage_date", today)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error fetching usage:", fetchError);
        return false;
      }

      if (existing) {
        // Update existing record
        const updateData = feature === "text_encryption"
          ? { text_encryptions: existing.text_encryptions + 1 }
          : { text_decryptions: existing.text_decryptions + 1 };

        const { error: updateError } = await supabase
          .from("daily_usage")
          .update(updateData)
          .eq("id", existing.id);

        if (updateError) {
          console.error("Error updating usage:", updateError);
          return false;
        }

        setState(prev => ({
          ...prev,
          textEncryptions: feature === "text_encryption" ? prev.textEncryptions + 1 : prev.textEncryptions,
          textDecryptions: feature === "text_decryption" ? prev.textDecryptions + 1 : prev.textDecryptions,
        }));
      } else {
        // Create new record
        const insertData = {
          user_id: user.id,
          usage_date: today,
          text_encryptions: feature === "text_encryption" ? 1 : 0,
          text_decryptions: feature === "text_decryption" ? 1 : 0,
        };

        const { error: insertError } = await supabase
          .from("daily_usage")
          .insert(insertData);

        if (insertError) {
          console.error("Error inserting usage:", insertError);
          return false;
        }

        setState(prev => ({
          ...prev,
          textEncryptions: feature === "text_encryption" ? 1 : prev.textEncryptions,
          textDecryptions: feature === "text_decryption" ? 1 : prev.textDecryptions,
        }));
      }

      return true;
    } catch (error) {
      console.error("Error in incrementUsage:", error);
      return false;
    }
  }, []);

  const getRemainingFreeUses = useCallback((feature: "text_encryption" | "text_decryption"): number => {
    const used = feature === "text_encryption" ? state.textEncryptions : state.textDecryptions;
    return Math.max(0, FREE_LIMIT - used);
  }, [state.textEncryptions, state.textDecryptions]);

  const isWithinFreeLimit = useCallback((feature: "text_encryption" | "text_decryption"): boolean => {
    const used = feature === "text_encryption" ? state.textEncryptions : state.textDecryptions;
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
