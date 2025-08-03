"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AudioAnalysisData } from "@/hooks/use-audio-data";

interface EnhancedFeedbackProps {
  audioData: AudioAnalysisData;
  onsetThreshold: number;
  lastHitTiming: {
    delta: number;
    rawDelta: number;
    quality: number;
    isOnBeat: boolean;
  };
}

export function EnhancedFeedback({ audioData, onsetThreshold, lastHitTiming }: EnhancedFeedbackProps) {
  const isInstrumentMode = audioData.instrumentConfidence > 0.3;
  const activeLevel = isInstrumentMode ? audioData.instrumentLevel : audioData.audioLevel;
  const isAboveThreshold = activeLevel > onsetThreshold;
  
  // Calculate quality breakdown for display
  const baseTimingQuality = lastHitTiming.quality > 0 ? 
    Math.max(0, 100 - (Math.abs(lastHitTiming.delta) / 200) * 100) : 0;
  const confidenceBonus = audioData.instrumentConfidence * 20;
  const detectionMethodBonus = isInstrumentMode ? 10 : 0;
  
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Real-time Analysis</h3>
        <Badge variant={isInstrumentMode ? "default" : "secondary"}>
          {isInstrumentMode ? "🎯 Instrument Mode" : "🔊 General Mode"}
        </Badge>
      </div>
      
      {/* Detection Status */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Level:</span>
            <span className={`font-mono ${isAboveThreshold ? 'text-green-500' : 'text-slate-400'}`}>
              {activeLevel.toFixed(1)} / {onsetThreshold.toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Confidence:</span>
            <span className={`font-mono ${audioData.instrumentConfidence > 0.5 ? 'text-green-400' : 'text-yellow-400'}`}>
              {(audioData.instrumentConfidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Frequency:</span>
            <span className="font-mono text-blue-400">
              {audioData.instrumentFrequency?.toFixed(0) || '0'}Hz
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Instrument:</span>
            <span className="font-mono text-purple-400">
              {audioData.selectedInstrument}
            </span>
          </div>
        </div>
      </div>
      
      {/* Quality Breakdown - only show if there was a recent hit */}
      {lastHitTiming.quality > 0 && (
        <div className="border-t pt-3 space-y-2">
          <h4 className="font-medium text-xs text-muted-foreground">Last Hit Quality Breakdown</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Timing Precision:</span>
              <span className="font-mono">{baseTimingQuality.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Confidence Bonus:</span>
              <span className="font-mono text-green-400">+{confidenceBonus.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span>Method Bonus:</span>
              <span className="font-mono text-blue-400">+{detectionMethodBonus}</span>
            </div>
            <div className="flex justify-between border-t pt-1 font-semibold">
              <span>Final Quality:</span>
              <span className={`font-mono ${lastHitTiming.quality > 80 ? 'text-green-500' : lastHitTiming.quality > 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                {lastHitTiming.quality.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Visual Level Meter */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Detection Level</span>
          <span className="text-muted-foreground">{((activeLevel / onsetThreshold) * 100).toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-200 ${
              isAboveThreshold ? 'bg-green-500' : 'bg-blue-400'
            }`}
            style={{ 
              width: `${Math.min(100, (activeLevel / onsetThreshold) * 100)}%` 
            }}
          />
        </div>
      </div>
    </Card>
  );
}