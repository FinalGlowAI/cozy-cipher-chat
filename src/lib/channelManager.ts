import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// Track active subscriptions to prevent duplicates
const activeChannels = new Map<string, RealtimeChannel>();

interface PostgresChangesConfig {
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema: string;
  table: string;
  filter?: string;
}

interface ChannelHandlers {
  onPostgresChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onPresenceSync?: () => void;
  onPresenceJoin?: (payload: { newPresences: any[] }) => void;
  onPresenceLeave?: (payload: { leftPresences: any[] }) => void;
  onSubscribed?: () => void;
  onError?: (error: Error) => void;
}

interface ChannelOptions {
  postgresChanges?: PostgresChangesConfig;
}

export const subscribeToChannel = (
  channelName: string,
  handlers: ChannelHandlers,
  options?: ChannelOptions
) => {
  // Remove existing channel if present
  const existing = activeChannels.get(channelName);
  if (existing) {
    console.log(`[ChannelManager] Removing existing channel: ${channelName}`);
    supabase.removeChannel(existing);
    activeChannels.delete(channelName);
  }

  let channel = supabase.channel(channelName);

  // Add postgres changes listener if configured
  if (options?.postgresChanges && handlers.onPostgresChange) {
    const { event, schema, table, filter } = options.postgresChanges;
    channel = channel.on(
      'postgres_changes' as any,
      { event, schema, table, filter } as any,
      handlers.onPostgresChange
    );
  }

  // Add presence listeners
  if (handlers.onPresenceSync) {
    channel = channel.on('presence', { event: 'sync' }, handlers.onPresenceSync);
  }
  if (handlers.onPresenceJoin) {
    channel = channel.on('presence', { event: 'join' }, handlers.onPresenceJoin as any);
  }
  if (handlers.onPresenceLeave) {
    channel = channel.on('presence', { event: 'leave' }, handlers.onPresenceLeave as any);
  }

  // Subscribe with error handling
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log(`[ChannelManager] Subscribed to: ${channelName}`);
      handlers.onSubscribed?.();
    } else if (status === 'CHANNEL_ERROR') {
      console.error(`[ChannelManager] Error on channel: ${channelName}`);
      handlers.onError?.(new Error(`Channel error: ${channelName}`));
    } else if (status === 'TIMED_OUT') {
      console.warn(`[ChannelManager] Timeout on channel: ${channelName}`);
      handlers.onError?.(new Error(`Channel timeout: ${channelName}`));
    }
  });

  activeChannels.set(channelName, channel);
  return channel;
};

export const unsubscribeFromChannel = (channelName: string) => {
  const channel = activeChannels.get(channelName);
  if (channel) {
    console.log(`[ChannelManager] Unsubscribing from: ${channelName}`);
    supabase.removeChannel(channel);
    activeChannels.delete(channelName);
  }
};

export const unsubscribeFromAllChannels = () => {
  console.log(`[ChannelManager] Unsubscribing from all channels (${activeChannels.size})`);
  for (const [name, channel] of activeChannels.entries()) {
    supabase.removeChannel(channel);
    activeChannels.delete(name);
  }
};

export const getActiveChannelCount = () => activeChannels.size;

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    unsubscribeFromAllChannels();
  });
}
