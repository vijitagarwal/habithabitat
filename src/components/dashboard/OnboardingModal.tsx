import { useState } from "react";
import { createPortal } from "react-dom";
import { addHabit, Habit } from "@/lib/habits-store";
import { HABIT_TEMPLATES } from "./habit-templates";
import { CheckCircle2, Dumbbell, Brain, Sparkles, Footprints, Moon, Droplets } from "lucide-react";

const HEALTH_PACK: Omit<Habit, "id" | "createdAt">[] = [
  { name: "Exercise", icon: "Dumbbell", category: "Health", color: "success", schedule: { type: "daily" } },
  { name: "Sleep by 11 PM", icon: "Moon", category: "Lifestyle", color: "brand", schedule: { type: "daily" } },
  { name: "Drink Water", icon: "Droplets", category: "Health", color: "info", direction: "build", unit: "L", benchmarks: [1, 2, 3], schedule: { type: "daily" } },
  { name: "Morning Meditation", icon: "Sparkles", category: "Mind", color: "brand", schedule: { type: "daily" } },
  { name: "Walk 10K Steps", icon: "Footprints", category: "Health", color: "success", schedule: { type: "daily" } },
];

interface OnboardingModalProps {
  onComplete: () => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPacks, setSelectedPacks] = useState<Set<string>>(new Set());

  const handleToggle = (pack: string) => {
    const next = new Set(selectedPacks);
    if (next.has(pack)) next.delete(pack);
    else next.add(pack);
    setSelectedPacks(next);
  };

  const handleInstall = () => {
    let count = 0;
    if (selectedPacks.has("CAT")) {
      HABIT_TEMPLATES.CAT.habits.forEach((h) => { addHabit(h); count++; });
    }
    if (selectedPacks.has("DEEP_WORK")) {
      HABIT_TEMPLATES.DEEP_WORK.habits.forEach((h) => { addHabit(h); count++; });
    }
    if (selectedPacks.has("HEALTH")) {
      HEALTH_PACK.forEach((h) => { addHabit(h); count++; });
    }
    setStep(3);
  };

  const totalAdded = (selectedPacks.has("CAT") ? HABIT_TEMPLATES.CAT.habits.length : 0) +
                     (selectedPacks.has("DEEP_WORK") ? HABIT_TEMPLATES.DEEP_WORK.habits.length : 0) +
                     (selectedPacks.has("HEALTH") ? HEALTH_PACK.length : 0);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-background/95 p-8 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200">
        
        {step === 1 && (
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Welcome to HabitHabitat 🏠</h2>
            <p className="text-muted-foreground text-lg px-4">
              Your personal mission control for habits and CAT prep. Let's get you set up in 30 seconds.
            </p>
            <button
              onClick={() => setStep(2)}
              className="rounded-xl gradient-brand px-8 py-3 text-sm font-bold text-white shadow-lg hover:opacity-90 transition-opacity"
            >
              Get Started →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Choose a starting pack</h2>
            
            <div className="space-y-3">
              <button
                onClick={() => handleToggle("CAT")}
                className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-colors text-left ${selectedPacks.has("CAT") ? "border-primary bg-primary/10" : "border-border bg-card/50 hover:bg-card"}`}
              >
                <div className="text-2xl mt-0.5">🎓</div>
                <div>
                  <div className="font-semibold text-foreground">CAT Prep Pack</div>
                  <div className="text-sm text-muted-foreground">Essential habits for CAT 2026: Study sessions, mock tests, error review</div>
                </div>
                {selectedPacks.has("CAT") && <CheckCircle2 className="ml-auto text-primary shrink-0" />}
              </button>

              <button
                onClick={() => handleToggle("DEEP_WORK")}
                className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-colors text-left ${selectedPacks.has("DEEP_WORK") ? "border-primary bg-primary/10" : "border-border bg-card/50 hover:bg-card"}`}
              >
                <div className="text-2xl mt-0.5">🔥</div>
                <div>
                  <div className="font-semibold text-foreground">Deep Work Pack</div>
                  <div className="text-sm text-muted-foreground">Productivity core: Focused coding, reading, journaling, no distractions</div>
                </div>
                {selectedPacks.has("DEEP_WORK") && <CheckCircle2 className="ml-auto text-primary shrink-0" />}
              </button>

              <button
                onClick={() => handleToggle("HEALTH")}
                className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-colors text-left ${selectedPacks.has("HEALTH") ? "border-primary bg-primary/10" : "border-border bg-card/50 hover:bg-card"}`}
              >
                <div className="text-2xl mt-0.5">💪</div>
                <div>
                  <div className="font-semibold text-foreground">Health First Pack</div>
                  <div className="text-sm text-muted-foreground">Wellness foundation: Exercise, sleep, water, meditation, steps</div>
                </div>
                {selectedPacks.has("HEALTH") && <CheckCircle2 className="ml-auto text-primary shrink-0" />}
              </button>
            </div>

            <div className="flex flex-col items-center gap-3 pt-2">
              <button
                onClick={handleInstall}
                disabled={selectedPacks.size === 0}
                className="w-full rounded-xl gradient-brand px-6 py-3 text-sm font-bold text-white shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:grayscale"
              >
                Install Selected Packs →
              </button>
              <button
                onClick={() => {
                  onComplete();
                }}
                className="text-sm text-muted-foreground hover:text-foreground underline decoration-muted-foreground/30 underline-offset-4"
              >
                Skip, I'll add habits manually
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-6">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-success/20 animate-in zoom-in duration-500">
              <CheckCircle2 className="h-12 w-12 text-success" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">You're all set!</h2>
            <p className="text-muted-foreground text-lg">
              {totalAdded} habits added. You can always edit them later.
            </p>
            <button
              onClick={onComplete}
              className="rounded-xl gradient-brand px-8 py-3 text-sm font-bold text-white shadow-lg hover:opacity-90 transition-opacity"
            >
              Go to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
