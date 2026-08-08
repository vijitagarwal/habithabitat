ALTER TABLE topic_progress
ADD COLUMN IF NOT EXISTS time_spent_minutes integer NOT NULL DEFAULT 0;
