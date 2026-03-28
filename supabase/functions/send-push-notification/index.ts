import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;

webpush.setVapidDetails(
  "mailto:tarefas@familia.pt",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
      },
    });
  }

  try {
    const { person, title, body, url, tag } = await req.json();

    if (!person || !title) {
      return new Response(
        JSON.stringify({ error: "person and title are required" }),
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Get all push subscriptions for this person
    // Special target "__parents__" sends to all users with parent/admin role
    let subscriptions;
    if (person === "__parents__") {
      // Get all parent user IDs from profiles
      const { data: parentProfiles } = await supabase
        .from("profiles")
        .select("id")
        .in("role", ["parent", "admin"]);

      const parentIds = (parentProfiles || []).map((p) => p.id);
      if (parentIds.length > 0) {
        const { data, error: subError } = await supabase
          .from("push_subscriptions")
          .select("*")
          .in("user_id", parentIds);
        if (subError) console.error("DB error:", subError);
        subscriptions = data;
      } else {
        subscriptions = [];
      }
    } else {
      const { data, error: subError } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("person", person);
      if (subError) console.error("DB error:", subError);
      subscriptions = data;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No subscriptions for this person" }),
        { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    const payload = JSON.stringify({
      title,
      body: body || "",
      url: url || "/",
      tag: tag || "default",
    });

    let sent = 0;
    const expired: string[] = [];

    for (const sub of subscriptions) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys_p256dh,
          auth: sub.keys_auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
        sent++;
      } catch (err: unknown) {
        const pushErr = err as { statusCode?: number };
        // 410 Gone or 404 = subscription expired, clean it up
        if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
          expired.push(sub.id);
        } else {
          console.error(`Push failed for ${sub.endpoint}:`, err);
        }
      }
    }

    // Clean up expired subscriptions
    if (expired.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("id", expired);
    }

    return new Response(
      JSON.stringify({ sent, expired: expired.length }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }
});
