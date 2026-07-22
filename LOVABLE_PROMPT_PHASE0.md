# Lovable Prompt — Phase 0 Fixes

## Copy and paste this entire prompt into Lovable for the bright-habit-view project:

---

I need you to make several important fixes before I export and deploy this project independently. These are critical for making the app work properly without Lovable's platform infrastructure:

### Fix 1 — CAT Scope Progress Bar Bug (CRITICAL)
In CAT Prep scope (?scope=cat), StatCards, WeeklyProgress, CategoryBreakdown, TopHabits, and QuickStats currently show stats for ALL habits. They must only compute stats for habits where `category === "CAT Prep"`.

The `filterHabitsByScope` function in `src/lib/scope.ts` already exists — it needs to be applied before computing aggregates in those components. When scope === "cat", pass only CAT Prep habits to `overallProgress`, `currentStreak`, `weeklyProgress`, `categoryBreakdown`, `topHabits`, etc.

### Fix 2 — Remove Lovable Auth Dependency (CRITICAL)
In `src/routes/auth.tsx`, the Google sign-in currently uses:
```ts
import { lovable } from "@/integrations/lovable";
await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
```

Replace this with the bare Supabase call:
```ts
await supabase.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo: window.location.origin + "/dashboard" },
});
```

Then remove the `@lovable.dev/cloud-auth-js` package from package.json entirely, and delete `src/integrations/lovable/` directory.

### Fix 3 — Add Magic Link Option
In `src/routes/auth.tsx`, add a third auth tab called "Magic link" alongside "Sign in" and "Create account":
```ts
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: { emailRedirectTo: window.location.origin },
});
```
When selected, show only the email field (no password). On success, show: "✅ Magic link sent! Check your inbox."

### Fix 4 — Supabase Client: detectSessionInUrl + implicit flow
In `src/integrations/supabase/client.ts`, update the auth config:
```ts
auth: {
  storage: typeof window !== 'undefined' ? localStorage : undefined,
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,   // needed for magic link
  flowType: 'implicit',       // prevents PKCE full-page reload bug
}
```

### Fix 5 — Migrate Habits Store to Supabase (IMPORTANT for sync)
The `src/lib/habits-store.ts` currently uses localStorage only. Migrate it to use the Supabase `items` and `completions` tables as the primary data source, with localStorage as a read cache.

Pattern:
- On `setStoreUser(uid)`: fetch all habits from `items` table WHERE user_id = uid AND archived = false
- On `setStoreUser(uid)`: fetch all completions from `completions` table WHERE user_id = uid
- On `addHabit`: insert into `items` table
- On `updateHabit`: update `items` table
- On `deleteHabit`: set `archived = true` in `items` table (soft delete)
- On `toggleHabit`: upsert into `completions` table (done = true/false)
- On `setHabitValue`: upsert into `completions` table (value = number)
- Subscribe to realtime changes on `items` and `completions` tables → reload state on change

Keep localStorage as a write-through cache so offline still works. The `items` table schema:
- id, user_id, name, category, kind, direction, unit, benchmarks (numeric[]), schedule (jsonb), priority, icon, color, archived, created_at, updated_at

The `completions` table schema:
- id, user_id, item_id (FK to items.id), date, done, value, created_at, updated_at
- UNIQUE (user_id, item_id, date)

Please commit all these changes and push to the GitHub repository.

---

## Note for reference:
After Lovable makes these changes, I will:
1. git pull in the bright-habit-view folder
2. Switch .env to the CAT Supabase project (umjrxaczrmcstwajtumh)
3. Run the SQL migration in Supabase to add the habit tables
4. Test the unified dashboard locally
