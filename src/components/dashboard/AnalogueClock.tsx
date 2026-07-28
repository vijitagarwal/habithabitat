import { useEffect, useState } from "react";

export function AnalogueClock({ className = "" }: { className?: string }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();

  const secondDegrees = (seconds / 60) * 360;
  const minuteDegrees = ((minutes + seconds / 60) / 60) * 360;
  const hourDegrees = ((hours % 12 + minutes / 60) / 12) * 360;

  return (
    <div className={`relative w-40 h-40 rounded-full border-[6px] border-primary/20 bg-card/80 backdrop-blur-md shadow-2xl flex items-center justify-center ${className}`}>
      {/* Clock ticks */}
      {[...Array(12)].map((_, i) => (
        <div 
          key={i}
          className="absolute w-full h-full p-1.5"
          style={{ transform: `rotate(${i * 30}deg)` }}
        >
          <div className={`mx-auto w-1 rounded-full ${i % 3 === 0 ? 'h-3 bg-primary/80' : 'h-1.5 bg-muted-foreground/50'}`} />
        </div>
      ))}

      {/* Hour hand */}
      <div 
        className="absolute bottom-1/2 left-1/2 w-[4px] h-10 bg-foreground rounded-full origin-bottom z-10"
        style={{ transform: `translateX(-50%) rotate(${hourDegrees}deg)` }}
      />
      
      {/* Minute hand */}
      <div 
        className="absolute bottom-1/2 left-1/2 w-[3px] h-14 bg-foreground/80 rounded-full origin-bottom z-10"
        style={{ transform: `translateX(-50%) rotate(${minuteDegrees}deg)` }}
      />
      
      {/* Second hand */}
      <div 
        className="absolute bottom-1/2 left-1/2 w-[2px] h-16 bg-red-500 rounded-full origin-bottom z-10"
        style={{ transform: `translateX(-50%) rotate(${secondDegrees}deg)` }}
      />

      {/* Center dot */}
      <div className="absolute w-3 h-3 rounded-full bg-red-500 border-2 border-card z-20" />
    </div>
  );
}
