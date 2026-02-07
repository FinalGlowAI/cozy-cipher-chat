import { useState, useEffect, useCallback } from "react";

const BLOCKED_USERS_KEY = "ocx_blocked_users";

interface BlockedUser {
  id: string;
  blockedAt: string;
  color?: string; // User color for display in ephemeral rooms
  context?: string; // Where the block occurred (e.g., room code)
}

/**
 * Session-based blocked users hook
 * Blocks are stored in localStorage and persist within the session
 * This is privacy-respecting - no server-side storage
 */
export const useBlockedUsers = () => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);

  // Load blocked users from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(BLOCKED_USERS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as BlockedUser[];
        setBlockedUsers(parsed);
      }
    } catch (error) {
      console.error("Error loading blocked users:", error);
      setBlockedUsers([]);
    }
  }, []);

  // Save to localStorage whenever blockedUsers changes
  useEffect(() => {
    try {
      localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(blockedUsers));
    } catch (error) {
      console.error("Error saving blocked users:", error);
    }
  }, [blockedUsers]);

  const blockUser = useCallback((userId: string, color?: string, context?: string) => {
    setBlockedUsers((prev) => {
      // Don't add duplicate
      if (prev.some((u) => u.id === userId)) {
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
    setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  const isBlocked = useCallback(
    (userId: string): boolean => {
      return blockedUsers.some((u) => u.id === userId);
    },
    [blockedUsers]
  );

  const clearAllBlocked = useCallback(() => {
    setBlockedUsers([]);
    localStorage.removeItem(BLOCKED_USERS_KEY);
  }, []);

  return {
    blockedUsers,
    blockUser,
    unblockUser,
    isBlocked,
    clearAllBlocked,
  };
};
