
"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Metronome, { type MetronomeHandle } from '@/components/metronome';
import { Mic, MicOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import StatusIndicator from '@/components/status-indicator';
import AudioVisualizer from '@/components/audio-visualizer';
import ResultsDisplay from '@/components/results-display';
import { calculateAccuracy } from '@/lib/audio';
import { useAudioData } from '@/hooks/use-audio-data';

export type PracticeSession = {
    score: number;
    accuracy: number;
    streak: number;
    hits: number;
    misses: number;
    bpm: number;
};

type Status = 'idle' | 'requesting' | 'listening' | 'denied' | 'error' | 'stopped';

const SENSITIVITY = 0.5; // Onset detection sensitivity
const MIN_SILENCE_DURATION = 0.1; // seconds

export default function Home() {
  const [metronomeIsPlaying, setMetronomeIsPlaying] = useState(false);
  const [currentBpm, setCurrentBpm] = useState(120);
  const [status, setStatus] = useState<Status>('idle');
  
  // Practice results state
  const [score, setScore] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [lastHitTime, setLastHitTime] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const metronomeRef = useRef<MetronomeHandle>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const { audioData, start: startVisualizer, stop: stopVisualizer, analyserNodeRef } = useAudioData();
  
  const beatTimesRef = useRef<number[]>([]);
  const lastBeatIndexRef = useRef(0);
  const lastOnsetRef = useRef(0);

  const { toast } = useToast();
  
  const handleBeat = (beatNumber: number, time: number) => {
    if (beatNumber > 0 && time > 0) {
      console.log(`page.tsx: Metronome beat ${beatNumber} at time ${time.toFixed(3)}`);
      beatTimesRef.current.push(time);
    }
  };

  const processOnsets = useCallback((audioBuffer: AudioBuffer) => {
    if (!audioContextRef.current || !metronomeIsPlaying) return;

    const now = audioContextRef.current.currentTime;
    if (now - lastOnsetRef.current < MIN_SILENCE_DURATION) {
      return;
    }

    const data = audioBuffer.getChannelData(0);
    const rms = Math.sqrt(data.reduce((acc, val) => acc + val * val, 0) / data.length);
    
    if (rms > SENSITIVITY / 10) { // Adjust sensitivity mapping
      lastOnsetRef.current = now;
      console.log(`page.tsx: Onset detected at time: ${now.toFixed(3)} with RMS: ${rms.toFixed(3)}`);
      
      const result = calculateAccuracy(now, beatTimesRef.current, lastBeatIndexRef.current);
      console.log("page.tsx: Accuracy calculation result:", result);

      if (result.hit) {
        setHits(prev => prev + 1);
        const newStreak = streak + 1;
        setStreak(newStreak);
        console.log(`page.tsx: Hit! New streak: ${newStreak}`);
        setScore(prev => prev + 10); // Simple scoring
        setLastHitTime(now); // For animation
        lastBeatIndexRef.current = result.beatIndex;
      } else {
        // Only count a miss if an audible onset was detected but it was off-beat.
        setMisses(prev => prev + 1);
        if (streak > 0) {
            console.log(`page.tsx: Miss! Streak reset from ${streak} to 0.`);
        }
        setStreak(0);
      }
    }
  }, [metronomeIsPlaying, beatTimesRef, lastBeatIndexRef, hits, misses, score, streak]);


  const stopPractice = useCallback(() => {
    console.log("page.tsx: stopPractice called");
    
    setMetronomeIsPlaying(false);
    if (metronomeRef.current) {
        metronomeRef.current.stop();
    }
    
    stopVisualizer();

    if (processorNodeRef.current) {
        processorNodeRef.current.disconnect();
        processorNodeRef.current = null;
        console.log("page.tsx: Disconnecting ScriptProcessorNode.");
    }
    if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
        micStreamRef.current = null;
        console.log("page.tsx: Stopping microphone stream tracks.");
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      console.log(`page.tsx: Closing AudioContext. Current state: ${audioContextRef.current.state}`);
      audioContextRef.current.close().then(() => {
        console.log("page.tsx: AudioContext closed.");
        audioContextRef.current = null;
      });
    }
    
    if (streak > bestStreak) {
        setBestStreak(streak);
    }
    setStatus('stopped');
  }, [streak, bestStreak, stopVisualizer]);

  const startPractice = useCallback(async () => {
    console.log("page.tsx: startPractice called");
    setStatus('requesting');
    beatTimesRef.current = [];
    lastBeatIndexRef.current = 0;
    setScore(0);
    setAccuracy(0);
    setStreak(0);
    setHits(0);
    setMisses(0);

    try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = context;
        console.log(`page.tsx: AudioContext state is '${context.state}'`);

        if (context.state === 'suspended') {
            await context.resume();
        }

        // --- Microphone Setup ---
        console.log("page.tsx: Requesting microphone access...");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        const source = context.createMediaStreamSource(stream);
        
        // Setup Analyser for visualization
        startVisualizer(context, source);
        
        // Setup ScriptProcessor for onset detection
        const bufferSize = 1024;
        processorNodeRef.current = context.createScriptProcessor(bufferSize, 1, 1);
        processorNodeRef.current.onaudioprocess = (e) => processOnsets(e.inputBuffer);
        
        // --- Audio Graph Connection ---
        if (analyserNodeRef.current) {
            analyserNodeRef.current.connect(processorNodeRef.current);
            console.log("page.tsx: AnalyserNode connected to ScriptProcessorNode.");
        } else {
            // Fallback if visualizer is somehow not ready
            source.connect(processorNodeRef.current);
        }
        
        processorNodeRef.current.connect(context.destination); 
        console.log("page.tsx: ScriptProcessorNode connected to destination.");

        console.log("page.tsx: Microphone setup complete.");

        if (metronomeRef.current) {
            metronomeRef.current.start(currentBpm, context);
            setMetronomeIsPlaying(true);
            setStatus('listening');
        } else {
            throw new Error("Metronome reference not found.");
        }
    } catch (e) {
      console.error("page.tsx: Failed to start practice:", e);
      if (e instanceof Error && e.name === 'NotAllowedError') {
        setStatus('denied');
        toast({ title: "Microphone Access Denied", description: "Please allow microphone access in your browser settings to start.", variant: "destructive" });
      } else {
        setStatus('error');
        toast({ title: "Error", description: "Could not start microphone or metronome.", variant: "destructive" });
      }
      stopPractice();
    }
  }, [currentBpm, toast, processOnsets, stopPractice, startVisualizer, analyserNodeRef]);


  const handleTogglePractice = async () => {
    console.log(`page.tsx: handleTogglePractice called. metronomeIsPlaying: ${metronomeIsPlaying}`);
    if (metronomeIsPlaying) {
      stopPractice();
    } else {
      await startPractice();
    }
  };

  useEffect(() => {
    // Cleanup on component unmount
    return () => {
      console.log("page.tsx: Unmounting component, ensuring cleanup.");
      stopPractice();
    };
  }, [stopPractice]);

  useEffect(() => {
    if (hits > 0 || misses > 0) {
        const newAccuracy = Math.round((hits / (hits + misses)) * 100);
        setAccuracy(newAccuracy);
        console.log(`page.tsx: Accuracy updated: ${newAccuracy}% (${hits} hits, ${misses} misses)`);
    } else {
        setAccuracy(0);
    }
  }, [hits, misses]);

  useEffect(() => {
    const storedBestStreak = localStorage.getItem('bestStreak');
    if (storedBestStreak) {
        setBestStreak(parseInt(storedBestStreak, 10));
    }
  }, []);

  useEffect(() => {
    if (streak > bestStreak) {
      setBestStreak(streak);
    }
  }, [streak, bestStreak]);

  useEffect(() => {
    localStorage.setItem('bestStreak', bestStreak.toString());
  }, [bestStreak]);

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center relative">
          <CardTitle className="text-3xl font-bold font-headline">BeatTime</CardTitle>
          <CardDescription>Real-time rhythm training for musicians.</CardDescription>
          <div className="absolute top-4 right-4">
            <StatusIndicator status={status} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 pt-2">
          <AudioVisualizer audioData={audioData} />
          <ResultsDisplay
            score={score}
            accuracy={accuracy}
            streak={streak}
            bestStreak={bestStreak}
            lastHitTime={lastHitTime}
          />
          <Metronome
            ref={metronomeRef}
            onBeat={handleBeat}
            initialBpm={currentBpm}
            onBpmChange={setCurrentBpm}
            isPlaying={metronomeIsPlaying}
          />
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleTogglePractice}
            size="lg"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 transform active:scale-95"
            disabled={status === 'requesting'}
          >
            {metronomeIsPlaying ? <MicOff className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
            <span className="font-bold">{metronomeIsPlaying ? 'Stop Practice' : 'Start Practice'}</span>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

    