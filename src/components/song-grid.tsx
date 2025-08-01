"use client";

import { cn } from "@/lib/utils";

type SongGridProps = {
  songGridData: number[]; // Array of timing quality scores (0-100) for individual beats
  currentBeat?: number; // Current beat index (1-based) to highlight
};

// Convert timing quality to green opacity style
function getTimingQualityStyle(quality: number): { backgroundColor: string; opacity: number } {
  // Clamp quality between 0 and 100
  const clampedQuality = Math.max(0, Math.min(100, quality));
  // Convert to opacity (0-100% -> 0.0-1.0)
  const opacity = clampedQuality / 100;
  
  return {
    backgroundColor: 'rgb(34, 197, 94)', // green-500 equivalent
    opacity: opacity
  };
}

export default function SongGrid({ songGridData, currentBeat }: SongGridProps) {
  // Create a 16x16 grid (256 squares total) - now each square represents a beat
  const gridSize = 16;
  const totalSquares = gridSize * gridSize;
  
  return (
    <div className="flex flex-col items-center justify-center gap-2 w-full max-w-sm">
      <p className="text-sm font-medium text-muted-foreground">Beat Quality Map</p>
      <div className="grid grid-cols-16 gap-0.5 w-64 h-64 border rounded-lg p-2 bg-muted/20">
        {Array.from({ length: totalSquares }, (_, index) => {
          const beatNumber = index + 1;
          const hasData = index < songGridData.length;
          const quality = hasData ? songGridData[index] : 0;
          const isCurrentBeat = currentBeat === beatNumber;
          const isBeatPassed = beatNumber < (currentBeat || 0);
          
          // Determine style based on state
          let style: React.CSSProperties;
          let className = "w-3 h-3 rounded-sm transition-all duration-200";
          
          if (isCurrentBeat) {
            // Current beat: blinking border animation
            style = quality > 0 ? getTimingQualityStyle(quality) : { backgroundColor: 'rgb(229, 231, 235)', opacity: 0.8 }; // gray-200
            className += " border-2 border-blue-500 animate-pulse";
          } else if (hasData && isBeatPassed) {
            // Beat has been played
            if (quality > 0) {
              // Had a hit
              style = getTimingQualityStyle(quality);
              className += " border border-gray-300";
            } else {
              // No hit detected (missed beat)
              style = { backgroundColor: 'rgb(209, 213, 219)', opacity: 0.6 }; // gray-300 for missed beats
              className += " border border-gray-400";
            }
          } else {
            // Future beat (not played yet)
            style = { backgroundColor: 'rgb(156, 163, 175)', opacity: 0.3 }; // gray-400 for unplayed
            className += " border border-gray-200";
          }
          
          const getTitle = () => {
            if (isCurrentBeat) return `Current Beat ${beatNumber}`;
            if (hasData && isBeatPassed) {
              return quality > 0 ? `Beat ${beatNumber}: ${quality.toFixed(1)}% quality` : `Beat ${beatNumber}: Missed`;
            }
            return `Beat ${beatNumber}: Not played yet`;
          };
          
          return (
            <div
              key={index}
              className={className}
              style={style}
              title={getTitle()}
            />
          );
        })}
      </div>
      <div className="flex flex-col gap-2 items-center">
        <div className="flex gap-3 items-center text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-blue-500 rounded-sm animate-pulse" style={{ backgroundColor: 'rgb(229, 231, 235)', opacity: 0.8 }} />
            <span>Current</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border border-gray-300 rounded-sm" style={{ backgroundColor: 'rgb(34, 197, 94)', opacity: 0.8 }} />
            <span>Hit</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border border-gray-400 rounded-sm" style={{ backgroundColor: 'rgb(209, 213, 219)', opacity: 0.6 }} />
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border border-gray-200 rounded-sm" style={{ backgroundColor: 'rgb(156, 163, 175)', opacity: 0.3 }} />
            <span>Future</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">{currentBeat ? currentBeat - 1 : 0} / {totalSquares}</p>
          <p className="text-xs text-muted-foreground">Beats Completed</p>
        </div>
      </div>
    </div>
  );
}
