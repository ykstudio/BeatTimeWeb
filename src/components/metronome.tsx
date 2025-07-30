"use client";

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import BeatIndicator from './beat-indicator';

type Status = 'idle' | 'requesting' | 'listening' | 'denied' | 'error';

interface MetronomeProps {
  onBeat: (beatNumber: number, time: number) => void;
  onBpmChange: (bpm: number) => void;
  isPlaying: boolean;
  status: Status;
}

export interface MetronomeHandle {
  start: (bpm: number) => Promise<AudioContext | null>;
  stop: () => void;
}

const Metronome = forwardRef<MetronomeHandle, MetronomeProps>(({ onBeat, onBpmChange, isPlaying, status }, ref) => {
  const [bpm, setBpm] = useState(120);
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
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;

    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + 0.1) {
      const beatInBar = (beatCountRef.current % timeSignature) + 1;
      onBeat(beatInBar, nextNoteTimeRef.current);
      setCurrentBeat(beatInBar);
      scheduleBeat(beatInBar, nextNoteTimeRef.current);
      
      const secondsPerBeat = 60.0 / bpm;
      nextNoteTimeRef.current += secondsPerBeat;
      beatCountRef.current++;
    }
  }, [bpm, onBeat, scheduleBeat, timeSignature]);

  const start = useCallback(async (currentBpm: number): Promise<AudioContext | null> => {
    if (isPlaying) return null;

    setBpm(currentBpm);
    
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (context.state === 'suspended') {
      await context.resume();
    }

    audioContextRef.current = context;
    beatCountRef.current = 0;
    nextNoteTimeRef.current = context.currentTime + 0.1; 
    
    schedulerTimerRef.current = setInterval(scheduler, 25);
    
    return context;
  }, [isPlaying, scheduler]);

  const stop = useCallback(() => {
    if (!isPlaying && !schedulerTimerRef.current) return;

    if (schedulerTimerRef.current) {
      clearInterval(schedulerTimerRef.current);
      schedulerTimerRef.current = null;
    }
    setCurrentBeat(0);
    onBeat(0, 0);
  }, [isPlaying, onBeat]);

  useImperativeHandle(ref, () => ({
      start,
      stop
  }));

  useEffect(() => {
    return () => {
      if (schedulerTimerRef.current) {
        clearInterval(schedulerTimerRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
      if (!isPlaying) {
          stop();
      }
  }, [isPlaying, stop])

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
