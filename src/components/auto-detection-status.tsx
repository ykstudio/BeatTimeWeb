"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AudioAnalysisData } from "@/hooks/use-audio-data";

interface AutoDetectionStatusProps {
  audioData: AudioAnalysisData;
  onInstrumentSelect?: (instrument: string) => void;
}

export function AutoDetectionStatus({ audioData, onInstrumentSelect }: AutoDetectionStatusProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-500";
    if (confidence >= 0.6) return "bg-yellow-500";
    if (confidence >= 0.4) return "bg-orange-500";
    return "bg-red-500";
  };

  const getInstrumentIcon = (instrument: string) => {
    switch (instrument) {
      case 'voice': return '🎤';
      case 'guitar': return '🎸';
      case 'bass': return '🎸';
      case 'shaker': return '🥄';
      case 'clap': return '👏';
      case 'drums': return '🥁';
      case 'piano': return '🎹';
      default: return '🤖';
    }
  };

  const formatBreakdown = (breakdown: Record<string, number>) => {
    return Object.entries(breakdown)
      .filter(([_, value]) => value > 0.1)
      .map(([key, value]) => `${key}: ${(value * 100).toFixed(0)}%`)
      .join(', ');
  };

  const isDetectionActive = audioData.detectionConfidence > 0.4 && audioData.detectedInstrument !== 'auto';

  return (
    <Card className={`p-3 transition-all duration-300 ${
      isDetectionActive 
        ? 'bg-blue-50 border-blue-200 shadow-md' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">🤖 Auto-Detection</span>
            {isDetectionActive && (
              <div className="flex items-center gap-1">
                <span className="text-lg">
                  {getInstrumentIcon(audioData.detectedInstrument)}
                </span>
                <Badge 
                  variant="secondary"
                  className={`text-white ${getConfidenceColor(audioData.detectionConfidence)}`}
                >
                  {audioData.detectedInstrument}
                </Badge>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {(audioData.detectionConfidence * 100).toFixed(1)}%
            </span>
            {onInstrumentSelect && isDetectionActive && (
              <button
                onClick={() => onInstrumentSelect(audioData.detectedInstrument)}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
              >
                Switch
              </button>
            )}
          </div>
        </div>

        {isDetectionActive && (
          <div className="text-xs text-gray-600 bg-white p-2 rounded border">
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div>Centroid: {audioData.spectralCentroid.toFixed(0)}Hz</div>
              <div>Selected: {audioData.selectedInstrument}</div>
            </div>
            {Object.keys(audioData.detectionBreakdown).length > 0 && (
              <div className="mt-1 text-xs text-gray-500 truncate">
                {formatBreakdown(audioData.detectionBreakdown)}
              </div>
            )}
          </div>
        )}

        {!isDetectionActive && (
          <div className="text-xs text-gray-500 text-center py-1">
            Listening for instruments...
          </div>
        )}
      </div>
    </Card>
  );
}