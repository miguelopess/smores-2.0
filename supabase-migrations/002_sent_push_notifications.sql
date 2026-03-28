-- Tracks which push notifications have already been sent to avoid duplicates
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS sent_push_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_key text NOT NULL UNIQUE,
  sent_at timestamptz DEFAULT now()
);

-- Auto-cleanup entries older than 3 days (keeps table small)
-- This uses pg_cron — if not available, you can skip this and do manual cleanup
-- Enable pg_cron first: Dashboard → Database → Extensions → pg_cron
--
-- SELECT cron.schedule(
--   'cleanup-sent-push-notifications',
--   '0 4 * * *',  -- every day at 4 AM
--   $$DELETE FROM sent_push_notifications WHERE sent_at < now() - interval '3 days'$$
-- );

-- Cron job to check task reminders every 5 minutes
-- This calls the check-task-reminders Edge Function
-- Replace YOUR_PROJECT_REF and YOUR_ANON_KEY with your values
--
-- SELECT cron.schedule(
--   'check-task-reminders',
--   '*/5 * * * *',
--   $$SELECT net.http_post(
--     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-task-reminders',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer YOUR_ANON_KEY',
--       'Content-Type', 'application/json'
--     ),
--     body := '{}'::jsonb
--   )$$
-- );
