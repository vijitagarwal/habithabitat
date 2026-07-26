import type { DateConfig } from "../types";

const D = (y: number, m: number, d: number): Date => new Date(y, m, d);

export const DATE_CFG: DateConfig = {
  CAMPAIGN_START: D(2026, 5, 29), // Jun 29
  JUL1: D(2026, 6, 1), // Jul 1
  COLLEGE_START: D(2026, 7, 3), // Aug 3
  PHASE1_END: D(2026, 7, 14), // Aug 14
  PHASE2_START: D(2026, 7, 15), // Aug 15
  PHASE3_START: D(2026, 9, 1), // Oct 1
  TAPER_START: D(2026, 10, 17), // Nov 17
  EXAM_DATE: D(2026, 10, 29), // Nov 29
};

export const TOTAL_DAYS = 154;
export const CAMPAIGN_LABEL = "CAT 2026 — IIM Indore";
export const EXAM_DISPLAY = "Nov 29, 2026";

// Registration banner window
export const REG_START: Date = D(2026, 7, 1); // Aug 1
export const REG_END: Date = D(2026, 8, 20); // Sep 20
export const REG_URGENT: Date = D(2026, 8, 13); // Sep 13 (7 days before)
