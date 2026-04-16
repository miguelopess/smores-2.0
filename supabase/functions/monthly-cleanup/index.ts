import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, content-type, x-client-info, apikey",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    // Cutoff = 1st of current month (delete everything before this date)
    const now = new Date();
    const ptFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Lisbon",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = ptFormatter.formatToParts(now);
    const get = (type: string) =>
      parts.find((p) => p.type === type)?.value || "";
    const year = get("year");
    const month = get("month");
    const cutoffDate = `${year}-${month}-01`;

    console.log(`[monthly-cleanup] Cutoff date: ${cutoffDate}`);

    const summary = {
      cutoff_date: cutoffDate,
      deleted_tasks: 0,
      deleted_photos: 0,
      deleted_occasional_tasks: 0,
      deleted_reminders: 0,
      deleted_notifications: 0,
    };

    // 1. Fetch old tasks (to get photo URLs before deleting)
    const { data: oldTasks, error: fetchErr } = await supabase
      .from("tasks")
      .select("id, photo_url")
      .lt("date", cutoffDate);

    if (fetchErr) {
      console.error("Error fetching old tasks:", fetchErr);
      throw fetchErr;
    }

    // 2. Delete photos from storage bucket (in batches of 100)
    if (oldTasks && oldTasks.length > 0) {
      const photoUrls = oldTasks
        .map((t) => t.photo_url)
        .filter((url): url is string => !!url);

      if (photoUrls.length > 0) {
        // Extract file paths from public URLs
        // URL format: https://<project>.supabase.co/storage/v1/object/public/task-photos/<filename>
        const filePaths = photoUrls
          .map((url) => {
            const marker = "/task-photos/";
            const idx = url.indexOf(marker);
            if (idx === -1) return null;
            return url.substring(idx + marker.length);
          })
          .filter((p): p is string => !!p);

        // Delete in batches of 100
        for (let i = 0; i < filePaths.length; i += 100) {
          const batch = filePaths.slice(i, i + 100);
          const { error: storageErr } = await supabase.storage
            .from("task-photos")
            .remove(batch);

          if (storageErr) {
            console.error(`Error deleting photo batch ${i}:`, storageErr);
          } else {
            summary.deleted_photos += batch.length;
          }
        }
      }

      // 3. Delete old tasks
      const { error: deleteTasksErr, count } = await supabase
        .from("tasks")
        .delete({ count: "exact" })
        .lt("date", cutoffDate);

      if (deleteTasksErr) {
        console.error("Error deleting old tasks:", deleteTasksErr);
      } else {
        summary.deleted_tasks = count || 0;
      }
    }

    // 4. Delete old occasional tasks (completed OR past date)
    const { error: deleteOccErr, count: occCount } = await supabase
      .from("occasional_tasks")
      .delete({ count: "exact" })
      .or(`completed.eq.true,date.lt.${cutoffDate}`);

    if (deleteOccErr) {
      console.error("Error deleting occasional tasks:", deleteOccErr);
    } else {
      summary.deleted_occasional_tasks = occCount || 0;
    }

    // 5. Delete old task reminders
    const { error: deleteRemErr, count: remCount } = await supabase
      .from("task_reminders")
      .delete({ count: "exact" })
      .lt("task_date", cutoffDate);

    if (deleteRemErr) {
      console.error("Error deleting reminders:", deleteRemErr);
    } else {
      summary.deleted_reminders = remCount || 0;
    }

    // 6. Delete old sent push notifications
    const { error: deleteNotifErr, count: notifCount } = await supabase
      .from("sent_push_notifications")
      .delete({ count: "exact" })
      .lt("sent_at", cutoffDate);

    if (deleteNotifErr) {
      console.error("Error deleting notifications:", deleteNotifErr);
    } else {
      summary.deleted_notifications = notifCount || 0;
    }

    console.log("[monthly-cleanup] Summary:", JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (err) {
    console.error("[monthly-cleanup] Error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});
