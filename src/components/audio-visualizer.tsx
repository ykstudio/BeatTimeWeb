
"use client";

import { cn } from "@/lib/utils";

type AudioVisualizerProps = {
  audioData: Uint8Array;
};

const NUM_BARS = 32;

export default function AudioVisualizer({ audioData }: AudioVisualizerProps) {
  const bars = Array.from({ length: NUM_BARS }, (_, i) => {
    // The frequency data is logarithmic, so we sample it in a way that
    // represents lower frequencies more, which is more visually appealing.
    const dataIndex = Math.floor(Math.pow(i / (NUM_BARS - 1), 2) * (audioData.length / 2));
    const value = audioData[dataIndex] || 0;
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
