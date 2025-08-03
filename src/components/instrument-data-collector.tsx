"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface InstrumentDataCollectorProps {
  selectedInstrument: string;
  isRecording: boolean;
  beatCount: number;
}

export function InstrumentDataCollector({ 
  selectedInstrument, 
  isRecording, 
  beatCount 
}: InstrumentDataCollectorProps) {
  if (!isRecording) {
    return null;
  }

  return (
    <Card className="p-4 bg-blue-50 border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-blue-800">📊 Data Collection Mode</h3>
        <Badge variant="default" className="bg-blue-600">
          Recording: {selectedInstrument}
        </Badge>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-blue-700">Current Instrument:</span>
          <span className="font-mono font-semibold text-blue-900">{selectedInstrument}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-blue-700">Beats Recorded:</span>
          <span className="font-mono font-semibold text-blue-900">{beatCount}</span>
        </div>
        
        <div className="text-xs text-blue-600 bg-white p-2 rounded border">
          <strong>Data Being Collected:</strong>
          <ul className="mt-1 space-y-1 text-xs">
            <li>• Frequency spectrum (all bands: sub, bass, mid, high, brilliance)</li>
            <li>• Harmonic content (fundamental + harmonics 2-8)</li>
            <li>• Waveform characteristics (zero crossing rate, peak, valleys)</li>
            <li>• Onset timing and amplitude data</li>
            <li>• Spectral centroid (brightness measure)</li>
          </ul>
        </div>
        
        <div className="text-xs text-blue-600 border-t pt-2">
          <strong>Testing Instructions:</strong>
          <p>Play 16 steady beats with your current instrument, then switch to the next instrument in your selector.</p>
        </div>
      </div>
    </Card>
  );
}