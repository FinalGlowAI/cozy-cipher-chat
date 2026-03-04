import { useState, useEffect, useCallback } from "react";

const BLOCKED_USERS_KEY = "ocx_blocked_users";

interface BlockedUser {
  id: string;
  blockedAt: string;
  color?: string;
  context?: string;
}

// ✅ Fix : wrapper sécurisé pour localStorage (ne crash pas sur iOS WebView)
const safeStorage = {
  get: (key: string): string | null => {
    try {
      return window.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  set: (key: string, value: string): void => {
    try {
      window.localStorage?.setItem(key, value);
    } catch {
      // Silently fail on iOS WebView
    }
  },
  remove: (key: string): void => {
    try {
      window.localStorage?.removeItem(key);
    } catch {
      // Silently fail on iOS WebView
    }
  },
};

export const useBlockedUsers = (roomContext?: string) => {
  const [allBlockedUsers, setAllBlockedUsers] = useState<BlockedUser[]>([]);

  // ✅ Fix : utilise safeStorage au lieu de localStorage direct
  useEffect(() => {
    try {
      const stored = safeStorage.get(BLOCKED_USERS_KEY);
      if (stored) {
        setAllBlockedUsers(JSON.parse(stored) as BlockedUser[]);
      }
    } catch (error) {
      console.error("Error loading blocked users:", error);
      setAllBlockedUsers([]);
    }
  }, []);

  useEffect(() => {
    try {
      safeStorage.set(BLOCKED_USERS_KEY, JSON.stringify(allBlockedUsers));
    } catch (error) {
      console.error("Error saving blocked users:", error);
    }
  }, [allBlockedUsers]);

  const blockedUsers = roomContext
    ? allBlockedUsers.filter((u) => u.context === roomContext)
    : allBlockedUsers;

  const blockUser = useCallback((userId: string, color?: string, context?: string) => {
    setAllBlockedUsers((prev) => {
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
      setAllBlockedUsers((prev) => prev.filter((u) => u.context !== roomContext));
    } else {
      setAllBlockedUsers([]);
      safeStorage.remove(BLOCKED_USERS_KEY);
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
