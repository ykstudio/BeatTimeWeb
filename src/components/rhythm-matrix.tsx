"use client";

import { cn } from "@/lib/utils";

type RhythmMatrixProps = {
  fourBeatAccuracy: number;
};

// Convert accuracy percentage to color
function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 80) return 'bg-green-500';
  if (accuracy >= 60) return 'bg-yellow-500';
  if (accuracy >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

export default function RhythmMatrix({ fourBeatAccuracy }: RhythmMatrixProps) {
  const colorClass = getAccuracyColor(fourBeatAccuracy);
  
  return (
    <div className="flex flex-col items-center justify-center gap-2 w-full max-w-sm">
      <p className="text-sm font-medium text-muted-foreground">Current Measure</p>
      <div className="flex items-center gap-4">
        <div 
          className={cn(
            "w-16 h-16 rounded-lg border-2 border-muted transition-all duration-300",
            colorClass,
            fourBeatAccuracy > 0 ? 'opacity-100 shadow-md' : 'opacity-30'
          )}
        />
        <div className="text-center">
          <p className="text-2xl font-bold tabular-nums">{fourBeatAccuracy}%</p>
          <p className="text-xs text-muted-foreground">Accuracy</p>
        </div>
      </div>
    </div>
  );
}
