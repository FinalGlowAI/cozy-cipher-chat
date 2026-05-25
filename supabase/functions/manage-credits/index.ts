import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LEVEL_CREDITS: Record<number, number> = {
  1: 5,
  2: 10,
  3: 15,
  4: 20,
  5: 25,
  6: 30,
  7: 50,
};

const DAILY_FREE_CREDITS = 10;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

const GAME_SOURCE_RE = /^(memory_game|symbol_match_game|flash_number_game|color_sequence_game|chimp_test_game|path_tracer_game)_level_[1-7]$/;
const SPEND_COSTS: Record<string, number> = {
  text_encryption: 2,
  text_decryption: 2,
  image_encryption: 5,
  image_decryption: 3,
  ephemeral_room_creation: 10,
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");

    if (action === "earn_game") {
      const level = Number(body.level);
      const source = String(body.source ?? "");
      const amount = LEVEL_CREDITS[level];

      if (!amount || !GAME_SOURCE_RE.test(source) || !source.endsWith(`_level_${level}`)) {
        return json({ error: "Invalid credit reward" }, 400);
      }

      const since = new Date(Date.now() - TWENTY_FOUR_HOURS_MS).toISOString();
      const { data: existingReward } = await supabase
        .from("credit_transactions")
        .select("id")
        .eq("user_id", user.id)
        .eq("transaction_type", "earned")
        .eq("source", source)
        .gte("created_at", since)
        .maybeSingle();

      if (existingReward) {
        const { data: credits } = await supabase
          .from("user_credits")
          .select("total_credits,lifetime_earned,last_decay_at")
          .eq("user_id", user.id)
          .maybeSingle();

        return json({ success: true, alreadyAwarded: true, amount: 0, credits });
      }

      const { error } = await supabase.rpc("earn_credits", {
        p_user_id: user.id,
        p_amount: amount,
        p_source: source,
      });
      if (error) throw error;

      const { data: credits } = await supabase
        .from("user_credits")
        .select("total_credits,lifetime_earned,last_decay_at")
        .eq("user_id", user.id)
        .maybeSingle();

      return json({ success: true, alreadyAwarded: false, amount, credits });
    }

    if (action === "daily_topup") {
      const now = new Date();
      const { data: current } = await supabase
        .from("user_credits")
        .select("total_credits,lifetime_earned,last_decay_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!current) {
        const { data: created, error: createError } = await supabase
          .from("user_credits")
          .insert({ user_id: user.id, total_credits: 0, lifetime_earned: 0, last_decay_at: now.toISOString() })
          .select("total_credits,lifetime_earned,last_decay_at")
          .single();
        if (createError) throw createError;
        return json({ success: true, amount: 0, credits: created });
      }

      const lastDecayAt = new Date(current.last_decay_at);
      const shouldReset = now.getTime() - lastDecayAt.getTime() >= TWENTY_FOUR_HOURS_MS;
      let amount = 0;

      if (shouldReset && current.total_credits < DAILY_FREE_CREDITS) {
        amount = DAILY_FREE_CREDITS - current.total_credits;
        const { error } = await supabase.rpc("earn_credits", {
          p_user_id: user.id,
          p_amount: amount,
          p_source: "daily_topup",
        });
        if (error) throw error;
      }

      if (shouldReset) {
        const { error } = await supabase
          .from("user_credits")
          .update({ last_decay_at: now.toISOString() })
          .eq("user_id", user.id);
        if (error) throw error;
      }

      const { data: credits } = await supabase
        .from("user_credits")
        .select("total_credits,lifetime_earned,last_decay_at")
        .eq("user_id", user.id)
        .maybeSingle();

      return json({ success: true, amount, credits });
    }

    if (action === "spend") {
      const source = String(body.source ?? "");
      const amount = Number(body.amount);

      if (!SPEND_COSTS[source] || SPEND_COSTS[source] !== amount) {
        return json({ error: "Invalid credit spend" }, 400);
      }

      const { data: success, error } = await supabase.rpc("spend_credits", {
        p_user_id: user.id,
        p_amount: amount,
        p_source: source,
      });
      if (error) throw error;

      const { data: credits } = await supabase
        .from("user_credits")
        .select("total_credits,lifetime_earned,last_decay_at")
        .eq("user_id", user.id)
        .maybeSingle();

      return json({ success: Boolean(success), credits });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (error) {
    console.error("manage-credits error:", error);
    return json({ error: error instanceof Error ? error.message : "Credit update failed" }, 500);
  }
});