"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LogSettingsType } from "@/components/log-settings";
import { AudioAnalysisData } from "@/hooks/use-audio-data";

const DebugView = dynamic(() => import("@/components/debug-view").then(m => m.DebugView), { ssr: false });
const AutoDetectionStatus = dynamic(() => import("@/components/auto-detection-status").then(m => m.AutoDetectionStatus), { ssr: false });
const AudioWaveform = dynamic(() => import("@/components/audio-waveform"), { ssr: false, loading: () => <div className="h-64" /> });
const LogSettings = dynamic(() => import("@/components/log-settings"), { ssr: false });
const ConsoleOutput = dynamic(() => import("@/components/console-output").then(m => m.ConsoleOutput), { ssr: false });
const AudioAnalysisDisplay = dynamic(() => import("@/components/audio-analysis-display"), { ssr: false });
const RhythmMatrix = dynamic(() => import("@/components/rhythm-matrix"), { ssr: false });

interface AnalysisTabsProps {
  audioAnalysisData: AudioAnalysisData;
  logSettings: LogSettingsType;
  onLogSettingsChange: (settings: LogSettingsType) => void;
  selectedInstrument: string;
  onInstrumentSelect: (instrument: string) => void;
  stableDetectedInstrument: string;
  stableDetectionConfidence: number;
  metronomeIsPlaying: boolean;
  beatTimes: number[];
  beatQualities: number[];
  latencyCompensation: number;
  currentBpm: number;
  currentBeatNumber: number;
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
  onsetThreshold: number;
  fourBeatAccuracy: number;
  setLatencyCompensation: (value: number) => void;
}

type TabType = 'analysis' | 'rhythm' | 'waveform' | 'detection' | 'debug' | 'settings' | 'console';

export function AnalysisTabs({
  audioAnalysisData,
  logSettings,
  onLogSettingsChange,
  selectedInstrument,
  onInstrumentSelect,
  stableDetectedInstrument,
  stableDetectionConfidence,
  metronomeIsPlaying,
  beatTimes,
  beatQualities,
  latencyCompensation,
  currentBpm,
  currentBeatNumber,
  currentBeat,
  lastHitTiming,
  measureStats,
  onsetThreshold,
  fourBeatAccuracy,
  setLatencyCompensation
}: AnalysisTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('analysis');

  const tabs = [
    { id: 'analysis' as TabType, label: 'Audio Analysis', icon: '🎵' },
    { id: 'rhythm' as TabType, label: 'Rhythm', icon: '🥁' },
    { id: 'waveform' as TabType, label: 'Waveform', icon: '📊' },
    { id: 'detection' as TabType, label: 'Detection', icon: '🎯' },
    { id: 'debug' as TabType, label: 'Debug', icon: '🔧' },
    { id: 'settings' as TabType, label: 'Settings', icon: '⚙️' },
    { id: 'console' as TabType, label: 'Console', icon: '💻' },
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex space-x-1 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {activeTab === 'analysis' && (
          <AudioAnalysisDisplay 
            analysisData={audioAnalysisData}
            logSettings={logSettings}
          />
        )}
        
        {activeTab === 'rhythm' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Latency Compensation</span>
                <span className="text-sm text-muted-foreground">{Math.round(latencyCompensation * 1000)}ms</span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                step="10"
                value={latencyCompensation * 1000}
                onChange={(e) => setLatencyCompensation(Number(e.target.value) / 1000)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0ms</span>
                <span>250ms</span>
                <span>500ms</span>
              </div>
            </div>
            <div className="flex justify-center">
              <RhythmMatrix fourBeatAccuracy={fourBeatAccuracy} />
            </div>
          </div>
        )}
        
        {activeTab === 'waveform' && logSettings.timingQuality && (
          <AudioWaveform 
            audioData={audioAnalysisData}
            isActive={metronomeIsPlaying}
            beatTimes={beatTimes}
            beatQualities={beatQualities}
            latencyCompensation={latencyCompensation}
            bpm={currentBpm}
            currentBeat={currentBeatNumber}
          />
        )}
        
        {activeTab === 'detection' && (
          <AutoDetectionStatus 
            audioData={{
              ...audioAnalysisData,
              detectedInstrument: stableDetectedInstrument,
              detectionConfidence: stableDetectionConfidence
            }}
            onInstrumentSelect={onInstrumentSelect}
          />
        )}
        
        {activeTab === 'debug' && (
          <DebugView 
            visible={true}
            currentBeat={currentBeat}
            lastHitTiming={lastHitTiming}
            measureStats={measureStats}
            audioAnalysis={{
              audioLevel: audioAnalysisData.audioLevel,
              instrumentLevel: audioAnalysisData.instrumentLevel,
              instrumentFrequency: audioAnalysisData.instrumentFrequency,
              instrumentConfidence: audioAnalysisData.instrumentConfidence,
              selectedInstrument: selectedInstrument,
              onsetThreshold: onsetThreshold
            }}
          />
        )}
        
        {activeTab === 'settings' && (
          <LogSettings settings={logSettings} onChange={onLogSettingsChange} />
        )}
        
        {activeTab === 'console' && (
          <ConsoleOutput />
        )}
      </CardContent>
    </Card>
  );
}