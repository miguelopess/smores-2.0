-- Add reward column to occasional_tasks
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)

ALTER TABLE occasional_tasks ADD COLUMN IF NOT EXISTS reward numeric(5,2) DEFAULT 0;
