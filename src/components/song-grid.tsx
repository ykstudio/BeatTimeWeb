"use client";

import { cn } from "@/lib/utils";

type SongGridProps = {
  songGridData: number[]; // Array of timing quality scores (0-100) for individual beats
  currentBeat?: number; // Current beat index (1-based) to highlight
};

// Convert timing quality to solid color with glow effects
function getTimingQualityStyle(quality: number): { 
  backgroundColor: string; 
  opacity: number; 
  boxShadow?: string; 
} {
  // Clamp quality between 0 and 100
  const clampedQuality = Math.max(0, Math.min(100, quality));
  // Convert to opacity (0-100% -> 0.0-1.0)
  const opacity = Math.max(0.1, clampedQuality / 100); // Minimum 10% opacity for visibility
  
  // Solid green colors for perfect beats (85%+) - as requested
  if (clampedQuality >= 95) {
    // Perfect: bright green #0f0
    return {
      backgroundColor: '#0f0',
      opacity: 1,
      boxShadow: 'inset 0 0 1px 2px #fff, 0 0 4px #0f0'
    };
  } else if (clampedQuality >= 85) {
    // Excellent: medium green #0d0  
    return {
      backgroundColor: '#0d0',
      opacity: 1,
      boxShadow: 'inset 0 0 1px 2px #fff, 0 0 3px #0d0'
    };
  } else if (clampedQuality >= 70) {
    // Good: darker green #0c0
    return {
      backgroundColor: '#0c0',
      opacity: 1,
      boxShadow: 'inset 0 0 1px 2px #fff, 0 0 2px #0c0'
    };
  } else {
    // Regular green for lower quality beats
    return {
      backgroundColor: 'rgb(34, 197, 94)', // green-500
      opacity: opacity
    };
  }
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
            const currentStyle = quality > 0 ? getTimingQualityStyle(quality) : { backgroundColor: 'rgb(229, 231, 235)', opacity: 0.8 }; // gray-200
            style = {
              backgroundColor: currentStyle.backgroundColor,
              opacity: currentStyle.opacity,
              boxShadow: currentStyle.boxShadow
            };
            className += " border-2 border-blue-500 animate-pulse";
          } else if (hasData && isBeatPassed) {
            // Beat has been played
            if (quality > 0) {
              // Had a hit
              const hitStyle = getTimingQualityStyle(quality);
              style = {
                backgroundColor: hitStyle.backgroundColor,
                opacity: hitStyle.opacity,
                boxShadow: hitStyle.boxShadow
              };
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
        <div className="flex gap-2 items-center text-xs flex-wrap justify-center">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-blue-500 rounded-sm animate-pulse" style={{ backgroundColor: 'rgb(229, 231, 235)', opacity: 0.8 }} />
            <span>Current</span>
          </div>
          <div className="flex items-center gap-1">
            <div 
              className="w-3 h-3 border border-gray-300 rounded-sm" 
              style={{ 
                backgroundColor: '#0f0', 
                opacity: 1.0,
                boxShadow: 'inset 0 0 1px 2px #fff, 0 0 4px #0f0'
              }} 
            />
            <span>Perfect</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border border-gray-300 rounded-sm" style={{ backgroundColor: 'rgb(34, 197, 94)', opacity: 0.8 }} />
            <span>Good</span>
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
