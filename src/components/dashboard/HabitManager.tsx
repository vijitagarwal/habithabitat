import * as Icons from "lucide-react";
import { useState } from "react";
import {
  useHabits, addHabit, updateHabit, deleteHabit, resetAll, clearHistory,
  CATEGORIES, ICON_CHOICES, COLOR_CHOICES, scheduleLabel,
  type Habit, type HabitCategory, type HabitDirection, type Schedule,
} from "@/lib/habits-store";
import { Plus, Pencil, Trash2, Check, X, TrendingUp, TrendingDown } from "lucide-react";
import { ScheduleEditor } from "./ScheduleEditor";

type Draft = {
  name: string;
  icon: string;
  category: HabitCategory;
  color: string;
  direction: HabitDirection;
  unit: string;
  benchmarks: number[];
  schedule: Schedule;
};

const emptyDraft: Draft = {
  name: "", icon: "Sparkles", category: "Health", color: "brand",
  direction: "build", unit: "", benchmarks: [],
  schedule: { type: "daily" },
};

function IconPreview({ name, color }: { name: string; color: string }) {
  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] ?? Icons.CheckCircle2;
  return (
    <span
      className="grid h-9 w-9 place-items-center rounded-lg"
      style={{ backgroundColor: `color-mix(in oklab, var(--color-${color}) 20%, transparent)` }}
    >
      <Icon className="h-4.5 w-4.5" />
    </span>
  );
}

