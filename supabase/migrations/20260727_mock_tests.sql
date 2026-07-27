-- Create mock_tests table for CAT mock test tracking
CREATE TABLE public.mock_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  test_name TEXT NOT NULL,
  varc_attempts INTEGER NOT NULL,
  varc_correct INTEGER NOT NULL,
  varc_score INTEGER NOT NULL,
  dilr_attempts INTEGER NOT NULL,
  dilr_correct INTEGER NOT NULL,
  dilr_score INTEGER NOT NULL,
  qa_attempts INTEGER NOT NULL,
  qa_correct INTEGER NOT NULL,
  qa_score INTEGER NOT NULL,
  total_score INTEGER NOT NULL,
  percentile NUMERIC,
  notes TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;

-- Users can only access their own mock test data
CREATE POLICY "Users can view and edit their own mock tests"
ON public.mock_tests
FOR ALL
USING (auth.uid() = user_id);

-- Ensure users can only insert their own data
CREATE POLICY "Users can insert their own mock tests"
ON public.mock_tests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Ensure users can only update their own data
CREATE POLICY "Users can update their own mock tests"
ON public.mock_tests
FOR UPDATE
USING (auth.uid() = user_id);

-- Ensure users can only delete their own data
CREATE POLICY "Users can delete their own mock tests"
ON public.mock_tests
FOR DELETE
USING (auth.uid() = user_id);