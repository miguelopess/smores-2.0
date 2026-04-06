import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Send a push notification to a person via the Edge Function.
 * Fire-and-forget — does not throw on failure.
 */
export async function sendPushNotification({ person, title, body, url, tag }) {
  try {
    console.log('[sendPush] Sending to', person, ':', title);
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: { person, title, body, url, tag },
    });

    if (error) {
      console.error('[sendPush] Error:', error);
    } else {
      console.log('[sendPush] Response:', data);
    }
  } catch (err) {
    console.error('[sendPush] Failed:', err);
  }
}
