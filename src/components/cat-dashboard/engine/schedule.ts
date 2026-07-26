// ─────────────────────────────────────────────────────────────
// Schedule Engine — exact TypeScript port of schedule.js
// Accepts DATE_CFG as parameter (not global) for multi-user readiness
// ─────────────────────────────────────────────────────────────
import type {
  DateConfig,
  ScheduleBlock,
  ScheduleKey,
  ResolvedBlock,
  RightNowResult,
  PhaseStatus,
} from "../types";
import { SCHEDULES } from "../data/schedules";

export const BLOCK_COLORS: Record<string, string> = {
  cat: "#E8A23D", // amber
  tech: "#3FAFA8", // teal
  health: "#9C90C4", // lav
  admin: "#6B7A8D", // slate
  opt: "#6B7A8D", // slate
};

// ── Utilities ────────────────────────────────────────────────

export function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function fmtRemain(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m left`;
  return `${h}h ${m}m left`;
}

export function dateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// ── Dynamic block resolution ──────────────────────────────────

function getTechContent(d: Date, cfg: DateConfig): ResolvedBlock {
  const { JUL1, COLLEGE_START, PHASE1_END, PHASE3_START } = cfg;
  if (d < JUL1)
    return { t: "Embeddings Ramp-Up", d: "Final prep before FlyRank starts. Close the gap now." };
  if (d < COLLEGE_START)
    return {
      t: "FlyRank - Deep Work",
      d: "Embeddings, clustering, intent classification in your sharpest hours.",
    };
  if (d <= PHASE1_END)
    return { t: "FlyRank - Wrap Up", d: "Finish deliverables and ship functional outputs." };
  if (d < PHASE3_START)
    return {
      t: "Portfolio Build",
      d: "Convert FlyRank work into visible artifact. Do not start fresh.",
    };
  return { t: "DSA Floor Only", d: "Nothing new starts. Keep daily streak alive." };
}

function getMockContent(d: Date, cfg: DateConfig): ResolvedBlock {
  const { PHASE3_START, TAPER_START } = cfg;
  if (d < PHASE3_START)
    return { t: "CAT Sectional Practice", d: "Topic-wise sectionals with strict timing." };
  if (d < TAPER_START)
    return { t: "CAT Full Mock", d: "Ramp to 1 per week, then 2 per week by November." };
  return { t: "Revision Only - No New Mocks", d: "Use error log and weak-topic review only." };
}

function getCollegeContent(d: Date, cfg: DateConfig): ResolvedBlock {
  let desc = "9:30 to 4:30 fixed. Use lecture/lunch gaps for DSA. Vocab if longer gap appears.";
  if (d <= cfg.PHASE1_END) desc += " During overlap window, close FlyRank fragments in gaps only.";
  return { t: "College", d: desc };
}

export function resolveBlock(block: ScheduleBlock, date: Date, cfg: DateConfig): ResolvedBlock {
  if (block.dyn === "tech") return getTechContent(date, cfg);
  if (block.dyn === "mock") return getMockContent(date, cfg);
  if (block.dyn === "college") return getCollegeContent(date, cfg);
  return { t: block.t || "", d: block.d || "" };
}

// ── Schedule selection ────────────────────────────────────────

export function getDayType(d: Date): "weekday" | "saturday" | "sunday" {
  const day = d.getDay();
  if (day === 0) return "sunday";
  if (day === 6) return "saturday";
  return "weekday";
}

export function getEra(d: Date, cfg: DateConfig): 1 | 2 {
  return d < cfg.COLLEGE_START ? 1 : 2;
}

export function getScheduleFor(d: Date, cfg: DateConfig): ScheduleBlock[] {
  const key = `era${getEra(d, cfg)}_${getDayType(d)}` as ScheduleKey;
  return SCHEDULES[key] || [];
}

// ── Core engine ───────────────────────────────────────────────

function blockDuration(b: ScheduleBlock): number {
  const sm = toMin(b.s),
    em = toMin(b.e);
  return em <= sm ? 1440 - sm + em : em - sm;
}

function findCurrentIdx(sched: ScheduleBlock[], nowMin: number): number {
  for (let i = 0; i < sched.length; i++) {
    const sm = toMin(sched[i].s),
      em = toMin(sched[i].e);
    const wrap = em <= sm;
    if (wrap ? nowMin >= sm || nowMin < em : nowMin >= sm && nowMin < em) return i;
  }
  return 0;
}

function minsRemaining(b: ScheduleBlock, nowMin: number): number {
  const sm = toMin(b.s),
    em = toMin(b.e);
  const wrap = em <= sm;
  if (wrap && nowMin >= sm) return 1440 - nowMin + em;
  return em - nowMin;
}

export function getStatus(today: Date, cfg: DateConfig): PhaseStatus {
  const { CAMPAIGN_START, EXAM_DATE, PHASE1_END, COLLEGE_START, PHASE3_START, TAPER_START } = cfg;
  if (today < CAMPAIGN_START) return { phase: "Pre-launch", detail: "Campaign begins Jun 29" };
  if (today > EXAM_DATE) return { phase: "Post-exam", detail: "Campaign complete" };
  if (today <= PHASE1_END) {
    return {
      phase: "Phase 1 - The Crunch",
      detail: today < COLLEGE_START ? "Era 1 no-college overlap" : "Era 2 overlap begins",
    };
  }
  if (today < PHASE3_START)
    return { phase: "Phase 2 - The Build", detail: "Sectionals + registration window" };
  if (today < TAPER_START)
    return { phase: "Phase 3 - The Mock Grind", detail: "Mock season active" };
  return { phase: "Phase 3 - The Mock Grind", detail: "Final taper, no new mocks" };
}

export function computeRightNow(cfg: DateConfig, now: Date = new Date()): RightNowResult | null {
  const today = dateOnly(now);
  const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const sched = getScheduleFor(today, cfg);
  if (!sched.length) return null;

  const idx = findCurrentIdx(sched, nowMin);
  const current = sched[idx];
  const resolved = resolveBlock(current, today, cfg);
  const remain = minsRemaining(current, nowMin);
  const dur = blockDuration(current);
  const elapsedPct = Math.max(0, Math.min(100, ((dur - remain) / dur) * 100));

  let nextBlock: ScheduleBlock, nextDate: Date;
  if (idx + 1 < sched.length) {
    nextBlock = sched[idx + 1];
    nextDate = today;
  } else {
    nextDate = addDays(today, 1);
    nextBlock = getScheduleFor(nextDate, cfg)[0];
  }

  return {
    today,
    sched,
    idx,
    current,
    resolved,
    remain,
    elapsedPct,
    nextBlock,
    nextDate,
    accent: BLOCK_COLORS[current.c] || "#6B7A8D",
    fmtRemain: fmtRemain(remain),
  };
}

// ── Campaign progress ─────────────────────────────────────────

export function getCampaignProgress(
  cfg: DateConfig,
  now: Date = new Date(),
): {
  dayNum: number;
  totalDays: number;
  pct: number;
} {
  const today = dateOnly(now);
  const start = cfg.CAMPAIGN_START;
  const end = cfg.EXAM_DATE;
  const totalMs = end.getTime() - start.getTime();
  const elapsed = today.getTime() - start.getTime();
  const totalDays = Math.round(totalMs / 86400000) + 1;
  let dayNum = Math.floor(elapsed / 86400000) + 1;
  if (dayNum < 1) dayNum = 0;
  if (dayNum > totalDays) dayNum = totalDays;
  const pct = Math.max(0, Math.min(100, (elapsed / totalMs) * 100));
  return { dayNum, totalDays, pct };
}
