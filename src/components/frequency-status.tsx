"use client";

import { Badge } from "@/components/ui/badge";
import { AudioAnalysisData } from "@/hooks/use-audio-data";

interface FrequencyStatusProps {
  audioData: AudioAnalysisData;
  onsetThreshold: number;
}

export function FrequencyStatus({ audioData, onsetThreshold }: FrequencyStatusProps) {
  const isInstrumentMode = audioData.instrumentConfidence > 0.3;
  const activeLevel = isInstrumentMode ? audioData.instrumentLevel : audioData.audioLevel;
  const isAboveThreshold = activeLevel > onsetThreshold;
  
  return (
    <div className="flex items-center gap-2 text-xs">
      <Badge variant={isInstrumentMode ? "default" : "secondary"}>
        {isInstrumentMode ? "🎯 Instrument" : "🔊 General"}
      </Badge>
      
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground">Level:</span>
        <span className={`font-mono ${isAboveThreshold ? 'text-green-500' : 'text-slate-400'}`}>
          {activeLevel.toFixed(1)}
        </span>
        <span className="text-muted-foreground">/</span>
        <span className="font-mono text-blue-400">{onsetThreshold.toFixed(1)}</span>
      </div>
      
      {isInstrumentMode && (
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Conf:</span>
          <span className={`font-mono ${audioData.instrumentConfidence > 0.5 ? 'text-green-400' : 'text-yellow-400'}`}>
            {(audioData.instrumentConfidence * 100).toFixed(0)}%
          </span>
        </div>
      )}
      
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground">Freq:</span>
        <span className="font-mono text-blue-400">
          {audioData.instrumentFrequency?.toFixed(0) || '0'}Hz
        </span>
      </div>
    </div>
  );
}