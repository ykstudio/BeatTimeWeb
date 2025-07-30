"use client";

import { useState, useRef, useCallback, ReactNode, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import BeatIndicator from './beat-indicator';
import { Button } from './ui/button';
import { Mic, MicOff } from 'lucide-react';

type Status = 'idle' | 'requesting' | 'listening' | 'denied' | 'error';

interface MetronomeProps {
  onBeat: (beatNumber: number, time: number) => void;
  onBpmChange: (bpm: number) => void;
  onTogglePractice: (isPlaying: boolean, start: (bpm: number) => Promise<AudioContext | null>, stop: () => void) => void;
  status: Status;
}

const Metronome = ({ onBeat, onBpmChange, onTogglePractice, status }: MetronomeProps) => {
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
    setIsPlaying(true);
    beatCountRef.current = 0;
    nextNoteTimeRef.current = context.currentTime + 0.1; 
    
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
    setCurrentBeat(0);
    onBeat(0, 0);
  }, [isPlaying, onBeat]);

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
          onValueChange={handleBpmChange}
          disabled={isPlaying}
        />
      </div>
    </div>
  );

  const beatIndicator = <BeatIndicator timeSignature={timeSignature} currentBeat={currentBeat} isPlaying={isPlaying} />;
  
  return (
    <div className="w-full flex flex-col items-center gap-4">
      {controls}
      {beatIndicator}
      <Button
        onClick={() => onTogglePractice(isPlaying, start, stop)}
        disabled={status === 'requesting'}
        size="lg"
        className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 transform active:scale-95"
      >
        {isPlaying ? <MicOff className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
        <span className="font-bold">{isPlaying ? 'Stop Practice' : 'Start Practice'}</span>
      </Button>
    </div>
  );
};

export default Metronome;
