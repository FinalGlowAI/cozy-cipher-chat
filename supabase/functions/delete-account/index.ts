import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    // Note: Some tables have ON DELETE CASCADE, but we'll be explicit
    await supabaseClient.from('active_sessions').delete().eq('user_id', user.id);
    await supabaseClient.from('subscriptions').delete().eq('user_id', user.id);
    await supabaseClient.from('user_roles').delete().eq('user_id', user.id);
    
    // Delete ephemeral messages (if user_id is set)
    await supabaseClient.from('ephemeral_messages').delete().eq('user_id', user.id);
    
    // Delete ephemeral rooms created by user
    await supabaseClient.from('ephemeral_rooms').delete().eq('created_by', user.id);

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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
