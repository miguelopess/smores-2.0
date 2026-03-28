import { supabase } from './supabaseClient';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe this device to push notifications for a given person.
 * Stores the subscription endpoint in Supabase.
 */
export async function subscribeToPush(userId, person) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[Push] Not supported in this browser');
    return { success: false, reason: 'push-not-supported' };
  }

  if (!VAPID_PUBLIC_KEY) {
    console.error('[Push] VITE_VAPID_PUBLIC_KEY is not set!');
    return { success: false, reason: 'no-vapid-key' };
  }

  console.log('[Push] Subscribing for', person, 'userId:', userId);

  try {
    const registration = await navigator.serviceWorker.ready;
    console.log('[Push] Service worker ready');

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.log('[Push] No existing subscription, creating new one...');
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      console.log('[Push] Browser subscription created');
    } else {
      console.log('[Push] Using existing browser subscription');
    }

    const subscriptionJson = subscription.toJSON();

    // Upsert to Supabase (unique on endpoint)
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        person,
        endpoint: subscriptionJson.endpoint,
        keys_p256dh: subscriptionJson.keys.p256dh,
        keys_auth: subscriptionJson.keys.auth,
      },
      { onConflict: 'endpoint' }
    );

    if (error) {
      console.error('[Push] Failed to save to Supabase:', error);
      return { success: false, reason: 'db-error', detail: error.message };
    }

    console.log('[Push] Subscription saved to Supabase successfully!');
    return { success: true };
  } catch (err) {
    console.error('[Push] Subscription failed:', err);
    if (err.name === 'NotAllowedError') {
      return { success: false, reason: 'permission-denied' };
    }
    return { success: false, reason: 'unknown', detail: err.message };
  }
}

/**
 * Unsubscribe this device from push notifications.
 * Removes the subscription from the browser and Supabase.
 */
export async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      // Remove from Supabase
      await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
    }
  } catch (err) {
    console.error('Push unsubscribe failed:', err);
  }
}

/**
 * Check if push is currently subscribed on this device.
 */
export async function getPushSubscriptionState() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { supported: false, subscribed: false };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return { supported: true, subscribed: !!subscription };
  } catch {
    return { supported: true, subscribed: false };
  }
}
