"use client";

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import BeatIndicator from './beat-indicator';

interface MetronomeProps {
  onBeat: (beatNumber: number, time: number) => void;
  initialBpm: number;
  onBpmChange: (bpm: number) => void;
  isPlaying: boolean;
}

export interface MetronomeHandle {
  start: (bpm: number, context: AudioContext) => void;
  stop: () => void;
}

const Metronome = forwardRef<MetronomeHandle, MetronomeProps>(({ onBeat, initialBpm, onBpmChange, isPlaying }, ref) => {
  const [bpm, setBpm] = useState(initialBpm);
  const [timeSignature] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const schedulerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const beatCountRef = useRef(0);

  const scheduleBeat = useCallback((beatNumber: number, time: number) => {
    if (!audioContextRef.current) return;
    
    const osc = audioContextRef.current.createOscillator();
    const envelope = audioContextRef.current.createGain();

    osc.frequency.value = (beatNumber % timeSignature === 1) ? 1000 : 800;
    envelope.gain.setValueAtTime(1, time);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc.connect(envelope);
    envelope.connect(audioContextRef.current.destination);

    osc.start(time);
    osc.stop(time + 0.05);
  }, [timeSignature]);

  const scheduler = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed' || !isPlaying) return;

    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + 0.1) {
      const beatInBar = (beatCountRef.current % timeSignature) + 1;
      onBeat(beatInBar, nextNoteTimeRef.current);
      setCurrentBeat(beatInBar);
      scheduleBeat(beatInBar, nextNoteTimeRef.current);
      
      const secondsPerBeat = 60.0 / bpm;
      nextNoteTimeRef.current += secondsPerBeat;
      beatCountRef.current++;
    }
  }, [bpm, onBeat, scheduleBeat, timeSignature, isPlaying]);

  const start = useCallback((currentBpm: number, context: AudioContext) => {
    if (!context || context.state === 'closed') return;
    setBpm(currentBpm);
    audioContextRef.current = context;
    beatCountRef.current = 0;
    nextNoteTimeRef.current = context.currentTime + 0.1;
    if (schedulerTimerRef.current) {
        clearInterval(schedulerTimerRef.current);
    }
    schedulerTimerRef.current = setInterval(scheduler, 25);
  }, [scheduler]);

  const stop = useCallback(() => {
    if (schedulerTimerRef.current) {
      clearInterval(schedulerTimerRef.current);
      schedulerTimerRef.current = null;
    }
    setCurrentBeat(0);
    onBeat(0, 0); // Signal that metronome has stopped
    audioContextRef.current = null;
  }, [onBeat]);

  useImperativeHandle(ref, () => ({
      start,
      stop
  }));

  useEffect(() => {
    if (!isPlaying) {
      stop();
    }
  }, [isPlaying, stop]);

  useEffect(() => {
    return () => {
      if (schedulerTimerRef.current) {
        clearInterval(schedulerTimerRef.current);
      }
    };
  }, []);

  const handleBpmChange = (value: number[]) => {
    const newBpm = value[0];
    setBpm(newBpm);
    onBpmChange(newBpm);
  }

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <div className="w-full max-w-xs space-y-4">
        <div className='space-y-2'>
          <Label htmlFor="bpm-slider" className="text-center block">{`BPM: ${bpm}`}</Label>
          <Slider
            id="bpm-slider"
            min={40}
            max={200}
            step={1}
            value={[bpm]}
            onValueChange={handleBpmChange}
            disabled={isPlaying}
          />
        </div>
      </div>
      <BeatIndicator timeSignature={timeSignature} currentBeat={currentBeat} isPlaying={isPlaying} />
    </div>
  );
});

Metronome.displayName = "Metronome";

export default Metronome;