function BenchmarkEditor({ value, unit, onChange }: { value: number[]; unit: string; onChange: (v: number[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const n = parseFloat(draft);
    if (!isFinite(n) || n <= 0) return;
    const next = Array.from(new Set([...value, n])).sort((a, b) => a - b);
    onChange(next);
    setDraft("");
  };
  const remove = (n: number) => onChange(value.filter((x) => x !== n));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        {value.length === 0 && (
          <span className="text-[11px] text-muted-foreground">No benchmarks — habit will act as a simple check-off.</span>
        )}
        {value.map((n) => (
          <span key={n} className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
            {n}{unit}
            <button type="button" onClick={() => remove(n)} className="opacity-70 hover:opacity-100"><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="number" inputMode="decimal" step="any" min={0}
          value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={`e.g. 1${unit || ""}`}
          className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button type="button" onClick={add} className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:border-primary/40">Add</button>
      </div>
    </div>
  );
}

function DraftForm({ initial, onSubmit, onCancel, submitLabel }: {
  initial: Draft; onSubmit: (d: Draft) => void; onCancel: () => void; submitLabel: string;
}) {
  const [d, setD] = useState<Draft>(initial);
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-xs">
          <div className="mb-1 text-muted-foreground">Name</div>
          <input
            value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })}
            placeholder="e.g. Meditate 10 min"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="text-xs">
          <div className="mb-1 text-muted-foreground">Category</div>
          <select
            value={d.category} onChange={(e) => setD({ ...d, category: e.target.value as HabitCategory })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>

        <div className="text-xs sm:col-span-2">
          <div className="mb-1 text-muted-foreground">Type</div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setD({ ...d, direction: "build" })}
              className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition ${d.direction === "build" ? "border-success bg-success/10" : "border-border bg-background hover:border-primary/40"}`}>
              <TrendingUp className="h-4 w-4 text-success" />
              <div>
                <div className="text-xs font-semibold">Build up</div>
                <div className="text-[10px] text-muted-foreground">Grows toward top benchmark (e.g. water)</div>
              </div>
            </button>
            <button type="button" onClick={() => setD({ ...d, direction: "break" })}
              className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition ${d.direction === "break" ? "border-danger bg-danger/10" : "border-border bg-background hover:border-primary/40"}`}>
              <TrendingDown className="h-4 w-4 text-danger" />
              <div>
                <div className="text-xs font-semibold">Break / limit</div>
                <div className="text-[10px] text-muted-foreground">Stays under the limit (e.g. sugar)</div>
              </div>
            </button>
          </div>
        </div>

        <label className="text-xs">
          <div className="mb-1 text-muted-foreground">Unit (optional)</div>
          <input
            value={d.unit} onChange={(e) => setD({ ...d, unit: e.target.value })}
            placeholder="L, g, hrs, pages…"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        <div className="text-xs sm:col-span-2">
          <div className="mb-1 text-muted-foreground">Benchmarks (leave empty for simple check-off habit)</div>
          <BenchmarkEditor value={d.benchmarks} unit={d.unit} onChange={(v) => setD({ ...d, benchmarks: v })} />
        </div>

        <div className="text-xs sm:col-span-2">
          <div className="mb-1 text-muted-foreground">Schedule</div>
          <ScheduleEditor value={d.schedule} onChange={(s) => setD({ ...d, schedule: s })} />
        </div>

        <label className="text-xs sm:col-span-2">
          <div className="mb-1 text-muted-foreground">Icon</div>
          <div className="flex flex-wrap gap-1.5">
            {ICON_CHOICES.map((n) => {
              const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[n] ?? Icons.CheckCircle2;
              return (
                <button
                  key={n} type="button" onClick={() => setD({ ...d, icon: n })}
                  className={`grid h-8 w-8 place-items-center rounded-lg border ${d.icon === n ? "border-primary bg-primary/15 text-primary" : "border-border bg-background hover:border-primary/40"}`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </label>
        <label className="text-xs sm:col-span-2">
          <div className="mb-1 text-muted-foreground">Color</div>
          <div className="flex flex-wrap gap-2">
            {COLOR_CHOICES.map((c) => (
              <button
                key={c} type="button" onClick={() => setD({ ...d, color: c })}
                className={`h-7 w-7 rounded-full border-2 ${d.color === c ? "border-white" : "border-transparent"}`}
                style={{ backgroundColor: `var(--color-${c})` }}
                title={c}
              />
            ))}
          </div>
        </label>
      </div>
      <div className="mt-4 flex items-center justify-end gap-2">
        <button onClick={onCancel} className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-primary/40">
          <span className="inline-flex items-center gap-1"><X className="h-3.5 w-3.5" /> Cancel</span>
        </button>
        <button
          onClick={() => d.name.trim() && onSubmit(d)}
          className="rounded-lg gradient-brand px-3 py-1.5 text-xs font-semibold text-white shadow disabled:opacity-50"
          disabled={!d.name.trim()}
        >
          <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5" /> {submitLabel}</span>
        </button>
      </div>
    </div>
  );
}

function toDraft(h: Habit): Draft {
  return {
    name: h.name, icon: h.icon, category: h.category, color: h.color,
    direction: h.direction ?? "build",
    unit: h.unit ?? "",
    benchmarks: h.benchmarks ?? [],
    schedule: h.schedule ?? { type: "daily" },
  };
}

function fromDraft(d: Draft): Omit<Habit, "id" | "createdAt"> {
  const hasBenchmarks = d.benchmarks.length > 0;
  return {
    name: d.name.trim(), icon: d.icon, category: d.category, color: d.color,
    schedule: d.schedule,
    ...(hasBenchmarks ? { direction: d.direction, unit: d.unit.trim(), benchmarks: [...d.benchmarks].sort((a, b) => a - b) } : {}),
  };
}

export function HabitManager() {
  const s = useHabits();
  const scope = useScope();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const visibleHabits = filterHabitsByScope(s.habits, scope);
  // In CAT scope, new habits default to the "CAT Prep" category.
  const initialDraft = scope === "cat" ? { ...emptyDraft, category: "CAT Prep" as HabitCategory } : emptyDraft;

  return (
    <div className="space-y-6">
      <div className="card-glass rounded-2xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Your Habits</h3>
            <p className="text-xs text-muted-foreground">Set benchmarks, unit, direction, and when the habit is active.</p>
          </div>
          {!adding && (
            <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-lg gradient-brand px-3 py-2 text-xs font-semibold text-white shadow">
              <Plus className="h-4 w-4" /> Add Habit
            </button>
          )}
        </div>

        {adding && (
          <div className="mb-4">
            <DraftForm
              initial={emptyDraft}
              submitLabel="Create"
              onCancel={() => setAdding(false)}
              onSubmit={(d) => { addHabit(fromDraft(d)); setAdding(false); }}
            />
          </div>
        )}

        <ul className="space-y-2">
          {s.habits.length === 0 && !adding && (
            <li className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No habits yet. Click "Add Habit" to start from scratch.
            </li>
          )}
          {s.habits.map((h: Habit) => (
            <li key={h.id} className="rounded-xl border border-border bg-background/30 p-3">
              {editingId === h.id ? (
                <DraftForm
                  initial={toDraft(h)}
                  submitLabel="Save"
                  onCancel={() => setEditingId(null)}
                  onSubmit={(d) => { updateHabit(h.id, fromDraft(d)); setEditingId(null); }}
                />
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <IconPreview name={h.icon} color={h.color} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{h.name}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="rounded-full border border-border px-1.5 py-0.5">{h.category}</span>
                        <span className="rounded-full border border-border px-1.5 py-0.5">{scheduleLabel(h)}</span>
                        {h.benchmarks && h.benchmarks.length > 0 && (
                          <span className={`rounded-full border px-1.5 py-0.5 ${h.direction === "break" ? "border-danger/40 text-danger" : "border-success/40 text-success"}`}>
                            {h.direction === "break" ? "Limit" : "Goal"} {Math.max(...h.benchmarks)}{h.unit ?? ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => setEditingId(h.id)} className="rounded-lg border border-border bg-background p-2 hover:border-primary/40" title="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {confirmDelete === h.id ? (
                      <>
                        <button onClick={() => { deleteHabit(h.id); setConfirmDelete(null); }} className="rounded-lg bg-destructive/90 px-2 py-1.5 text-[11px] font-semibold text-white">Delete</button>
                        <button onClick={() => setConfirmDelete(null)} className="rounded-lg border border-border bg-background px-2 py-1.5 text-[11px]">Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => setConfirmDelete(h.id)} className="rounded-lg border border-border bg-background p-2 text-destructive hover:border-destructive/60" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="card-glass rounded-2xl p-6">
        <h3 className="mb-1 text-lg font-semibold">Reset Data</h3>
        <p className="mb-4 text-xs text-muted-foreground">Start fresh. This clears data from your device.</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { if (confirm("Clear all completions, journal notes, and metrics? Your habits will be kept.")) clearHistory(); }}
            className="rounded-lg border border-warning/60 bg-warning/10 px-3 py-2 text-xs font-semibold text-warning hover:bg-warning/20"
          >
            Clear History Only
          </button>
          <button
            onClick={() => { if (confirm("Clear all habits and history? This cannot be undone.")) resetAll("empty"); }}
            className="rounded-lg border border-destructive/60 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20"
          >
            Clear Everything
          </button>
          <button
            onClick={() => { if (confirm("Restore the sample habits and demo data?")) resetAll("seed"); }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold hover:border-primary/40"
          >
            Restore Demo Data
          </button>
        </div>
      </div>
    </div>
  );
}
