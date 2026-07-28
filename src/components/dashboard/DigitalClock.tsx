import { useEffect, useState } from "react";

export function DigitalClock({ className = "" }: { className?: string }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  
  const dateString = time.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className={`flex items-center gap-2 font-mono font-semibold tracking-wider ${className}`}>
      <span className="text-muted-foreground/70 hidden sm:inline">{dateString}</span>
      <div>
        {hours}:{minutes}<span className="text-muted-foreground/70 text-[0.8em]">:{seconds}</span>
      </div>
    </div>
  );
}
