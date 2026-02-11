import { useState, useEffect, useCallback } from "react";

const BLOCKED_USERS_KEY = "ocx_blocked_users";

interface BlockedUser {
  id: string;
  blockedAt: string;
  color?: string;
  context?: string; // Room code where the block occurred
}

/**
 * Session-based blocked users hook with optional room-specific filtering.
 * Pass a `roomContext` to scope blocks to a specific room.
 */
export const useBlockedUsers = (roomContext?: string) => {
  const [allBlockedUsers, setAllBlockedUsers] = useState<BlockedUser[]>([]);

  // Load blocked users from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(BLOCKED_USERS_KEY);
      if (stored) {
        setAllBlockedUsers(JSON.parse(stored) as BlockedUser[]);
      }
    } catch (error) {
      console.error("Error loading blocked users:", error);
      setAllBlockedUsers([]);
    }
  }, []);

  // Save to localStorage whenever allBlockedUsers changes
  useEffect(() => {
    try {
      localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(allBlockedUsers));
    } catch (error) {
      console.error("Error saving blocked users:", error);
    }
  }, [allBlockedUsers]);

  // Filtered list scoped to current room (or all if no context)
  const blockedUsers = roomContext
    ? allBlockedUsers.filter((u) => u.context === roomContext)
    : allBlockedUsers;

  const blockUser = useCallback((userId: string, color?: string, context?: string) => {
    setAllBlockedUsers((prev) => {
      // Don't add duplicate for same user + context
      if (prev.some((u) => u.id === userId && u.context === context)) {
        return prev;
      }
      return [
        ...prev,
        {
          id: userId,
          blockedAt: new Date().toISOString(),
          color,
          context,
        },
      ];
    });
  }, []);

  const unblockUser = useCallback((userId: string) => {
    setAllBlockedUsers((prev) =>
      prev.filter((u) => !(u.id === userId && (!roomContext || u.context === roomContext)))
    );
  }, [roomContext]);

  const isBlocked = useCallback(
    (userId: string): boolean => {
      return blockedUsers.some((u) => u.id === userId);
    },
    [blockedUsers]
  );

  const clearAllBlocked = useCallback(() => {
    if (roomContext) {
      // Only clear blocks for this room
      setAllBlockedUsers((prev) => prev.filter((u) => u.context !== roomContext));
    } else {
      setAllBlockedUsers([]);
      localStorage.removeItem(BLOCKED_USERS_KEY);
    }
  }, [roomContext]);

  return {
    blockedUsers,
    blockUser,
    unblockUser,
    isBlocked,
    clearAllBlocked,
  };
};
