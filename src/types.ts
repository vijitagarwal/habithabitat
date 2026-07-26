// ─────────────────────────────────────────────────────────────
// All TypeScript types for Bright Habit View
// ─────────────────────────────────────────────────────────────



export interface TopicProgress {
  id?: string;
  user_id?: string;
  section: 'VARC' | 'DILR' | 'QA';
  topic_name: string;
  status: 'Not Started' | 'In Progress' | 'Concept Done' | 'Practice Done' | 'Mastered';
  confidence?: number;
  history?: Array<{ date: string; confidence: number }>;
  updated_at?: string;
}

export interface DailyActivity {
  id?: string;
  user_id?: string;
  date: string;
  score: number;
}

// Add other existing types from the codebase as needed...