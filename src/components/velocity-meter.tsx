
"use client";

import { cn } from "@/lib/utils";

type VelocityMeterProps = {
  audioLevel: number;
};

// Max audio level is 20, as defined in the use-audio-data hook
const MAX_LEVEL = 20;

export default function VelocityMeter({ audioLevel }: VelocityMeterProps) {
  const heightPercentage = (audioLevel / MAX_LEVEL) * 100;

  return (
    <div className="flex flex-col items-center justify-center gap-2 w-full max-w-sm">
      <p className="text-sm font-medium text-muted-foreground">Velocity</p>
      <div className="flex items-end gap-4">
        <div className="w-16 h-32 rounded bg-muted/50 flex items-end">
          <div
            className={cn(
                "w-full bg-accent rounded-b transition-all duration-75",
                heightPercentage > 1 ? 'opacity-100' : 'opacity-40'
            )}
            style={{ height: `${heightPercentage}%` }}
          />
        </div>
        <div className="w-12 text-center">
            <p className="text-4xl font-bold tabular-nums">{audioLevel}</p>
            <p className="text-xs text-muted-foreground">/ {MAX_LEVEL}</p>
        </div>
      </div>
    </div>
  );
}
