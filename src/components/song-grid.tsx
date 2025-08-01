"use client";

import { cn } from "@/lib/utils";

type SongGridProps = {
  songGridColors: string[];
};

// Convert accuracy percentage to color class
function getAccuracyColorClass(accuracy: number): string {
  if (accuracy >= 80) return 'bg-green-500';
  if (accuracy >= 60) return 'bg-yellow-500';
  if (accuracy >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

export default function SongGrid({ songGridColors }: SongGridProps) {
  // Create a 16x16 grid (256 squares total)
  const gridSize = 16;
  const totalSquares = gridSize * gridSize;
  
  return (
    <div className="flex flex-col items-center justify-center gap-2 w-full max-w-sm">
      <p className="text-sm font-medium text-muted-foreground">Practice Session Map</p>
      <div className="grid grid-cols-16 gap-0.5 w-64 h-64 border rounded-lg p-2 bg-muted/20">
        {Array.from({ length: totalSquares }, (_, index) => {
          const hasData = index < songGridColors.length;
          const colorClass = hasData ? songGridColors[index] : 'bg-muted/30';
          
          return (
            <div
              key={index}
              className={cn(
                "w-3 h-3 rounded-sm transition-all duration-200",
                colorClass,
                hasData ? 'opacity-100' : 'opacity-30'
              )}
              title={hasData ? `Measure ${index + 1}` : 'Not played yet'}
            />
          );
        })}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">{songGridColors.length} / {totalSquares}</p>
        <p className="text-xs text-muted-foreground">Measures Completed</p>
      </div>
    </div>
  );
}
