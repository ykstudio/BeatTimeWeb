
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

// Map spectral centroid to an HSL color using a logarithmic scale for better perception.
function getTimbreColor(centroid: number): string {
    if (centroid < 50) return 'hsl(240, 10%, 25%)'; // Default color for silence or very low freq

    // A logarithmic scale is better for frequencies.
    // Let's define our expected range, e.g., 100Hz to 8000Hz
    const minFreq = 100;
    const maxFreq = 8000;
    
    // Clamp the centroid to our expected range
    const clampedCentroid = Math.max(minFreq, Math.min(centroid, maxFreq));

    // Calculate the logarithmic position of the centroid within the range
    const logMin = Math.log(minFreq);
    const logMax = Math.log(maxFreq);
    const logCentroid = Math.log(clampedCentroid);
    
    // Normalize the log position to a 0-1 scale
    const normalized = (logCentroid - logMin) / (logMax - logMin);

    // Map normalized value to hue (270 for deep blue down to 0 for red)
    // This gives a more intuitive color range: bass (blue/purple) -> mids (green) -> treble (yellow/red)
    const hue = 270 - (normalized * 270); 
    const saturation = 80;
    const lightness = 55;

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
                 <div className="w-24 h-24 mt-2 rounded-full transition-colors duration-200 border-4" style={{ backgroundColor: timbreColor, borderColor: timbreColor.replace(/(\d+)(%\))$/, (match, p1) => `hsl(0, 0%, ${Math.max(0, parseInt(p1, 10) - 20)}%)`) }} />
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
