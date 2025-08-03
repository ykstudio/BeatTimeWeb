"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INSTRUMENT_PROFILES } from "@/lib/audio";

interface InstrumentSelectorProps {
  selectedInstrument: string;
  onInstrumentChange: (instrument: string) => void;
  className?: string;
}

export function InstrumentSelector({ 
  selectedInstrument, 
  onInstrumentChange, 
  className 
}: InstrumentSelectorProps) {
  return (
    <div className={className}>
      <label className="text-sm font-medium mb-2 block">Instrument</label>
      <Select value={selectedInstrument} onValueChange={onInstrumentChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select your instrument" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(INSTRUMENT_PROFILES).map(([key, profile]) => (
            <SelectItem key={key} value={key}>
              {profile.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground mt-1">
        Choose your instrument for optimized beat detection
      </p>
    </div>
  );
}