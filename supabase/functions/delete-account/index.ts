import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ocodx.store',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// FIX: rate limiter added — prevents abuse / accidental loops
const rateLimitStore = new Map<string, { tokens: number; lastRefill: number }>();

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const maxTokens = 3;   // only 3 attempts
  const refillRate = 0.1; // 1 token per 10 seconds
  const now = Date.now();

  let entry = rateLimitStore.get(userId);
  if (!entry) {
    entry = { tokens: maxTokens, lastRefill: now };
    rateLimitStore.set(userId, entry);
  }

  const timePassed = (now - entry.lastRefill) / 1000;
  const tokensToAdd = Math.floor(timePassed * refillRate);

  if (tokensToAdd > 0) {
    entry.tokens = Math.min(maxTokens, entry.tokens + tokensToAdd);
    entry.lastRefill = now;
  }

  if (entry.tokens >= 1) {
    entry.tokens -= 1;
    rateLimitStore.set(userId, entry);
    return { allowed: true };
  }

  const retryAfter = Math.ceil((1 - entry.tokens) / refillRate);
  return { allowed: false, retryAfter };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // FIX: rate limit check before any destructive operation
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimit.retryAfter || 10),
          },
        }
      );
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Get user's subscription to cancel it
    const { data: subscription } = await supabaseClient
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .single();

    // Cancel Stripe subscription if exists
    if (subscription?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
      } catch (error) {
        console.error('Error canceling Stripe subscription:', error);
      }
    }

    // Delete user data from all tables
    await supabaseClient.from('credit_transactions').delete().eq('user_id', user.id);
    await supabaseClient.from('user_credits').delete().eq('user_id', user.id);
    await supabaseClient.from('daily_usage').delete().eq('user_id', user.id);
    await supabaseClient.from('active_sessions').delete().eq('user_id', user.id);
    await supabaseClient.from('subscriptions').delete().eq('user_id', user.id);
    await supabaseClient.from('user_roles').delete().eq('user_id', user.id);
    await supabaseClient.from('kicked_participants').delete().eq('user_id', user.id);
    await supabaseClient.from('room_participants').delete().eq('user_id', user.id);
    await supabaseClient.from('ephemeral_messages').delete().eq('user_id', user.id);
    await supabaseClient.from('ephemeral_rooms').delete().eq('created_by', user.id);
    await supabaseClient.from('free_users').delete().eq('email', user.email ?? '');

    // Finally, delete the auth user
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(user.id);

    if (deleteError) {
      throw deleteError;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting account:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to delete account' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
