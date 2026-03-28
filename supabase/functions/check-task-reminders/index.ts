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

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

async function sendPushToSubscriptions(
  subscriptions: Array<{ id: string; endpoint: string; keys_p256dh: string; keys_auth: string }>,
  payload: string
) {
  let sent = 0;
  const expired: string[] = [];

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth } },
        payload
      );
      sent++;
    } catch (err: unknown) {
      const pushErr = err as { statusCode?: number };
      if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
        expired.push(sub.id);
      } else {
        console.error(`Push failed for ${sub.endpoint}:`, err);
      }
    }
  }

  if (expired.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", expired);
  }

  return { sent, expired: expired.length };
}

async function markAsSent(taskKey: string): Promise<boolean> {
  const { error } = await supabase
    .from("sent_push_notifications")
    .insert({ task_key: taskKey });

  // If duplicate key error, it was already sent
  if (error) {
    if (error.code === "23505") return false; // unique violation = already sent
    console.error("Error marking as sent:", error);
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
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
    // Current time in Portugal (Europe/Lisbon)
    const now = new Date();
    const ptFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Lisbon",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = ptFormatter.formatToParts(now);
    const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
    const todayStr = `${get("year")}-${get("month")}-${get("day")}`;
    const currentHour = parseInt(get("hour"));
    const currentMinute = parseInt(get("minute"));
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    // Get Portugal day of week
    const ptDayFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Lisbon",
      weekday: "long",
    });
    const todayKey = ptDayFormatter.format(now).toLowerCase();

    console.log(`Checking reminders: ${todayStr} ${currentHour}:${currentMinute} (${todayKey})`);

    // 1. Get all scheduled tasks for today's day of week
    const { data: scheduledTasks } = await supabase
      .from("scheduled_tasks")
      .select("*")
      .contains("days_of_week", [todayKey]);

    // 2. Get occasional tasks for today that aren't completed
    const { data: occasionalTasks } = await supabase
      .from("occasional_tasks")
      .select("*")
      .eq("date", todayStr)
      .eq("completed", false);

    // 3. Get today's completed tasks
    const { data: completedTasks } = await supabase
      .from("tasks")
      .select("person, task_name, date")
      .eq("date", todayStr);

    const completedSet = new Set(
      (completedTasks || []).map((t) => `${t.person}:${t.task_name}`)
    );

    let totalSent = 0;

    // Process scheduled tasks
    for (const task of scheduledTasks || []) {
      if (!task.end_time || !task.person) continue;
      if (completedSet.has(`${task.person}:${task.task_name}`)) continue;

      const [h, m] = task.end_time.split(":").map(Number);
      const deadlineMinutes = h * 60 + m;
      const minutesUntilDeadline = deadlineMinutes - currentTotalMinutes;

      // 15 minutes before reminder (window: 10-15 min before)
      if (minutesUntilDeadline >= 10 && minutesUntilDeadline <= 15) {
        const key = `scheduled:${task.id}:${todayStr}:reminder`;
        if (await markAsSent(key)) {
          const { data: subs } = await supabase
            .from("push_subscriptions")
            .select("*")
            .eq("person", task.person);

          if (subs && subs.length > 0) {
            const result = await sendPushToSubscriptions(
              subs,
              JSON.stringify({
                title: `⏰ Lembra-te: ${task.task_name}`,
                body: `Tens 15 minutos para completar esta tarefa!`,
                url: "/",
                tag: `reminder-${task.id}`,
              })
            );
            totalSent += result.sent;
          }
        }
      }

      // At deadline (window: 0-5 min after)
      if (minutesUntilDeadline >= -5 && minutesUntilDeadline <= 0) {
        const key = `scheduled:${task.id}:${todayStr}:deadline`;
        if (await markAsSent(key)) {
          const { data: subs } = await supabase
            .from("push_subscriptions")
            .select("*")
            .eq("person", task.person);

          if (subs && subs.length > 0) {
            const result = await sendPushToSubscriptions(
              subs,
              JSON.stringify({
                title: `⚠️ Prazo: ${task.task_name}`,
                body: `O prazo para esta tarefa terminou!`,
                url: "/",
                tag: `deadline-${task.id}`,
              })
            );
            totalSent += result.sent;
          }
        }
      }
    }

    // Process occasional tasks
    for (const task of occasionalTasks || []) {
      if (!task.end_time || !task.person) continue;

      const [h, m] = task.end_time.split(":").map(Number);
      const deadlineMinutes = h * 60 + m;
      const minutesUntilDeadline = deadlineMinutes - currentTotalMinutes;

      // 15 minutes before
      if (minutesUntilDeadline >= 10 && minutesUntilDeadline <= 15) {
        const key = `occasional:${task.id}:${todayStr}:reminder`;
        if (await markAsSent(key)) {
          const { data: subs } = await supabase
            .from("push_subscriptions")
            .select("*")
            .eq("person", task.person);

          if (subs && subs.length > 0) {
            const result = await sendPushToSubscriptions(
              subs,
              JSON.stringify({
                title: `⏰ Lembra-te: ${task.task_name}`,
                body: `Tens 15 minutos para completar esta tarefa especial!`,
                url: "/",
                tag: `reminder-occ-${task.id}`,
              })
            );
            totalSent += result.sent;
          }
        }
      }

      // At deadline
      if (minutesUntilDeadline >= -5 && minutesUntilDeadline <= 0) {
        const key = `occasional:${task.id}:${todayStr}:deadline`;
        if (await markAsSent(key)) {
          const { data: subs } = await supabase
            .from("push_subscriptions")
            .select("*")
            .eq("person", task.person);

          if (subs && subs.length > 0) {
            const result = await sendPushToSubscriptions(
              subs,
              JSON.stringify({
                title: `⚠️ Prazo: ${task.task_name}`,
                body: `O prazo para esta tarefa especial terminou!`,
                url: "/",
                tag: `deadline-occ-${task.id}`,
              })
            );
            totalSent += result.sent;
          }
        }
      }
    }

    // Cleanup old sent records (older than 3 days)
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from("sent_push_notifications")
      .delete()
      .lt("sent_at", threeDaysAgo);

    console.log(`Done. Sent ${totalSent} notifications.`);

    return new Response(
      JSON.stringify({ checked: true, sent: totalSent }),
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
