-- Task Delegations: allows children to delegate tasks to siblings
CREATE TABLE IF NOT EXISTS task_delegations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_person text NOT NULL,
  to_person text,
  task_type text NOT NULL CHECK (task_type IN ('scheduled', 'occasional')),
  scheduled_task_id bigint REFERENCES scheduled_tasks(id) ON DELETE CASCADE,
  occasional_task_id bigint REFERENCES occasional_tasks(id) ON DELETE CASCADE,
  task_name text NOT NULL,
  task_date date NOT NULL,
  end_time text,
  reward numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz
);

-- Prevent duplicate delegations of the same scheduled task instance on a given date
CREATE UNIQUE INDEX idx_task_delegations_scheduled_unique
  ON task_delegations (scheduled_task_id, task_date)
  WHERE task_type = 'scheduled' AND scheduled_task_id IS NOT NULL;

-- Prevent duplicate delegations of the same occasional task
CREATE UNIQUE INDEX idx_task_delegations_occasional_unique
  ON task_delegations (occasional_task_id)
  WHERE task_type = 'occasional' AND occasional_task_id IS NOT NULL;

-- Index for querying by date and status
CREATE INDEX idx_task_delegations_date_status ON task_delegations (task_date, status);

-- RLS policies (same pattern as other tables)
ALTER TABLE task_delegations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read task_delegations"
  ON task_delegations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert task_delegations"
  ON task_delegations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update task_delegations"
  ON task_delegations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete task_delegations"
  ON task_delegations FOR DELETE
  TO authenticated
  USING (true);
