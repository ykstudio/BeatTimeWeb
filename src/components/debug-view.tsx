"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface DebugViewProps {
  visible: boolean;
  currentBeat: number;
  lastHitTiming: {
    delta: number;
    rawDelta: number;
    quality: number;
    isOnBeat: boolean;
  };
  measureStats: {
    totalHits: number;
    goodHits: number;
    timing: number[];
  };
}

export function DebugView({ visible, currentBeat, lastHitTiming, measureStats }: DebugViewProps) {
  if (!visible) return null;
  
  return (
    <Card className="w-full mt-4 bg-slate-900 text-white font-mono text-sm">
      <CardHeader>
        <CardTitle className="text-white">Timing Debug Info</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2 flex items-center gap-4">
              <span>Current Beat:</span>
              <div className="flex gap-2">
                {[1,2,3,4].map(beat => (
                  <div 
                    key={beat}
                    className={`w-3 h-3 rounded-full ${currentBeat === beat ? "bg-blue-500" : "bg-gray-500"}`}
                  />
                ))}
              </div>
            </div>
            
            <div className="border border-slate-700 rounded p-2">
              <div className="text-slate-400 text-xs mb-1">Last Hit</div>
              <div>Compensated Delta: {lastHitTiming.delta.toFixed(1)}ms</div>
              <div>Raw Delta: {lastHitTiming.rawDelta.toFixed(1)}ms</div>
              <div>Quality: {lastHitTiming.quality.toFixed(1)}%</div>
              <div className="mt-1 flex items-center gap-2">
                {lastHitTiming.isOnBeat ? 
                  <span className="text-green-500">✓ On Beat</span> : 
                  <span className="text-red-500">✗ Off Beat</span>
                }
                <span className="text-xs text-slate-400">
                  ({Math.abs(lastHitTiming.rawDelta).toFixed(1)}ms from {lastHitTiming.isOnBeat ? 'beat' : 'midpoint'})
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Beat Window: ±100ms | Off-beat Window: 250ms±100ms
              </div>
            </div>

            <div className="border border-slate-700 rounded p-2">
              <div className="text-slate-400 text-xs mb-1">Measure Stats</div>
              <div>Good Hits: {measureStats.goodHits}/4</div>
              <div>Total Hits: {measureStats.totalHits}</div>
              <div className="text-xs text-slate-400 mt-1">
                {((measureStats.goodHits / 4) * 100).toFixed(0)}% accuracy
              </div>
            </div>

            <div className="col-span-2 border border-slate-700 rounded p-2">
              <div className="text-slate-400 text-xs mb-1">Timing Scores</div>
              <div className="flex flex-wrap gap-2">
                {measureStats.timing.map((score, i) => {
                  const isOnBeat = score > 70;
                  return (
                    <div 
                      key={i}
                      className={`px-2 py-1 rounded text-xs ${
                        score > 90 ? "bg-green-900" :
                        score > 70 ? "bg-green-800" :
                        score > 50 ? "bg-yellow-900" :
                        "bg-red-900"
                      }`}
                    >
                      <div>{score.toFixed(1)}%</div>
                      <div className="text-[10px] opacity-75">
                        {isOnBeat ? "On" : "Off"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}