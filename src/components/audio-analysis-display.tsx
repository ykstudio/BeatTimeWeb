
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AudioVisualizer from "@/components/audio-visualizer";
import { type LogSettingsType } from "./log-settings";
import { type AudioAnalysisData } from "@/hooks/use-audio-data";

type AudioAnalysisDisplayProps = {
  analysisData: AudioAnalysisData;
  logSettings: LogSettingsType;
};

export default function AudioAnalysisDisplay({ analysisData, logSettings }: AudioAnalysisDisplayProps) {
  const { frequencyData, dominantFrequency, audioLevel } = analysisData;

  return (
    <Card className="w-full h-full shadow-lg flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl font-bold font-headline text-center">Audio Analysis</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-items-center">
        <div className="w-full h-full flex flex-col items-center justify-center">
          <AudioVisualizer audioData={frequencyData} />
          {logSettings.velocity && (
            <div className="mt-4 text-sm text-muted-foreground">
              Audio Input Velocity: {audioLevel}
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
                <p className="text-3xl font-bold">--</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 flex flex-col justify-center items-center col-span-2">
                <p className="text-sm text-muted-foreground">Timbre</p>
                 <div className="w-24 h-24 mt-2 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
