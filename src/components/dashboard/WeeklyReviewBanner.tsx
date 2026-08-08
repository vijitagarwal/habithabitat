import React, { useState, useEffect } from "react";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WeeklyReviewBanner({ onNavigate }: { onNavigate: (v: string) => void }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const now = new Date();
    // Sunday (0) after 18:00 (6 PM)
    const isSunday = now.getDay() === 0;
    const isAfterSixPM = now.getHours() >= 18;
    
    if (isSunday && isAfterSixPM) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-semibold text-amber-500">Weekly Review Time</h3>
          <p className="text-sm text-amber-500/80">Reflect on your progress and plan for next week.</p>
        </div>
      </div>
      <Button 
        onClick={() => onNavigate("journal-weekly")}
        className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
      >
        Start Review <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
