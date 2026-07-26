import type {
  MapBar,
  PhaseCard,
  CadenceItem,
  HealthCard,
  ContingencyItem,
  ChecklistItem,
  BoardSeedCard,
  BreathPattern,
} from "../types";

export const MAP_BARS: MapBar[] = [
  { label: "CAT course", left: 0, width: 100, type: "cat" },
  { label: "CAT mocks", left: 67.3, width: 32.7, type: "cat" },
  { label: "FlyRank", left: 1.3, width: 27.5, type: "tech" },
  { label: "College", left: 22.9, width: 77.1, type: "admin" },
  { label: "Registration", left: 21.6, width: 32.6, type: "admin" },
];

export const PHASE_CARDS: PhaseCard[] = [
  {
    range: "Jun 29 - Aug 14",
    title: "Phase 1 - The Crunch",
    desc: "FlyRank + a brand-new course, college lands mid-way. The hardest stretch and shortest by design.",
  },
  {
    range: "Aug 15 - Sep 30",
    title: "Phase 2 - The Build",
    desc: "FlyRank done. Real tech-growth window. CAT shifts to sectional-heavy practice. Register for CAT here.",
  },
  {
    range: "Oct 1 - Nov 29",
    title: "Phase 3 - The Mock Grind",
    desc: "25 full mocks, 45 sectionals. Tech drops to DSA floor only. Nothing new starts.",
  },
];

export const CADENCE: CadenceItem[] = [
  {
    title: "AUG - SEP",
    desc: "Sectionals as topics close, plus 2-3 early diagnostic full mocks in late September.",
  },
  { title: "OCTOBER", desc: "Ramp to 1 full mock/week. Sectionals fill weak spots." },
  { title: "EARLY-MID NOV", desc: "2 full mocks/week." },
  { title: "LAST 10-12 DAYS", desc: "No new mocks. Pure error-log + weak-topic revision only." },
];

export const HEALTH_CARDS: HealthCard[] = [
  {
    title: "SLEEP",
    desc: "7-7.5 hrs with fixed wake time daily, including weekends. No screens 20-30 min pre-sleep.",
  },
  { title: "CAFFEINE", desc: "Cutoff around 6-7 PM. Late caffeine steals sleep quality." },
  { title: "MOVEMENT", desc: "20-30 min daily minimum. Consistency beats intensity." },
  { title: "EYES", desc: "20-20-20 rule because total screen load is high." },
  { title: "FOOD", desc: "Regular meal timing matters more than optimization." },
  { title: "HYDRATION", desc: "Water always in reach during college and study blocks." },
  { title: "PEOPLE", desc: "Minimal regular contact with family + one friend weekly." },
  { title: "RESET", desc: "Use breathwork for 2-minute mid-day reset." },
  {
    title: "GUT-CHECK",
    desc: "Monthly check: sustainably tired or burnt out. Cut optional add-ons first.",
  },
];

export const CONTINGENCIES: ContingencyItem[] = [
  {
    title: "Missed a day - sick, family, anything",
    body: "Do not double up tomorrow. Resume schedule as-is. Use Sunday review to reallocate one critical missed item.",
  },
  {
    title: "FlyRank slips behind",
    body: "It is unpaid and self-paced. Ship functional over polished. CAT does not bend.",
  },
  {
    title: "College exam lands in Oct/Nov",
    body: "Treat it as fixed. Borrow from optional add-on or DSA that week, never CAT floor or sleep floor.",
  },
  {
    title: "Buffer week in mid-September",
    body: "No new commitments. Close backlog before Phase 3 starts.",
  },
];

export const STANDING_ORDERS: string[] = [
  "DSA never goes to zero. One problem daily, even in the worst week.",
  "No new commitments through Phase 1 or Phase 3.",
  "Sleep and movement are floors. Cut other things first.",
  "One protected leisure block every week.",
  "Sunday 15-20 min review: scan error log and adjust next week.",
];

export const CHECKLIST: ChecklistItem[] = [
  { id: "t1", text: "Finish the embeddings ramp-up reading today - FlyRank starts Jul 1." },
  { id: "t2", text: "Set up error-log notebook before first live class on the 29th." },
  { id: "t3", text: "If laptop purchase is pending, close it this week." },
  { id: "t4", text: "Lock fixed wake time now before grind starts." },
  { id: "t5", text: "If trying vocab habit, queue app/articles today." },
];

