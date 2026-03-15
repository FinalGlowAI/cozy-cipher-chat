import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ocodx.store',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // FIX: protect this endpoint with a shared secret
  // Set CLEANUP_SECRET in your Supabase Edge Function environment variables.
  // Then call this function with the header: x-cleanup-secret: <your-secret>
  // Your Supabase cron job should include this header too.
  const cleanupSecret = Deno.env.get('CLEANUP_SECRET')
  if (cleanupSecret) {
    const providedSecret = req.headers.get('x-cleanup-secret')
    if (!providedSecret || providedSecret !== cleanupSecret) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } else {
    // No secret configured — log a warning but allow through so existing
    // cron jobs don't break while you set up the secret.
    console.warn('[cleanup-empty-rooms] WARNING: CLEANUP_SECRET is not set. Endpoint is unprotected.')
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Delete messages from rooms that haven't had activity in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { data: oldRooms, error: roomsError } = await supabaseClient
      .from('ephemeral_rooms')
      .select('id')
      .lt('created_at', oneHourAgo)

    if (roomsError) throw roomsError

    if (oldRooms && oldRooms.length > 0) {
      const roomIds = oldRooms.map(room => room.id)

      const { error: deleteError } = await supabaseClient
        .from('ephemeral_messages')
        .delete()
        .in('room_id', roomIds)

      if (deleteError) throw deleteError

      const { error: deleteRoomsError } = await supabaseClient
        .from('ephemeral_rooms')
        .delete()
        .in('id', roomIds)

      if (deleteRoomsError) throw deleteRoomsError

      return new Response(
        JSON.stringify({
          success: true,
          cleaned: roomIds.length,
          message: `Cleaned up ${roomIds.length} inactive rooms`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, cleaned: 0, message: 'No rooms to clean up' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
