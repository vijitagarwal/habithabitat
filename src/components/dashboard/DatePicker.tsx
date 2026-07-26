import * as React from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  value: string; // ISO yyyy-MM-dd
  onChange: (iso: string) => void;
  className?: string;
  size?: "sm" | "md";
  align?: "start" | "center" | "end";
  disabled?: (date: Date) => boolean;
  placeholder?: string;
}

export function DatePicker({
  value,
  onChange,
  className,
  size = "sm",
  align = "start",
  disabled,
  placeholder = "Pick a date",
}: Props) {
  const selected = value ? parseISO(value) : undefined;
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start gap-2 rounded-lg border-border bg-background font-normal hover:border-primary/50",
            size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-3 text-sm",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 opacity-70" />
          {selected ? format(selected, "MMM d, yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => {
            if (d) {
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, "0");
              const day = String(d.getDate()).padStart(2, "0");
              onChange(`${y}-${m}-${day}`);
              setOpen(false);
            }
          }}
          disabled={disabled}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
