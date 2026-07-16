import { useEffect, useState } from "react";
import { useHabits, setNote, todayISO } from "@/lib/habits-store";
import { DatePicker } from "./DatePicker";

export function JournalView() {
  const s = useHabits();
  const [date, setDate] = useState(todayISO());
  const [text, setText] = useState("");
  useEffect(() => { setText(s.notes[date] ?? ""); }, [date, s.notes]);

  const recent = Object.entries(s.notes).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 8);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
      <div className="card-glass rounded-2xl p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Journal</h3>
          <DatePicker value={date} onChange={setDate} align="end" />
        </div>
        <textarea
          value={text} onChange={(e) => setText(e.target.value)}
          placeholder="How did today go? What went well?"
          className="min-h-[280px] w-full resize-y rounded-xl border border-border bg-background/40 p-4 text-sm outline-none focus:border-primary"
        />
        <div className="mt-3 flex items-center justify-end gap-2">
          <button onClick={() => { setNote(date, ""); setText(""); }} className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-destructive/60">Clear</button>
          <button onClick={() => setNote(date, text)} className="rounded-lg gradient-brand px-3 py-1.5 text-xs font-semibold text-white shadow">Save</button>
        </div>
      </div>
      <div className="card-glass rounded-2xl p-5">
        <h4 className="mb-3 text-sm font-semibold">Recent Entries</h4>
        {recent.length === 0 ? (
          <p className="text-xs text-muted-foreground">No entries yet.</p>
        ) : (
          <ul className="space-y-2">
            {recent.map(([d, t]) => (
              <li key={d}>
                <button onClick={() => setDate(d)} className={`w-full rounded-lg border p-2 text-left text-xs hover:border-primary/40 ${d === date ? "border-primary bg-primary/5" : "border-border bg-background/30"}`}>
                  <div className="font-semibold">{d}</div>
                  <div className="line-clamp-2 text-muted-foreground">{t}</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
