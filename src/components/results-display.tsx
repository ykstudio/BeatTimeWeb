"use client";

import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface ResultsDisplayProps {
  score: number;
  accuracy: number;
  streak: number;
  bestStreak: number;
  lastHitTime: number;
}

export default function ResultsDisplay({ score, accuracy, streak, bestStreak, lastHitTime }: ResultsDisplayProps) {
    const [animateHit, setAnimateHit] = useState(false);

    useEffect(() => {
        if(lastHitTime > 0) {
            setAnimateHit(true);
            const timer = setTimeout(() => setAnimateHit(false), 200);
            return () => clearTimeout(timer);
        }
    }, [lastHitTime]);

  return (
    <div className="grid grid-cols-3 gap-4 w-full text-center">
      <div>
        <p className="text-sm text-muted-foreground">Score</p>
        <p className="text-2xl font-bold">{score}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Accuracy</p>
        <p className={cn("text-2xl font-bold transition-transform", animateHit && "scale-125")}>{accuracy}%</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Streak</p>
        <div className="flex items-center justify-center gap-1">
          <Flame className={cn("h-6 w-6 transition-colors", streak > 0 ? 'text-accent' : 'text-muted-foreground/50')} />
          <p className="text-2xl font-bold">{streak}</p>
        </div>
        <p className="text-xs text-muted-foreground">Best: {bestStreak}</p>
      </div>
    </div>
  );
}
