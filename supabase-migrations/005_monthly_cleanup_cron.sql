-- ============================================================
-- 005: Monthly cleanup via pg_cron + pg_net
-- Runs on the 1st of each month at 3:00 AM UTC
-- Calls the monthly-cleanup Edge Function
-- ============================================================

-- Enable pg_net if not already enabled (needed to call Edge Functions from SQL)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule the monthly cleanup job
-- NOTE: Replace <YOUR_SUPABASE_URL> and <YOUR_SERVICE_ROLE_KEY> with actual values
-- You can find these in: Supabase Dashboard → Settings → API
SELECT cron.schedule(
  'monthly-cleanup',
  '0 3 1 * *',  -- At 03:00 on day 1 of every month
  $$
  SELECT net.http_post(
    url := 'https://<YOUR_SUPABASE_URL>.supabase.co/functions/v1/monthly-cleanup',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <YOUR_SERVICE_ROLE_KEY>',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
