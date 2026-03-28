import { useEffect, useState, useCallback } from 'react';
import { subscribeToPush, unsubscribeFromPush, getPushSubscriptionState } from '@/api/pushNotifications';

/**
 * Hook to manage Web Push subscription lifecycle.
 * Automatically subscribes when user is authenticated.
 * Provides manual subscribe/unsubscribe and status.
 */
export function usePushSubscription(user) {
  const [pushState, setPushState] = useState({
    supported: false,
    subscribed: false,
    loading: true,
  });

  const userId = user?.id;
  const person = user?.linked_name || user?.full_name;

  // Check current subscription state on mount
  useEffect(() => {
    let cancelled = false;

    async function checkState() {
      const state = await getPushSubscriptionState();
      if (!cancelled) {
        setPushState({ ...state, loading: false });
      }
    }

    checkState();
    return () => { cancelled = true; };
  }, []);

  // Auto-subscribe when user is available and push is supported but not subscribed
  useEffect(() => {
    if (!userId || !person || pushState.loading || !pushState.supported) return;
    if (pushState.subscribed) return;

    // Only auto-subscribe if notification permission is already granted
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      subscribeToPush(userId, person).then((result) => {
        if (result.success) {
          setPushState((prev) => ({ ...prev, subscribed: true }));
        }
      });
    }
  }, [userId, person, pushState.loading, pushState.supported, pushState.subscribed]);

  const subscribe = useCallback(async () => {
    if (!userId || !person) return { success: false, reason: 'no-user' };

    setPushState((prev) => ({ ...prev, loading: true }));
    const result = await subscribeToPush(userId, person);
    setPushState((prev) => ({
      ...prev,
      subscribed: result.success,
      loading: false,
    }));
    return result;
  }, [userId, person]);

  const unsubscribe = useCallback(async () => {
    setPushState((prev) => ({ ...prev, loading: true }));
    await unsubscribeFromPush();
    setPushState((prev) => ({ ...prev, subscribed: false, loading: false }));
  }, []);

  return {
    pushSupported: pushState.supported,
    pushSubscribed: pushState.subscribed,
    pushLoading: pushState.loading,
    subscribe,
    unsubscribe,
  };
}
