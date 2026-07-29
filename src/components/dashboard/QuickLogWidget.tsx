import { useState, useEffect } from "react";
import { useHabits, todayISO, habitsFor, habitStatus } from "@/lib/habits-store";
import { HabitRowConnected } from "./HabitRow";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ListTodo, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

export function QuickLogWidget() {
  const [open, setOpen] = useState(false);
  const s = useHabits();
  const today = todayISO();
  const scheduled = habitsFor(s, today);
  // Filter for incomplete habits
  const incomplete = scheduled.filter((h) => habitStatus(s, h, today) !== "completed");
  const totalToday = scheduled.length;
  const doneToday = totalToday - incomplete.length;
  const allDone = totalToday > 0 && incomplete.length === 0;

  // Auto-close with confetti when all done
  useEffect(() => {
    if (allDone && open) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#F59E0B", "#10B981", "#3B82F6"],
      });
      const timer = setTimeout(() => setOpen(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [allDone, open]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-110 gradient-brand text-white"
          >
            <ListTodo className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="card-glass border-border/50 max-w-[400px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center justify-between">
              <span>Quick Log</span>
              <span className="text-xs font-medium text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
                {doneToday}/{totalToday} Done
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 pt-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
            <AnimatePresence mode="popLayout">
              {incomplete.length > 0 ? (
                <motion.ul className="space-y-3">
                  {incomplete.map((h) => (
                    <motion.li
                      key={h.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <HabitRowConnected habit={h} dateISO={today} />
                    </motion.li>
                  ))}
                </motion.ul>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-10 text-center"
                >
                  <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  </div>
                  <h4 className="text-lg font-bold">All caught up!</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    You've completed all scheduled habits for today.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
