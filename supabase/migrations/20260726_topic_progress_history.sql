-- Add history column to topic_progress table
BEGIN;

-- Add the history column
ALTER TABLE topic_progress
ADD COLUMN history JSONB DEFAULT '[]'::jsonb;

-- Backfill existing rows with empty arrays
UPDATE topic_progress
SET history = '[]'::jsonb
WHERE history IS NULL;

COMMIT;