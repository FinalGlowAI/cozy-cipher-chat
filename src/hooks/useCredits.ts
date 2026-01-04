import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { emitCreditsChanged, onCreditsChanged } from "@/lib/creditsBus";

interface CreditState {
  totalCredits: number;
  lifetimeEarned: number;
  loading: boolean;
}

// Credit rewards per level
const LEVEL_CREDITS: Record<number, number> = {
  1: 5,
  2: 10,
  3: 15,
  4: 20,
  5: 25,
  6: 30,
  7: 50,
};

export const useCredits = () => {
  const [state, setState] = useState<CreditState>({
    totalCredits: 0,
    lifetimeEarned: 0,
    loading: true,
  });

  const fetchCredits = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      const { data, error } = await supabase
        .from("user_credits")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching credits:", error);
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      if (data) {
        setState({
          totalCredits: data.total_credits,
          lifetimeEarned: data.lifetime_earned,
          loading: false,
        });
      } else {
        // Create initial credits record
        const { data: newData, error: insertError } = await supabase
          .from("user_credits")
          .insert({ user_id: user.id, total_credits: 0, lifetime_earned: 0 })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating credits record:", insertError);
        }

        setState({
          totalCredits: newData?.total_credits ?? 0,
          lifetimeEarned: newData?.lifetime_earned ?? 0,
          loading: false,
        });
      }
    } catch (error) {
      console.error("Error in fetchCredits:", error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchCredits();

    // In-app sync between multiple useCredits() instances
    const unsubscribe = onCreditsChanged(() => {
      fetchCredits();
    });

    // Set up realtime subscription
    const channel = supabase
      .channel("user_credits_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_credits",
        },
        () => {
          fetchCredits();
        }
      )
      .subscribe();

    return () => {
      unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [fetchCredits]);

  const earnCredits = useCallback(async (level: number, source: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const amount = LEVEL_CREDITS[level] || 5;

      // Get current credits
      const { data: currentData, error: fetchError } = await supabase
        .from("user_credits")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error fetching current credits:", fetchError);
        return false;
      }

      const currentTotal = currentData?.total_credits ?? 0;
      const currentLifetime = currentData?.lifetime_earned ?? 0;

      if (currentData) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("user_credits")
          .update({
            total_credits: currentTotal + amount,
            lifetime_earned: currentLifetime + amount,
          })
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Error updating credits:", updateError);
          return false;
        }
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from("user_credits")
          .insert({
            user_id: user.id,
            total_credits: amount,
            lifetime_earned: amount,
          });

        if (insertError) {
          console.error("Error inserting credits:", insertError);
          return false;
        }
      }

      // Record transaction
      await supabase
        .from("credit_transactions")
        .insert({
          user_id: user.id,
          amount,
          transaction_type: "earned",
          source,
        });

      setState(prev => ({
        ...prev,
        totalCredits: prev.totalCredits + amount,
        lifetimeEarned: prev.lifetimeEarned + amount,
      }));

      emitCreditsChanged();
      return true;
    } catch (error) {
      console.error("Error earning credits:", error);
      return false;
    }
  }, []);

  const spendCredits = useCallback(async (amount: number, source: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      if (state.totalCredits < amount) {
        toast.error(`Not enough credits. You need ${amount} credits.`);
        return false;
      }

      const { error: updateError } = await supabase
        .from("user_credits")
        .update({
          total_credits: state.totalCredits - amount,
        })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error spending credits:", updateError);
        return false;
      }

      // Record transaction
      await supabase
        .from("credit_transactions")
        .insert({
          user_id: user.id,
          amount,
          transaction_type: "spent",
          source,
        });

      setState(prev => ({
        ...prev,
        totalCredits: prev.totalCredits - amount,
      }));

      emitCreditsChanged();
      return true;
    } catch (error) {
      console.error("Error spending credits:", error);
      return false;
    }
  }, [state.totalCredits]);

  const checkCanAfford = useCallback((amount: number): boolean => {
    return state.totalCredits >= amount;
  }, [state.totalCredits]);

  return {
    credits: state.totalCredits,
    lifetimeEarned: state.lifetimeEarned,
    loading: state.loading,
    earnCredits,
    spendCredits,
    checkCanAfford,
    refetch: fetchCredits,
  };
};

export { LEVEL_CREDITS };
