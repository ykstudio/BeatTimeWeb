"use client";

import { cn } from "@/lib/utils";

interface BeatIndicatorProps {
  timeSignature: number;
  currentBeat: number;
  isPlaying: boolean;
}

export default function BeatIndicator({ timeSignature, currentBeat, isPlaying }: BeatIndicatorProps) {
  const dots = Array.from({ length: timeSignature }, (_, i) => i + 1);

  return (
    <div className="flex justify-center items-center gap-3 h-8">
      {dots.map((dot) => (
        <div
          key={dot}
          className={cn(
            "w-4 h-4 rounded-full transition-all duration-100",
            isPlaying && currentBeat === dot ? "bg-primary scale-125" : "bg-muted",
            dot === 1 && isPlaying && currentBeat === dot ? "bg-accent" : ""
          )}
        />
      ))}
    </div>
  );
}
