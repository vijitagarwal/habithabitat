import type { TopicProgress } from "../types";

type TopicSeed = Omit<TopicProgress, "id" | "user_id" | "updated_at">;

export const DEFAULT_TOPICS: TopicSeed[] = [
  // ── QA (24 topics) ────────────────────────────────────────
  { section: "QA", topic_name: "Percentages", status: "Not Started" },
  { section: "QA", topic_name: "Profit & Loss", status: "Not Started" },
  { section: "QA", topic_name: "Simple & Compound Interest", status: "Not Started" },
  { section: "QA", topic_name: "Time-Speed-Distance", status: "Not Started" },
  { section: "QA", topic_name: "Time & Work", status: "Not Started" },
  { section: "QA", topic_name: "Ratio & Proportion", status: "Not Started" },
  { section: "QA", topic_name: "Averages & Mixtures", status: "Not Started" },
  { section: "QA", topic_name: "Number Systems", status: "Not Started" },
  { section: "QA", topic_name: "Linear Equations", status: "Not Started" },
  { section: "QA", topic_name: "Quadratic Equations", status: "Not Started" },
  { section: "QA", topic_name: "Inequalities", status: "Not Started" },
  { section: "QA", topic_name: "Functions & Graphs", status: "Not Started" },
  { section: "QA", topic_name: "Progressions", status: "Not Started" },
  { section: "QA", topic_name: "Permutation & Combination", status: "Not Started" },
  { section: "QA", topic_name: "Probability", status: "Not Started" },
  { section: "QA", topic_name: "Set Theory", status: "Not Started" },
  { section: "QA", topic_name: "Geometry (Lines & Angles)", status: "Not Started" },
  { section: "QA", topic_name: "Geometry (Triangles)", status: "Not Started" },
  { section: "QA", topic_name: "Geometry (Circles)", status: "Not Started" },
  { section: "QA", topic_name: "Mensuration (2D)", status: "Not Started" },
  { section: "QA", topic_name: "Mensuration (3D)", status: "Not Started" },
  { section: "QA", topic_name: "Coordinate Geometry", status: "Not Started" },
  { section: "QA", topic_name: "Logarithms", status: "Not Started" },
  { section: "QA", topic_name: "Surds & Indices", status: "Not Started" },

  // ── DILR (14 topics) ───────────────────────────────────────
  { section: "DILR", topic_name: "Linear Arrangements", status: "Not Started" },
  { section: "DILR", topic_name: "Circular Arrangements", status: "Not Started" },
  { section: "DILR", topic_name: "Matrix Arrangements", status: "Not Started" },
  { section: "DILR", topic_name: "Scheduling", status: "Not Started" },
  { section: "DILR", topic_name: "Binary Logic", status: "Not Started" },
  { section: "DILR", topic_name: "Venn Diagrams", status: "Not Started" },
  { section: "DILR", topic_name: "Networks & Routes", status: "Not Started" },
  { section: "DILR", topic_name: "Data Tables", status: "Not Started" },
  { section: "DILR", topic_name: "Bar Charts", status: "Not Started" },
  { section: "DILR", topic_name: "Line Graphs", status: "Not Started" },
  { section: "DILR", topic_name: "Pie Charts", status: "Not Started" },
  { section: "DILR", topic_name: "Mixed Charts", status: "Not Started" },
  { section: "DILR", topic_name: "Caselets", status: "Not Started" },
  { section: "DILR", topic_name: "Games & Tournaments", status: "Not Started" },

  // ── VARC (8 topics) ───────────────────────────────────────
  { section: "VARC", topic_name: "RC - Science & Technology", status: "Not Started" },
  { section: "VARC", topic_name: "RC - Business & Economics", status: "Not Started" },
  { section: "VARC", topic_name: "RC - History & Philosophy", status: "Not Started" },
  { section: "VARC", topic_name: "RC - Social & Culture", status: "Not Started" },
  { section: "VARC", topic_name: "Para Jumbles", status: "Not Started" },
  { section: "VARC", topic_name: "Para Summary", status: "Not Started" },
  { section: "VARC", topic_name: "Odd Sentence Out", status: "Not Started" },
  { section: "VARC", topic_name: "Critical Reasoning", status: "Not Started" },
];

export const STATUS_ORDER: TopicProgress["status"][] = [
  "Not Started",
  "In Progress",
  "Concept Done",
  "Practice Done",
  "Mastered",
];

export function nextStatus(current: TopicProgress["status"]): TopicProgress["status"] {
  const idx = STATUS_ORDER.indexOf(current);
  return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
}

export const STATUS_COLORS: Record<TopicProgress["status"], string> = {
  "Not Started": "#5A6478",
  "In Progress": "#3FAFA8",
  "Concept Done": "#9C90C4",
  "Practice Done": "#E8A23D",
  Mastered: "#22c55e",
};
