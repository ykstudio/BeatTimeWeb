
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AudioVisualizer from "@/components/audio-visualizer";
import { type LogSettingsType } from "./log-settings";
import { type AudioAnalysisData } from "@/hooks/use-audio-data";
import VelocityMeter from "./velocity-meter";
import { frequencyToNoteName } from "@/lib/music";

type AudioAnalysisDisplayProps = {
  analysisData: AudioAnalysisData;
  logSettings: LogSettingsType;
};

// Map spectral centroid to an HSL color
// Lower centroid (bass sounds) -> cooler colors (blue/purple)
// Higher centroid (treble sounds) -> warmer colors (yellow/orange)
function getTimbreColor(centroid: number): string {
    if (centroid === 0) return 'hsl(240, 10%, 25%)'; // Default color for silence
    
    // Normalize centroid (values can range roughly from 0 to 10000)
    // We'll cap it at 5000 for a reasonable color range
    const normalized = Math.min(centroid / 5000, 1);
    
    // Map normalized value to hue (240 for blue down to 0 for red)
    const hue = 240 - (normalized * 200); 
    const saturation = 70;
    const lightness = 50;

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}


export default function AudioAnalysisDisplay({ analysisData, logSettings }: AudioAnalysisDisplayProps) {
  const { frequencyData, dominantFrequency, audioLevel, spectralCentroid } = analysisData;
  const noteName = frequencyToNoteName(dominantFrequency);
  const timbreColor = getTimbreColor(spectralCentroid);

  return (
    <Card className="w-full h-full shadow-lg flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl font-bold font-headline text-center">Audio Analysis</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-items-center">
        <div className="w-full h-full flex flex-col items-center justify-around gap-4">
            <AudioVisualizer audioData={frequencyData} />
            <VelocityMeter audioLevel={audioLevel} />
            {logSettings.velocity && (
                <div className="mt-2 text-xs text-muted-foreground">
                Raw Velocity: {audioLevel}
                </div>
            )}
        </div>
        <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-4 text-center">
            <div className="bg-muted/50 rounded-lg p-4 flex flex-col justify-center items-center">
                <p className="text-sm text-muted-foreground">Dominant Frequency</p>
                <p className="text-3xl font-bold">{dominantFrequency > 0 ? dominantFrequency.toFixed(0) : "---"} <span className="text-lg font-normal">Hz</span></p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 flex flex-col justify-center items-center">
                <p className="text-sm text-muted-foreground">Pitch / Note</p>
                <p className="text-3xl font-bold">{noteName}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 flex flex-col justify-center items-center col-span-2">
                <p className="text-sm text-muted-foreground">Timbre</p>
                 <div className="w-24 h-24 mt-2 rounded-full transition-colors duration-200" style={{ backgroundColor: timbreColor }} />
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
