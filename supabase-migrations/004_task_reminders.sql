-- Task reminders: tracks when a parent sends a reminder to a child for a specific task
CREATE TABLE IF NOT EXISTS task_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person text NOT NULL,
  task_name text NOT NULL,
  task_type text NOT NULL CHECK (task_type IN ('scheduled', 'occasional')),
  task_date date NOT NULL,
  sent_by uuid REFERENCES auth.users(id),
  sent_at timestamptz DEFAULT now()
);

-- One reminder per task per day per person (prevents spam)
ALTER TABLE task_reminders
  ADD CONSTRAINT task_reminders_unique UNIQUE (person, task_name, task_date);

-- Fast lookups by person + date
CREATE INDEX idx_task_reminders_person_date ON task_reminders (person, task_date);

-- RLS
ALTER TABLE task_reminders ENABLE ROW LEVEL SECURITY;

-- Parents (admin/parent role) can insert and read all reminders
CREATE POLICY "Parents can insert reminders"
  ON task_reminders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'parent')
    )
  );

CREATE POLICY "Parents can read all reminders"
  ON task_reminders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'parent')
    )
  );

-- Children can read their own reminders (to check if they received one)
CREATE POLICY "Children can read own reminders"
  ON task_reminders FOR SELECT
  TO authenticated
  USING (
    person = (
      SELECT linked_name FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );
