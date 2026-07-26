-- Add history column to topic_progress table
BEGIN;

-- Add history column (JSONB array of { date: string, confidence: number })
ALTER TABLE topic_progress ADD COLUMN history jsonb DEFAULT '[]'::jsonb;

-- Backfill existing topics with empty history arrays
UPDATE topic_progress SET history = '[]'::jsonb WHERE history IS NULL;

-- Add RLS policy to allow users to update their own history
ALTER POLICY "Enable topic updates for authenticated users"
ON topic_progress
FOR ALL
USING (auth.uid() = user_id);

COMMIT;