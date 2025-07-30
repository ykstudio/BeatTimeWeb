"use client";

import { useState, useRef, useCallback, ReactNode, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import BeatIndicator from './beat-indicator';

interface MetronomeProps {
  onBeat: (beatNumber: number) => void;
  render: (props: {
    isPlaying: boolean;
    start: () => Promise<AudioContext | null>;
    stop: () => void;
    controls: ReactNode;
    beatIndicator: ReactNode;
  }) => ReactNode;
}

const Metronome = ({ onBeat, render }: MetronomeProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
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

    // First beat of the bar is higher pitch
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
      onBeat(beatInBar);
      setCurrentBeat(beatInBar);
      scheduleBeat(beatInBar, nextNoteTimeRef.current);
      
      const secondsPerBeat = 60.0 / bpm;
      nextNoteTimeRef.current += secondsPerBeat;
      beatCountRef.current++;
    }
  }, [bpm, onBeat, scheduleBeat, timeSignature]);

  const start = useCallback(async (): Promise<AudioContext | null> => {
    if (isPlaying) return null;
    
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (context.state === 'suspended') {
      await context.resume();
    }

    audioContextRef.current = context;
    setIsPlaying(true);
    beatCountRef.current = 0;
    nextNoteTimeRef.current = context.currentTime + 0.1; // Add a small delay to start
    
    schedulerTimerRef.current = setInterval(scheduler, 25);
    
    return context;
  }, [isPlaying, scheduler]);

  const stop = useCallback(() => {
    if (!isPlaying) return;

    setIsPlaying(false);
    if (schedulerTimerRef.current) {
      clearInterval(schedulerTimerRef.current);
      schedulerTimerRef.current = null;
    }
    // The AudioContext is closed by the parent component that creates it.
    setCurrentBeat(0);
    onBeat(0);
  }, [isPlaying, onBeat]);

  useEffect(() => {
    return () => {
      if (schedulerTimerRef.current) {
        clearInterval(schedulerTimerRef.current);
      }
    };
  }, []);

  const controls = (
    <div className="w-full max-w-xs space-y-4">
      <div className='space-y-2'>
        <Label htmlFor="bpm-slider" className="text-center block">{`BPM: ${bpm}`}</Label>
        <Slider
          id="bpm-slider"
          min={40}
          max={200}
          step={1}
          value={[bpm]}
          onValueChange={(value) => setBpm(value[0])}
          disabled={isPlaying}
        />
      </div>
    </div>
  );

  const beatIndicator = <BeatIndicator timeSignature={timeSignature} currentBeat={currentBeat} isPlaying={isPlaying} />;
  
  return render({ isPlaying, start, stop, controls, beatIndicator });
};

export default Metronome;
