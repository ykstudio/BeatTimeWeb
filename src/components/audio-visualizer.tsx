"use client";

import { cn } from "@/lib/utils";

type AudioVisualizerProps = {
  frequencyData: Uint8Array;
};

const NUM_BARS = 32;

export default function AudioVisualizer({ frequencyData }: AudioVisualizerProps) {
  const bars = Array.from({ length: NUM_BARS }, (_, i) => {
    const dataIndex = Math.floor((i * frequencyData.length) / NUM_BARS);
    const value = frequencyData[dataIndex] || 0;
    const height = Math.max(1, (value / 255) * 100);
    return { height };
  });

  return (
    <div className="flex items-end justify-center gap-1 h-32 w-full max-w-sm rounded-lg bg-muted/50 p-4">
      {bars.map((bar, index) => (
        <div
          key={index}
          className={cn(
            "w-full bg-primary rounded-t-sm transition-all duration-75",
            bar.height > 1 ? 'opacity-100' : 'opacity-20'
          )}
          style={{ height: `${bar.height}%` }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
