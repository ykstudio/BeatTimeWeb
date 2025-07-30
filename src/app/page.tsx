
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
import { useAudioData, type AudioAnalysisData } from '@/hooks/use-audio-data';
import { calculateAccuracy, TIMING_WINDOW } from '@/lib/audio';
import LogSettings, { LogSettingsType } from '@/components/log-settings';
import AudioAnalysisDisplay from '@/components/audio-analysis-display';

export type PracticeSession = {
    score: number;
    accuracy: number;
    streak: number;
    hits: number;
    misses: number;
    bpm: number;
};

type Status = 'idle' | 'requesting' | 'listening' | 'denied' | 'error' | 'stopped';

const ONSET_THRESHOLD = 3; // Audio level threshold to trigger a note onset

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
  
  const [logSettings, setLogSettings] = useState<LogSettingsType>({
    metronome: false,
    onsets: false,
    hits: true,
    velocity: false,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const metronomeRef = useRef<MetronomeHandle>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const [audioAnalysisData, setAudioAnalysisData] = useState<AudioAnalysisData>({
    audioLevel: 0,
    frequencyData: new Uint8Array(0),
    dominantFrequency: 0,
  });

  const { start: startVisualizer, stop: stopVisualizer } = useAudioData(setAudioAnalysisData);
  
  const beatTimesRef = useRef<number[]>([]);
  const lastBeatIndexRef = useRef(0);
  const lastOnsetTimeRef = useRef(0);

  const { toast } = useToast();
  
  const handleBeat = (beatNumber: number, time: number) => {
    if (logSettings.metronome && beatNumber > 0) {
      console.log(`Metronome beat ${beatNumber} at time ${time.toFixed(3)}`);
    }
    if (beatNumber > 0 && time > 0) {
      beatTimesRef.current.push(time);
    }
  };

  const processHit = useCallback((onsetTime: number) => {
    const result = calculateAccuracy(onsetTime, beatTimesRef.current, lastBeatIndexRef.current);
    const timingDeltaMs = result.timing * 1000;

    if (result.hit) {
        if (logSettings.hits) console.log(`Hit detected! Timing delta: ${timingDeltaMs.toFixed(2)}ms`);
        setScore(s => s + 10);
        setStreak(s => s + 1);
        setHits(h => h + 1);
        setLastHitTime(onsetTime);
    } else {
        if (logSettings.hits && isFinite(timingDeltaMs)) {
            console.log(`Miss detected. Timing delta: ${timingDeltaMs.toFixed(2)}ms`);
        }
        setStreak(0);
        setMisses(m => m + 1);
    }
    lastBeatIndexRef.current = result.beatIndex;

  }, [logSettings.hits]);

  const stopPractice = useCallback(() => {
    setMetronomeIsPlaying(false);
    if (metronomeRef.current) {
        metronomeRef.current.stop();
    }
    
    stopVisualizer();

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().then(() => {
        audioContextRef.current = null;
      });
    }
    
    setStatus('stopped');
  }, [stopVisualizer]);

  const startPractice = useCallback(async () => {
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
        
        if (context.state === 'suspended') {
            await context.resume();
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        sourceNodeRef.current = context.createMediaStreamSource(stream);
        
        const analyserNode = context.createAnalyser();
        analyserNode.fftSize = 2048; // Increased for better frequency resolution
        sourceNodeRef.current.connect(analyserNode);

        startVisualizer(analyserNode, context);
        
        if (metronomeRef.current) {
            metronomeRef.current.start(currentBpm, context);
            setMetronomeIsPlaying(true);
            setStatus('listening');
        } else {
            throw new Error("Metronome reference not found.");
        }
    } catch (e) {
      console.error("Failed to start practice:", e);
      if (e instanceof Error && e.name === 'NotAllowedError') {
        setStatus('denied');
        toast({ title: "Microphone Access Denied", description: "Please allow microphone access in your browser settings to start.", variant: "destructive" });
      } else {
        setStatus('error');
        toast({ title: "Error", description: "Could not start microphone or metronome.", variant: "destructive" });
      }
      stopPractice();
    }
  }, [currentBpm, toast, stopPractice, startVisualizer]);


  const handleTogglePractice = async () => {
    if (metronomeIsPlaying) {
      stopPractice();
    } else {
      await startPractice();
    }
  };

  // Onset detection using audioLevel
  useEffect(() => {
    if (metronomeIsPlaying && audioContextRef.current) {
      const currentTime = audioContextRef.current.currentTime;
      const cooldown = 0.2; // 200ms cooldown to prevent multiple detections

      if (audioAnalysisData.audioLevel >= ONSET_THRESHOLD && (currentTime - lastOnsetTimeRef.current > cooldown)) {
        if(logSettings.onsets) console.log(`Onset detected at time: ${currentTime.toFixed(3)} with level: ${audioAnalysisData.audioLevel}`);
        lastOnsetTimeRef.current = currentTime;
        processHit(currentTime);
      }
    }
  }, [audioAnalysisData.audioLevel, metronomeIsPlaying, processHit, logSettings.onsets]);

  useEffect(() => {
    return () => {
      if (micStreamRef.current || audioContextRef.current) {
          stopPractice();
      }
    };
  }, [stopPractice]);

  useEffect(() => {
    if (hits > 0 || misses > 0) {
        const newAccuracy = Math.round((hits / (hits + misses)) * 100);
        setAccuracy(newAccuracy);
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
      localStorage.setItem('bestStreak', streak.toString());
    }
  }, [streak, bestStreak]);

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 gap-4">
      <div className="w-full max-w-md h-[30vh]">
        <Card className="w-full h-full shadow-lg flex flex-col">
          <CardHeader className="text-center relative">
            <CardTitle className="text-3xl font-bold font-headline">BeatTime</CardTitle>
            <CardDescription>Real-time rhythm training for musicians.</CardDescription>
            <div className="absolute top-4 right-4">
              <StatusIndicator status={status} />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 pt-2 flex-grow">
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
              logSettings={logSettings}
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
      </div>
      
      <div className="w-full max-w-4xl h-[60vh]">
        <AudioAnalysisDisplay 
          analysisData={audioAnalysisData}
          logSettings={logSettings}
        />
      </div>

      <LogSettings settings={logSettings} onChange={setLogSettings} />
    </main>
  );
}

