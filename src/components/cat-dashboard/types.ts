// ─────────────────────────────────────────────────────────────
// All TypeScript types for Mission CAT 2026 Pro
// ─────────────────────────────────────────────────────────────

export interface DateConfig {
  CAMPAIGN_START: Date;
  JUL1: Date;
  COLLEGE_START: Date;
  PHASE1_END: Date;
  PHASE2_START: Date;
  PHASE3_START: Date;
  TAPER_START: Date;
  EXAM_DATE: Date;
}

export interface ScheduleBlock {
  s: string;             // start "HH:MM"
  e: string;             // end   "HH:MM"
  t?: string;            // title
  d?: string;            // description
  c: 'cat' | 'tech' | 'health' | 'admin' | 'opt';
  dyn?: 'tech' | 'mock' | 'college';
  tool?: 'breath' | 'meditate';
}

export type ScheduleKey =
  | 'era1_weekday' | 'era1_saturday' | 'era1_sunday'
  | 'era2_weekday' | 'era2_saturday' | 'era2_sunday';

export type ScheduleMap = Record<ScheduleKey, ScheduleBlock[]>;

export interface ResolvedBlock {
  t: string;
  d: string;
}

export interface RightNowResult {
  today: Date;
  sched: ScheduleBlock[];
  idx: number;
  current: ScheduleBlock;
  resolved: ResolvedBlock;
  remain: number;
  elapsedPct: number;
  nextBlock: ScheduleBlock;
  nextDate: Date;
  accent: string;
  fmtRemain: string;
}

export interface PhaseStatus {
  phase: string;
  detail: string;
}

// ─── Supabase row shapes ─────────────────────────────────────

export interface Profile {
  id: string;
  name: string | null;
  exam_date: string;
  created_at: string;
}

export interface KVRow {
  id: string;
  user_id: string;
  key: string;
  value: unknown;
  updated_at: string;
}

export interface ErrorEntry {
  id?: string;
  user_id?: string;
  date: string;
  question: string;
  type: 'Missed' | 'Guessed Right';
  cause: 'Concept Gap' | 'Silly Mistake' | 'Timing';
  fix: string;
  section: 'VARC' | 'DILR' | 'QA' | 'General';
  topic?: string;
  mock_number?: number | null;
  created_at?: string;
}

export interface MockResult {
  id?: string;
  user_id?: string;
  date: string;
  mock_number?: number;
  mock_type: 'DashCAT' | 'Sectional' | 'PYP' | 'Other';
  section: 'VARC' | 'DILR' | 'QA' | 'Overall';
  score?: number;
  total_marks?: number;
  attempted?: number;
  correct?: number;
  incorrect?: number;
  net_score?: number;
  percentile?: number;
  time_taken?: number;
  notes?: string;
  created_at?: string;
}

export interface TopicProgress {
  id?: string;
  user_id?: string;
  section: 'VARC' | 'DILR' | 'QA';
  topic_name: string;
  status: 'Not Started' | 'In Progress' | 'Concept Done' | 'Practice Done' | 'Mastered';
  confidence?: number;
  updated_at?: string;
}

export interface DailyActivity {
  id?: string;
  user_id?: string;
  date: string;
  score: number;
}

export interface BoardCard {
  id?: string;
  user_id?: string;
  title: string;
  description?: string;
  column_id: 'focus_now' | 'today' | 'this_week' | 'backlog' | 'done';
  tags?: string[];
  impact: number;
  urgency: number;
  effort: number;
  position?: number;
  created_at?: string;
  updated_at?: string;
}

// ─── KV value shapes ─────────────────────────────────────────

export interface BreathLog {
  streak: number;
  total: number;
  lastDate: string;
}

export interface MeditateLog {
  streak: number;
  total: number;
  totalMinutes: number;
  lastDate: string;
}

export interface FocusSession {
  date: string;
  subject: string;
  durationMins: number;
}

export interface FocusLog {
  sessions: FocusSession[];
}

export interface ChecklistState {
  [id: string]: boolean;
}

// ─── Static data shapes ──────────────────────────────────────

export interface MapBar {
  label: string;
  left: number;
  width: number;
  type: string;
}

export interface PhaseCard {
  range: string;
  title: string;
  desc: string;
}

export interface CadenceItem {
  title: string;
  desc: string;
}

export interface HealthCard {
  title: string;
  desc: string;
}

export interface ContingencyItem {
  title: string;
  body: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
}

export interface BoardSeedCard {
  id: string;
  title: string;
  desc: string;
  column: 'focus' | 'today' | 'week' | 'backlog' | 'done';
  impact: number;
  urgency: number;
  effort: number;
  tags: string[];
}

export type BreathPhase = { l: string; s: number };
export interface BreathPattern {
  name: string;
  phases: BreathPhase[];
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
