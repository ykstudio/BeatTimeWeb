
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
  
  // In performance mode, only show the velocity meter
  if (logSettings.performanceMode) {
    return (        
        <CardContent className="flex flex-col items-center gap-4">
          <VelocityMeter audioLevel={audioLevel} />
          {logSettings.velocity && (
            <div className="text-xs text-muted-foreground">
              Raw Velocity: {audioLevel}
            </div>
          )}
        </CardContent>      
    );
  }

  // Full analysis display when not in performance mode
  const noteName = frequencyToNoteName(dominantFrequency);
  const timbreColor = getTimbreColor(spectralCentroid);
  
  // Enhanced pitch/chord display
  const { pitchAnalysis, chordAnalysis, frequencyPeaks } = analysisData;
  const enhancedNoteName = pitchAnalysis ? pitchAnalysis.noteName : noteName;
  const centsDisplay = pitchAnalysis ? (pitchAnalysis.cents > 0 ? `+${pitchAnalysis.cents}` : `${pitchAnalysis.cents}`) : "";
  const topChord = chordAnalysis.possibleChords.length > 0 ? chordAnalysis.possibleChords[0] : null;

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
        <div className="w-full h-full grid grid-cols-2 gap-4 text-center">
            <div className="bg-muted/50 rounded-lg p-3 flex flex-col justify-center items-center">
                <p className="text-sm text-muted-foreground">Enhanced Pitch</p>
                <p className="text-2xl font-bold">{enhancedNoteName}</p>
                {centsDisplay && (
                  <p className="text-xs text-muted-foreground">{centsDisplay} cents</p>
                )}
                <p className="text-xs text-muted-foreground">{dominantFrequency > 0 ? dominantFrequency.toFixed(1) : "---"} Hz</p>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3 flex flex-col justify-center items-center">
                <p className="text-sm text-muted-foreground">Chord Detection</p>
                {topChord ? (
                  <>
                    <p className="text-2xl font-bold">{topChord.root}{topChord.type}</p>
                    <p className="text-xs text-muted-foreground">{topChord.confidence.toFixed(1)}% confidence</p>
                  </>
                ) : chordAnalysis.detectedNotes.length > 1 ? (
                  <>
                    <p className="text-lg font-bold">Multiple Notes</p>
                    <p className="text-xs text-muted-foreground">
                      {chordAnalysis.detectedNotes.slice(0, 3).map(n => n.noteName).join(', ')}
                    </p>
                  </>
                ) : (
                  <p className="text-lg text-muted-foreground">Single Note</p>
                )}
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3 flex flex-col justify-center items-center">
                <p className="text-sm text-muted-foreground">Frequency Peaks</p>
                <div className="text-xs space-y-1">
                  {frequencyPeaks.slice(0, 3).map((freq, i) => (
                    <div key={i} className="text-muted-foreground">
                      {freq.toFixed(1)} Hz
                    </div>
                  ))}
                  {frequencyPeaks.length === 0 && (
                    <div className="text-muted-foreground">No peaks</div>
                  )}
                </div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3 flex flex-col justify-center items-center">
                <p className="text-sm text-muted-foreground">Timbre</p>
                <div className="w-16 h-16 mt-2 rounded-full transition-colors duration-200 border-4" style={{ backgroundColor: timbreColor, borderColor: timbreColor.replace(/(\d+)(%\))$/, (match, p1) => `hsl(0, 0%, ${Math.max(0, parseInt(p1, 10) - 20)}%)`) }} />
                <p className="text-xs text-muted-foreground mt-1">{spectralCentroid.toFixed(0)} Hz</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