export const WEEKLY_BOARD_SEED: BoardSeedCard[] = [
  {
    id: "board-flyrank",
    title: "FlyRank deliverable",
    desc: "Close remaining embeddings work and ship the portfolio-visible output.",
    column: "focus",
    impact: 5,
    urgency: 5,
    effort: 4,
    tags: ["Tech", "High leverage"],
  },
  {
    id: "board-cat-daily",
    title: "CAT daily target",
    desc: "Complete the daily target and log the miss patterns immediately after.",
    column: "today",
    impact: 5,
    urgency: 5,
    effort: 3,
    tags: ["CAT", "Non-negotiable"],
  },
  {
    id: "board-dsa",
    title: "DSA one-problem streak",
    desc: "One attempt-first problem to keep tech credibility alive.",
    column: "today",
    impact: 4,
    urgency: 5,
    effort: 2,
    tags: ["DSA", "Daily"],
  },
  {
    id: "board-log",
    title: "Error log review",
    desc: "Scan repeating mistakes and write the one-line fix.",
    column: "week",
    impact: 5,
    urgency: 4,
    effort: 2,
    tags: ["Review", "System"],
  },
  {
    id: "board-study",
    title: "Sectional practice block",
    desc: "Timed practice tied to the current weak topic list.",
    column: "week",
    impact: 5,
    urgency: 4,
    effort: 3,
    tags: ["CAT", "Practice"],
  },
  {
    id: "board-reset",
    title: "Breathwork or meditation reset",
    desc: "Protect one recovery block so the system does not decay.",
    column: "backlog",
    impact: 3,
    urgency: 3,
    effort: 1,
    tags: ["Health", "Recovery"],
  },
  {
    id: "board-weekly-review",
    title: "Sunday weekly review",
    desc: "Audit the week, re-rank the board, and reset the plan.",
    column: "backlog",
    impact: 4,
    urgency: 3,
    effort: 2,
    tags: ["Planning", "Weekly"],
  },
  {
    id: "board-done-sample",
    title: "College admin resolved",
    desc: "Sample completed item to show the done lane and archived work.",
    column: "done",
    impact: 2,
    urgency: 1,
    effort: 1,
    tags: ["Done"],
  },
];

export const BREATH_PATTERNS: Record<string, BreathPattern> = {
  box: {
    name: "Box (4-4-4-4)",
    phases: [
      { l: "Inhale", s: 4 },
      { l: "Hold", s: 4 },
      { l: "Exhale", s: 4 },
      { l: "Hold", s: 4 },
    ],
  },
  relax: {
    name: "4-7-8 Relax",
    phases: [
      { l: "Inhale", s: 4 },
      { l: "Hold", s: 7 },
      { l: "Exhale", s: 8 },
    ],
  },
  coherent: {
    name: "Coherent (5-5)",
    phases: [
      { l: "Inhale", s: 5 },
      { l: "Exhale", s: 5 },
    ],
  },
};

export const BREATH_ROUNDS = [4, 8, 12];
export const MED_DURATIONS = [3, 5, 10, 15];

export const MED_GUIDANCE = [
  "Notice your breath, without changing it.",
  "Soften your shoulders and your jaw.",
  "Let thoughts pass — you do not have to follow them.",
  "Feel contact points and settle your posture.",
  "Return gently to the breath.",
];

export const TECH_LADDER = [
  {
    phase: "Pre Jul 1",
    label: "Embeddings Ramp-Up",
    desc: "Complete the embeddings reading and concept gap survey before FlyRank day-one.",
  },
  {
    phase: "Jul 1 – Aug 2",
    label: "FlyRank Deep Work",
    desc: "Build the core product: embeddings, clustering, intent classification. Ship weekly.",
  },
  {
    phase: "Aug 3 – Aug 14",
    label: "FlyRank Wrap-Up",
    desc: "Finish all deliverables and produce a portfolio-ready case study.",
  },
  {
    phase: "Aug 15 – Sep 30",
    label: "Portfolio Build",
    desc: "Convert FlyRank output to a public artifact. No new projects — solidify what exists.",
  },
  {
    phase: "Oct 1 – Nov 29",
    label: "DSA Floor Only",
    desc: "One problem per day, no exceptions. Keep the streak alive. Nothing new starts.",
  },
];
