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
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null); // ✅ Fix #2
  const maxReconnectAttempts = 5;
  const isMounted = useRef(true); // ✅ Fix #2 : track si composant monté

  // ✅ Fix #1 : stocker les callbacks dans des refs pour éviter les re-renders
  const onPostgresChangeRef = useRef(onPostgresChange);
  const onPresenceSyncRef = useRef(onPresenceSync);
  const onPresenceJoinRef = useRef(onPresenceJoin);
  const onPresenceLeaveRef = useRef(onPresenceLeave);
  const presenceDataRef = useRef(presenceData);

  // Mise à jour des refs sans recréer connect()
  useEffect(() => { onPostgresChangeRef.current = onPostgresChange; }, [onPostgresChange]);
  useEffect(() => { onPresenceSyncRef.current = onPresenceSync; }, [onPresenceSync]);
  useEffect(() => { onPresenceJoinRef.current = onPresenceJoin; }, [onPresenceJoin]);
  useEffect(() => { onPresenceLeaveRef.current = onPresenceLeave; }, [onPresenceLeave]);
  useEffect(() => { presenceDataRef.current = presenceData; }, [presenceData]);

  const cleanup = useCallback(() => {
    // ✅ Fix #2 : annule le timer de reconnexion
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (channelRef.current) {
      console.log(`[useRealtimeChannel] Cleaning up: ${channelName}`);
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, [channelName]);

  // ✅ Fix #1 : connect() ne dépend que de channelName et enabled
  const connect = useCallback(async () => {
    if (!enabled) return;
    cleanup();

    let channel = supabase.channel(channelName);

    if (postgresChanges && onPostgresChangeRef.current) {
      const { event, schema, table, filter } = postgresChanges;
      channel = channel.on(
        'postgres_changes' as any,
        { event, schema, table, filter } as any,
        (payload) => onPostgresChangeRef.current?.(payload)
      );
    }

    if (onPresenceSyncRef.current) {
      channel = channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        onPresenceSyncRef.current?.(state);
      });
    }

    if (onPresenceJoinRef.current) {
      channel = channel.on('presence', { event: 'join' },
        (payload) => onPresenceJoinRef.current?.(payload as any)
      );
    }

    if (onPresenceLeaveRef.current) {
      channel = channel.on('presence', { event: 'leave' },
        (payload) => onPresenceLeaveRef.current?.(payload as any)
      );
    }

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[useRealtimeChannel] Subscribed: ${channelName}`);
        reconnectAttempts.current = 0;
        if (presenceDataRef.current) {
          await channel.track(presenceDataRef.current);
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error(`[useRealtimeChannel] Error on ${channelName}: ${status}`);

        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          console.log(`[useRealtimeChannel] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);

          // ✅ Fix #2 : vérifie que le composant est encore monté avant reconnexion
          reconnectTimer.current = setTimeout(() => {
            if (isMounted.current) {
              connect();
            }
          }, delay);
        } else {
          console.error(`[useRealtimeChannel] Max reconnection attempts reached for ${channelName}`);
        }
      }
    });

    channelRef.current = channel;
  }, [channelName, enabled, postgresChanges, cleanup]); // ✅ Fix #1 : callbacks retirés des dépendances

  useEffect(() => {
    isMounted.current = true;
    connect();
    return () => {
      isMounted.current = false; // ✅ Fix #2
      cleanup();
    };
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
