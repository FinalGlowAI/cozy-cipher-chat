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

type CreditRow = {
  total_credits: number;
  lifetime_earned: number;
  last_decay_at: string;
};

type ManageCreditsResponse = {
  success?: boolean;
  amount?: number;
  alreadyAwarded?: boolean;
  credits?: CreditRow | null;
  error?: string;
};

const getNextGrantTime = (lastDecayAt: string | Date) =>
  new Date(new Date(lastDecayAt).getTime() + TWENTY_FOUR_HOURS);

const invokeManageCredits = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke<ManageCreditsResponse>("manage-credits", { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};

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
          const result = await invokeManageCredits({ action: "daily_topup" });
          const refreshed = result?.credits;

          if ((result?.amount ?? 0) > 0) {
            toast.info(`Daily top-up: +${result.amount} credits!`);
            showNotification(
              "Daily Top-Up! 🎁",
              `Your credits were topped up to ${DAILY_FREE_CREDITS}. Play games to earn more!`,
              { tag: "daily-credits" }
            );
          }

          setState({
            totalCredits: refreshed?.total_credits ?? data.total_credits,
            lifetimeEarned: refreshed?.lifetime_earned ?? data.lifetime_earned,
            loading: false,
            decayTime: refreshed?.last_decay_at ? getNextGrantTime(refreshed.last_decay_at) : new Date(now.getTime() + TWENTY_FOUR_HOURS),
          });
        } else {
          setState({
            totalCredits: data.total_credits,
            lifetimeEarned: data.lifetime_earned,
            loading: false,
            decayTime: getNextGrantTime(lastDecayAt),
          });
        }
      } else {
        // Create initial credits record
        const now = new Date();
        const result = await invokeManageCredits({ action: "daily_topup" });
        const newData = result?.credits;

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
      // FIX: force DB-truth refetch so all hook instances converge on the
      // same value (realtime can be flaky in mobile webviews / on reconnects).
      fetchCredits();
      return true;
    } catch (error) {
      console.error("Error earning credits:", error);
      return false;
    }
  }, [fetchCredits]);

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
