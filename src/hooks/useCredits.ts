import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { emitCreditsChanged, onCreditsChanged } from "@/lib/creditsBus";
import { showNotification } from "@/lib/notifications";

interface CreditState {
  totalCredits: number;
  lifetimeEarned: number;
  loading: boolean;
  decayTime: Date | null;
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

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
const DAILY_FREE_CREDITS = 10;

// NOTE: Credits are NEVER reduced automatically.
// The `last_decay_at` DB column is a legacy name — it only tracks
// the last daily-top-up cycle reset. No decay/reduction logic exists.

export const useCredits = () => {
  const [state, setState] = useState<CreditState>({
    totalCredits: 0,
    lifetimeEarned: 0,
    loading: true,
    decayTime: null,
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
        const lastDecayAt = new Date(data.last_decay_at);
        const now = new Date();
        const timeSinceDecay = now.getTime() - lastDecayAt.getTime();

        // Check if 24 hours have passed — top up to minimum 10 if below
        if (timeSinceDecay >= TWENTY_FOUR_HOURS) {
          const currentBalance = data.total_credits;

          if (currentBalance < DAILY_FREE_CREDITS) {
            const topUpAmount = DAILY_FREE_CREDITS - currentBalance;

            const { error: rpcError } = await supabase.rpc("earn_credits", {
              p_user_id: user.id,
              p_amount: topUpAmount,
              p_source: "daily_topup",
            });

            if (!rpcError) {
              toast.info(`Daily top-up: +${topUpAmount} credits!`);
              showNotification(
                "Daily Top-Up! 🎁",
                `Your credits were topped up to ${DAILY_FREE_CREDITS}. Play games to earn more!`,
                { tag: "daily-credits" }
              );
            } else {
              console.error("Error granting daily credits:", rpcError);
            }
          }

          // Always update last_decay_at to reset the 24h timer
          await supabase
            .from("user_credits")
            .update({ last_decay_at: now.toISOString() })
            .eq("user_id", user.id);

          // Re-fetch to get the updated balance
          const { data: refreshed } = await supabase
            .from("user_credits")
            .select("*")
            .eq("user_id", user.id)
            .single();

          setState({
            totalCredits: refreshed?.total_credits ?? Math.max(currentBalance, DAILY_FREE_CREDITS),
            lifetimeEarned: refreshed?.lifetime_earned ?? data.lifetime_earned,
            loading: false,
            decayTime: new Date(now.getTime() + TWENTY_FOUR_HOURS),
          });
        } else {
          const nextGrantTime = new Date(lastDecayAt.getTime() + TWENTY_FOUR_HOURS);
          setState({
            totalCredits: data.total_credits,
            lifetimeEarned: data.lifetime_earned,
            loading: false,
            decayTime: nextGrantTime,
          });
        }
      } else {
        // Create initial credits record
        const now = new Date();
        const { data: newData, error: insertError } = await supabase
          .from("user_credits")
          .insert({
            user_id: user.id,
            total_credits: 0,
            lifetime_earned: 0,
            last_decay_at: now.toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating credits record:", insertError);
        }

        setState({
          totalCredits: newData?.total_credits ?? 0,
          lifetimeEarned: newData?.lifetime_earned ?? 0,
          loading: false,
          decayTime: new Date(now.getTime() + TWENTY_FOUR_HOURS),
        });
      }
    } catch (error) {
      console.error("Error in fetchCredits:", error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Schedule a push notification when the bonus becomes available during the session
  useEffect(() => {
    if (!state.decayTime) return;
    const remaining = state.decayTime.getTime() - Date.now();
    if (remaining <= 0) return;

    const timer = setTimeout(() => {
      showNotification(
        "Daily Bonus Ready! 🎁",
        `Your ${DAILY_FREE_CREDITS} free credits are waiting. Open the app to claim them!`,
        { tag: "daily-credits-ready" }
      );
      fetchCredits();
    }, remaining);

    return () => clearTimeout(timer);
  }, [state.decayTime, fetchCredits]);

  useEffect(() => {
    fetchCredits();

    const unsubscribe = onCreditsChanged(() => {
      fetchCredits();
    });

    // FIX: unique channel name per hook instance — otherwise multiple
    // useCredits() consumers (CreditDisplay + game dialogs) collide on the
    // same topic, and unmounting one tears down realtime for the others.
    const channelName = `user_credits_changes_${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_credits" },
        () => { fetchCredits(); }
      )
      .subscribe();

    return () => {
      unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [fetchCredits]);

  // FIX: earnCredits now uses atomic RPC — no more SELECT + UPDATE race condition
  const earnCredits = useCallback(async (level: number, source: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const amount = LEVEL_CREDITS[level] || 5;

      const { error } = await supabase.rpc("earn_credits", {
        p_user_id: user.id,
        p_amount: amount,
        p_source: source,
      });

      if (error) {
        console.error("Error earning credits:", error);
        return false;
      }

      // Optimistic local update — realtime will reconcile if needed
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

  // FIX: spendCredits now uses atomic RPC with FOR UPDATE lock — prevents double-spend
  const spendCredits = useCallback(async (amount: number, source: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Optimistic check before hitting the DB (UX only — DB is the source of truth)
      if (state.totalCredits < amount) {
        toast.error(`Not enough credits. You need ${amount} credits.`);
        return false;
      }

      // FIX: atomic RPC uses SELECT FOR UPDATE + UPDATE in one transaction
      const { data: success, error } = await supabase.rpc("spend_credits", {
        p_user_id: user.id,
        p_amount: amount,
        p_source: source,
      });

      if (error) {
        console.error("Error spending credits:", error);
        toast.error("Failed to process credits. Please try again.");
        return false;
      }

      if (!success) {
        // DB returned false — balance was actually insufficient (race condition caught)
        toast.error(`Not enough credits. You need ${amount} credits.`);
        // Refresh local state to sync with DB reality
        await fetchCredits();
        return false;
      }

      // Optimistic local update
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
  }, [state.totalCredits, fetchCredits]);

  const checkCanAfford = useCallback((amount: number): boolean => {
    return state.totalCredits >= amount;
  }, [state.totalCredits]);

  return {
    credits: state.totalCredits,
    lifetimeEarned: state.lifetimeEarned,
    loading: state.loading,
    decayTime: state.decayTime,
    earnCredits,
    spendCredits,
    checkCanAfford,
    refetch: fetchCredits,
  };
};

export { LEVEL_CREDITS };
