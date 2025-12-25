import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface PostgresChangesConfig {
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema: string;
  table: string;
  filter?: string;
}

interface UseRealtimeChannelOptions {
  channelName: string;
  enabled?: boolean;
  postgresChanges?: PostgresChangesConfig;
  onPostgresChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onPresenceSync?: (state: Record<string, any[]>) => void;
  onPresenceJoin?: (payload: { key: string; newPresences: any[] }) => void;
  onPresenceLeave?: (payload: { key: string; leftPresences: any[] }) => void;
  presenceData?: Record<string, any>;
}

export const useRealtimeChannel = ({
  channelName,
  enabled = true,
  postgresChanges,
  onPostgresChange,
  onPresenceSync,
  onPresenceJoin,
  onPresenceLeave,
  presenceData,
}: UseRealtimeChannelOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      console.log(`[useRealtimeChannel] Cleaning up: ${channelName}`);
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, [channelName]);

  const connect = useCallback(async () => {
    if (!enabled) return;

    cleanup();

    let channel = supabase.channel(channelName);

    // Add postgres changes listener
    if (postgresChanges && onPostgresChange) {
      const { event, schema, table, filter } = postgresChanges;
      channel = channel.on(
        'postgres_changes' as any,
        { event, schema, table, filter } as any,
        onPostgresChange
      );
    }

    // Add presence listeners
    if (onPresenceSync) {
      channel = channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        onPresenceSync(state);
      });
    }

    if (onPresenceJoin) {
      channel = channel.on('presence', { event: 'join' }, onPresenceJoin as any);
    }

    if (onPresenceLeave) {
      channel = channel.on('presence', { event: 'leave' }, onPresenceLeave as any);
    }

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[useRealtimeChannel] Subscribed: ${channelName}`);
        reconnectAttempts.current = 0;

        // Track presence if data provided
        if (presenceData) {
          await channel.track(presenceData);
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error(`[useRealtimeChannel] Error on ${channelName}: ${status}`);
        
        // Exponential backoff reconnection
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          
          console.log(`[useRealtimeChannel] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
          
          setTimeout(() => {
            cleanup();
            connect();
          }, delay);
        } else {
          console.error(`[useRealtimeChannel] Max reconnection attempts reached for ${channelName}`);
        }
      }
    });

    channelRef.current = channel;
  }, [channelName, enabled, postgresChanges, onPostgresChange, onPresenceSync, onPresenceJoin, onPresenceLeave, presenceData, cleanup]);

  useEffect(() => {
    connect();
    return cleanup;
  }, [connect, cleanup]);

  const trackPresence = useCallback(async (data: Record<string, any>) => {
    if (channelRef.current) {
      await channelRef.current.track(data);
    }
  }, []);

  return {
    channel: channelRef.current,
    trackPresence,
    reconnect: connect,
  };
};
