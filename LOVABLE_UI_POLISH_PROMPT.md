# Lovable UI Prompt — HabitHabitat Visual Polish

> **Paste this entire prompt into Lovable. It is UI/design-only. Do NOT touch any logic, state, data, or routing.**

---

## Context

This is HabitHabitat — a personal productivity dashboard for a CAT 2026 aspirant. It has two dashboard modes toggled by `?scope=habit` and `?scope=cat`. The app is fully functional and deployed. You are only improving the visual design and layout quality. **Do not change any TypeScript logic, data fetching, state management, routing, or component structure.**

---

## Design Language to Follow

- **Color palette**: dark navy background (`#0f1117`), amber/orange accent (`oklch(0.72 0.18 55)`), teal accent (`oklch(0.62 0.2 155)`), coral/red for warnings. These are already in CSS variables — use them, don't add new colors.
- **Typography**: Space Grotesk for headings, Inter for body — already loaded from Google Fonts.
- **Card style**: `card-glass` class already exists — a dark glassmorphism card with subtle border and blur. Prefer this for all panels.
- **Animations**: Framer Motion is installed. Add subtle enter animations (`initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}`), hover lifts, and smooth transitions. No jarring or excessive motion.
- **Feel**: Premium, focused, cockpit-like. NOT playful. NOT colorful/pastel. Serious productivity tool with dark elegance.

---

## Specific UI Improvements to Make

### 1. Dashboard Home (`scope=habit` — main overview)
- **StatCards**: Make them taller, more spacious. Add a subtle gradient top-border in the card's accent color. The number should be large and prominent (2rem+). Add a small trend arrow (↑/↓) next to the stat.
- **WeeklyProgress bar chart**: Make the bars rounded (`border-radius: 8px`), give today's bar a glowing amber highlight effect.
- **TodaysHabits panel**: Add a completion ring/circle progress indicator at the top showing overall % done today. Make habit rows feel more premium — add a left accent border in the habit's color when completed.
- **Heatmap**: Cells should be more rounded (`border-radius: 6px`), slightly larger, with a smoother color gradient from empty → full completion.
- **Overall layout**: Add more breathing room between sections (`gap-8` instead of `gap-6`). Sections should feel distinct, not cramped.

### 2. Sidebar (both dashboards)
- **Active item**: Instead of just a background, add a left accent bar (3px wide, amber color) to the active nav item.
- **Hover state**: Smooth translate-x animation on hover (`transform: translateX(2px)`).
- **Collapsed state**: Icons should have a subtle glow on hover.
- **Level/XP widget** at the bottom: Make the XP bar gradient (amber → teal) with a smooth animated fill. Add the level number in a badge circle.

### 3. Daily Tracker (`scope=habit`, daily view)
- **Habit cards in the 2-column grid**: Add a thin left border in the habit's theme color. Completed habits should have a faint success green tint background. Incomplete ones stay neutral.
- **Progress bar at top**: Make it thicker (8px), gradient (amber → teal), with a subtle pulse animation when at 100%.
- **Date navigation**: The `<` and `>` buttons should have a subtle press effect on click.

### 4. Calendar View
- **Calendar grid cells**: Make them more rounded, add a soft hover shadow. Today's cell should have a glowing ring (not just a text color change).
- **Selected cell**: Add a smooth scale-up animation on selection (`transform: scale(1.05)`).
- **Legend**: Style the completion legend at the bottom as pill badges instead of plain text.

### 5. CAT Dashboard (`?scope=cat`)
- **Overview countdown**: The large countdown number should have a subtle animated number-roll effect on page load. Add a progress arc around the exam countdown.
- **Section cards**: Add section-specific accent colors — teal for Topic Tracker, amber for Weekly Board, coral for Error Log.
- **CAT sidebar**: Match the polish improvements from the habit sidebar above.

### 6. Auth Page (`/auth`)
- Center the form perfectly vertically and horizontally.
- Add the HabitHabitat logo/icon (use the bar chart SVG from the favicon concept: amber + teal bars on dark) above the form.
- The form card should use the `card-glass` style — dark, blurred, borderlit.
- Add a subtle animated gradient background (slow-moving aurora effect in very dark navy tones) behind the card.
- The submit button should have a gradient fill (amber → teal) with a hover glow.

### 7. Profile Modal
- The avatar circle should have a gradient ring border (amber → teal rotation).
- Add smooth slide-down animation for the dropdown.
- Edit mode fields should have a focus glow (border color transitions to amber on focus).

### 8. General Polish
- Add `scroll-behavior: smooth` globally.
- All buttons should have `transition: all 0.15s ease` if not already present.
- Loading/skeleton states: anywhere data might take a moment, add a shimmer skeleton placeholder instead of blank space.
- All modals/dialogs: enter with `scale(0.96) → scale(1)` + fade animation.

---

## Hard Rules — Do NOT Break These

1. **Never edit `src/lib/habits-store.ts`** — this is the core state machine. Touch nothing in it.
2. **Never edit `src/lib/scope.ts`** — scope filtering logic is correct.
3. **Never edit any file in `src/integrations/supabase/`** — auth and DB are correctly wired.
4. **Never edit `src/routes/`** files (routing logic).
5. **Never change component props or exports** — only change JSX structure and className strings inside components.
6. **Never remove `min-w-0` or `overflow-hidden`** from grid/habit card containers — these prevent overflow bugs.
7. **Never use hardcoded hex colors** — use the existing CSS variable tokens (`var(--color-brand)`, `var(--amber)`, etc.) or Tailwind's `oklch()` values that already exist in `styles.css`.
8. **Never change date formatting logic** — the `addDays()` function and ISO string builders use local time formatting deliberately (fixes a UTC timezone bug).
9. **After every change, confirm TypeScript compiles without errors** (`npx tsc --noEmit`).
10. **Commit each logical group of changes separately** with a `style:` prefix: e.g. `style: premium StatCards with gradient borders`.

---

## Files Safe to Edit (visual/CSS only)

- `src/styles.css` — global CSS tokens and utilities
- `src/components/cat-dashboard/cat-styles.css` — CAT-specific styles
- Any `.tsx` component file in `src/components/dashboard/` or `src/components/cat-dashboard/` — but **only the JSX className strings and layout structure**, not the TypeScript logic inside.

---

## Reference: Current Color Tokens (in `src/styles.css`)

```css
--color-brand        /* primary teal/amber brand color */
--color-success      /* green for completions */
--color-warning      /* amber/yellow for in-progress */
--color-danger       /* red/coral for breaks/limits */
--amber              /* warm amber accent */
--teal               /* cool teal accent */
--lav                /* lavender accent */
--coral              /* coral/salmon accent */
```

Use `color-mix(in oklab, var(--amber) 20%, transparent)` for subtle tinted backgrounds.

---

*This is a pure UI polish pass. Every function, hook, and data flow must remain exactly as it is.*
