-- ============================================================
-- 006: Cleanup log table
-- Tracks when data cleanups happen so all devices know
-- the boundary date (prevents useMarkMissedTasks from
-- recreating deleted tasks as not_done)
-- ============================================================

CREATE TABLE IF NOT EXISTS cleanup_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaned_at date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cleanup_log ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read (children need this to know cleanup boundary)
CREATE POLICY "Anyone can read cleanup_log"
  ON cleanup_log FOR SELECT
  TO authenticated
  USING (true);

-- Only service_role (Edge Functions) can insert
-- No explicit policy needed — service_role bypasses RLS
