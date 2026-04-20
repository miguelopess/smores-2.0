-- Task Extensions: allows parents to give children more time on overdue tasks
-- and optionally reset the reminder state so the task can be completed without penalty.

create table if not exists task_extensions (
  id           uuid primary key default gen_random_uuid(),
  person       text not null,
  task_name    text not null,
  task_date    date not null,
  with_reminder boolean not null default false,
  granted_by   uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  unique (person, task_name, task_date)
);

-- Enable RLS
alter table task_extensions enable row level security;

-- Authenticated users can read all extensions (children need to check their own)
create policy "Authenticated users can read task_extensions"
  on task_extensions for select
  to authenticated
  using (true);

-- Authenticated users can insert extensions (parent auth enforced in app layer)
create policy "Authenticated users can insert task_extensions"
  on task_extensions for insert
  to authenticated
  with check (true);
