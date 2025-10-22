import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[LIST-USERS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error("Access denied: Admin role required");
    }

    logStep("Admin verified", { userId: user.id });

    // Fetch all users from auth
    const { data: { users }, error: usersError } = await supabaseClient.auth.admin.listUsers();
    if (usersError) throw usersError;

    logStep("Fetched users", { count: users.length });

    // Fetch all subscriptions
    const { data: subscriptions, error: subsError } = await supabaseClient
      .from("subscriptions")
      .select("*");

    if (subsError) throw subsError;

    // Fetch all free users
    const { data: freeUsers, error: freeError } = await supabaseClient
      .from("free_users")
      .select("email, features");

    if (freeError) throw freeError;

    // Map subscriptions and free users by user_id/email
    const subsMap = new Map(subscriptions?.map(s => [s.user_id, s]) || []);
    const freeUsersMap = new Map(freeUsers?.map(f => [f.email, f]) || []);

    // Combine data
    const usersWithStatus = users.map(u => {
      const subscription = subsMap.get(u.id);
      const freeUser = freeUsersMap.get(u.email || '');
      
      let status = 'free';
      let isActive = false;
      
      if (freeUser) {
        status = 'free (admin granted)';
        isActive = true;
      } else if (subscription) {
        status = subscription.status;
        if (subscription.status === 'active') {
          if (subscription.current_period_end) {
            const endDate = new Date(subscription.current_period_end);
            isActive = endDate > new Date();
          }
        }
      }

      return {
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        subscription_status: status,
        is_active: isActive,
        current_period_end: subscription?.current_period_end || null,
        last_sign_in: u.last_sign_in_at,
      };
    });

    logStep("Processed user data", { count: usersWithStatus.length });

    return new Response(JSON.stringify({ users: usersWithStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
