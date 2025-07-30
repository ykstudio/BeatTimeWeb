"use client";

import type { PracticeSession } from '@/app/page';

export default function SummaryDisplay({ session }: { session: PracticeSession }) {
    if (!session) return null;

    return (
        <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-2xl font-bold">{session.score}</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="text-2xl font-bold">{session.accuracy}%</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">BPM</p>
                <p className="text-2xl font-bold">{session.bpm}</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Best Streak</p>
                <p className="text-2xl font-bold">{session.streak}</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Hits</p>
                <p className="text-2xl font-bold">{session.hits}</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Misses</p>
                <p className="text-2xl font-bold">{session.misses}</p>
            </div>
        </div>
    );
}
