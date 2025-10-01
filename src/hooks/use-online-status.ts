'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface OnlineUser {
  userId: string;
  userName: string;
  lastSeen: Date;
  isOnline: boolean;
}

interface UseOnlineStatusReturn {
  onlineUsers: Map<string, OnlineUser>;
  isUserOnline: (userId: string) => boolean;
  getLastSeen: (userId: string) => Date | null;
  startHeartbeat: (referralId: string) => void;
  stopHeartbeat: () => void;
}

export function useOnlineStatus(): UseOnlineStatusReturn {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Map<string, OnlineUser>>(new Map());
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const currentReferralId = useRef<string | null>(null);

  const isUserOnline = (userId: string): boolean => {
    const userStatus = onlineUsers.get(userId);
    if (!userStatus) return false;
    
    // Consider a user online if they were active in the last 2 minutes
    const now = new Date();
    const timeDiff = now.getTime() - userStatus.lastSeen.getTime();
    return timeDiff < 2 * 60 * 1000; // 2 minutes
  };

  const getLastSeen = (userId: string): Date | null => {
    const userStatus = onlineUsers.get(userId);
    return userStatus ? userStatus.lastSeen : null;
  };

  const sendHeartbeat = async (referralId: string) => {
    if (!user?.id || !referralId) return;

    try {
      const response = await fetch('/api/presence/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referralId,
          userId: user.id,
          userName: user.user_metadata?.name || user.email || 'User',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.onlineUsers) {
          const usersMap = new Map<string, OnlineUser>();
          data.onlineUsers.forEach((u: any) => {
            usersMap.set(u.userId, {
              ...u,
              lastSeen: new Date(u.lastSeen),
            });
          });
          setOnlineUsers(usersMap);
        }
      }
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
    }
  };

  const startHeartbeat = (referralId: string) => {
    if (currentReferralId.current === referralId && heartbeatInterval.current) {
      return; // Already running for this referral
    }

    stopHeartbeat(); // Stop any existing heartbeat
    currentReferralId.current = referralId;

    // Send initial heartbeat
    sendHeartbeat(referralId);

    // Set up interval for continuous heartbeat
    heartbeatInterval.current = setInterval(() => {
      sendHeartbeat(referralId);
    }, 30000); // Every 30 seconds
  };

  const stopHeartbeat = () => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
    currentReferralId.current = null;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopHeartbeat();
    };
  }, []);

  // Handle visibility change to pause/resume heartbeat
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopHeartbeat();
      } else if (currentReferralId.current) {
        startHeartbeat(currentReferralId.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    onlineUsers,
    isUserOnline,
    getLastSeen,
    startHeartbeat,
    stopHeartbeat,
  };
}
