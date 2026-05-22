import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CLEANUP] ${step}${detailsStr}`);
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Require shared secret to invoke this destructive endpoint
  const cleanupSecret = Deno.env.get('CLEANUP_SECRET')
  const providedSecret = req.headers.get('x-cleanup-secret')
  if (!cleanupSecret || !providedSecret || providedSecret !== cleanupSecret) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const cleanupResults = {
      expiredRooms: 0,
      expiredMessages: 0,
      expiredImages: 0,
      orphanedParticipants: 0,
    };

    logStep("Starting cleanup job");

    // 1. Delete expired ephemeral rooms and their messages (24 hours old)
    const { data: expiredRooms, error: roomsError } = await supabaseClient
      .from('ephemeral_rooms')
      .select('id')
      .lt('expires_at', new Date().toISOString())

    if (roomsError) {
      logStep("Error fetching expired rooms", { error: roomsError.message });
    } else if (expiredRooms && expiredRooms.length > 0) {
      const roomIds = expiredRooms.map(room => room.id);
      
      // Delete messages from expired rooms
      const { error: msgDeleteError, count: msgCount } = await supabaseClient
        .from('ephemeral_messages')
        .delete()
        .in('room_id', roomIds)

      if (msgDeleteError) {
        logStep("Error deleting expired messages", { error: msgDeleteError.message });
      } else {
        cleanupResults.expiredMessages = msgCount || 0;
        logStep("Deleted expired messages", { count: msgCount });
      }

      // Delete room participants from expired rooms
      const { error: partDeleteError, count: partCount } = await supabaseClient
        .from('room_participants')
        .delete()
        .in('room_id', roomIds)

      if (partDeleteError) {
        logStep("Error deleting room participants", { error: partDeleteError.message });
      } else {
        cleanupResults.orphanedParticipants = partCount || 0;
        logStep("Deleted room participants", { count: partCount });
      }

      // Delete the expired rooms
      const { error: roomDeleteError } = await supabaseClient
        .from('ephemeral_rooms')
        .delete()
        .in('id', roomIds)

      if (roomDeleteError) {
        logStep("Error deleting expired rooms", { error: roomDeleteError.message });
      } else {
        cleanupResults.expiredRooms = roomIds.length;
        logStep("Deleted expired rooms", { count: roomIds.length });
      }
    } else {
      logStep("No expired rooms found");
    }

    // 2. Call the cleanup_expired_encrypted_images database function
    const { data: imageCount, error: imageError } = await supabaseClient
      .rpc('cleanup_expired_encrypted_images')

    if (imageError) {
      logStep("Error cleaning expired images", { error: imageError.message });
    } else {
      cleanupResults.expiredImages = imageCount || 0;
      logStep("Cleaned expired images", { count: imageCount });
    }

    // 3. Clean up orphaned room participants (where room no longer exists)
    const { error: orphanError, count: orphanCount } = await supabaseClient
      .from('room_participants')
      .delete()
      .not('room_id', 'in', 
        supabaseClient.from('ephemeral_rooms').select('id')
      )

    if (orphanError) {
      logStep("Error cleaning orphaned participants", { error: orphanError.message });
    } else if (orphanCount && orphanCount > 0) {
      cleanupResults.orphanedParticipants += orphanCount;
      logStep("Cleaned orphaned participants", { count: orphanCount });
    }

    logStep("Cleanup completed", cleanupResults);

    return new Response(
      JSON.stringify({ 
        success: true, 
        cleaned: cleanupResults,
        message: `Cleaned ${cleanupResults.expiredRooms} rooms, ${cleanupResults.expiredMessages} messages, ${cleanupResults.expiredImages} images, ${cleanupResults.orphanedParticipants} orphaned participants` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logStep("ERROR in cleanup", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
