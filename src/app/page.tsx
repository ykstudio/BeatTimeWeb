"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import AudioVisualizer from '@/components/audio-visualizer';
import StatusIndicator from '@/components/status-indicator';
import Metronome from '@/components/metronome';
import ResultsDisplay from '@/components/results-display';
import { Mic, MicOff, History, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { detectOnsets, calculateAccuracy, TIMING_WINDOW } from '@/lib/audio';

type Status = 'idle' | 'requesting' | 'listening' | 'denied' | 'error';
export type PracticeSession = {
  id: string;
  date: number;
  bpm: number;
  score: number;
  hits: number;
  misses: number;
  streak: number;
  accuracy: number;
  timings: number[];
};
type View = 'practice' | 'summary';

export default function Home() {
  const [status, setStatus] = useState<Status>('idle');
  const [view, setView] = useState<View>('practice');
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(0));
  
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [timings, setTimings] = useState<number[]>([]);
  const [lastHitTime, setLastHitTime] = useState(0);
  const [currentBpm, setCurrentBpm] = useState(120);

  const [session, setSession] = useState<PracticeSession | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const onsetProcessorRef = useRef<AudioWorkletNode | null>(null);
  
  const beatTimesRef = useRef<number[]>([]);
  const lastBeatIndexRef = useRef<number>(0);
  
  const { toast } = useToast();

  useEffect(() => {
    setBestStreak(parseInt(localStorage.getItem('bestStreak') || '0', 10));
  }, []);

  const resetPracticeState = () => {
    setScore(0);
    setHits(0);
    setMisses(0);
    setStreak(0);
    setAccuracy(0);
    setTimings([]);
    setLastHitTime(0);
    beatTimesRef.current = [];
    lastBeatIndexRef.current = 0;
  };

  const cleanupMic = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    if (onsetProcessorRef.current) {
        onsetProcessorRef.current.disconnect();
        onsetProcessorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    
    analyserRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
    animationFrameIdRef.current = null;
    setFrequencyData(new Uint8Array(0));
  }, []);
  
  const handleOnset = useCallback((onsetTime: number) => {
    if (!audioContextRef.current) return;
    
    const { hit, timing, beatIndex } = calculateAccuracy(onsetTime, beatTimesRef.current, lastBeatIndexRef.current);
    
    if (beatIndex > lastBeatIndexRef.current) {
        lastBeatIndexRef.current = beatIndex;

        if (hit) {
            setScore(s => s + 10);
            setHits(h => h + 1);
            setStreak(s => {
                const newStreak = s + 1;
                if (newStreak > bestStreak) {
                    setBestStreak(newStreak);
                    localStorage.setItem('bestStreak', newStreak.toString());
                }
                return newStreak;
            });
            setLastHitTime(Date.now());
        } else {
            setMisses(m => m + 1);
            setStreak(0);
        }
        setTimings(t => [...t, timing]);
    }

  }, [bestStreak]);

  const startMicrophone = useCallback(async (context: AudioContext) => {
    cleanupMic();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const source = context.createMediaStreamSource(stream);
      sourceRef.current = source;

      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      await context.audioWorklet.addModule('/audio-processor.js');
      const onsetProcessor = new AudioWorkletNode(context, 'onset-processor');
      onsetProcessorRef.current = onsetProcessor;

      onsetProcessor.port.onmessage = (event) => {
          if (event.data.type === 'onset') {
              handleOnset(event.data.onsetTime);
          }
      };

      source.connect(analyser);
      source.connect(onsetProcessor);

      const animate = () => {
        if (analyserRef.current) {
          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyserRef.current.getByteFrequencyData(dataArray);
          setFrequencyData(dataArray);
          animationFrameIdRef.current = requestAnimationFrame(animate);
        }
      };
      
      animate();
      return true;

    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      let message = "An unknown error occurred while accessing the microphone."
      if (err.name === 'NotAllowedError') {
        setStatus('denied');
        message = "Microphone permission was denied. Please allow microphone access in your browser settings.";
      } else if (err.message.includes('module')) {
        setStatus('error');
        message = "Failed to load the audio processor. Please try refreshing the page.";
      } else {
        setStatus('error');
      }
      toast({
          title: "Error",
          description: message,
          variant: "destructive"
      });
      return false;
    }
  }, [cleanupMic, handleOnset, toast]);
  
  const saveSession = useCallback((sessionData: PracticeSession) => {
    const history: PracticeSession[] = JSON.parse(localStorage.getItem('practiceHistory') || '[]');
    const newHistory = [sessionData, ...history].slice(0, 10); // Keep last 10 sessions
    localStorage.setItem('practiceHistory', JSON.stringify(newHistory));
    
    const bestScore = parseInt(localStorage.getItem('bestScore') || '0', 10);
    if (sessionData.score > bestScore) {
      localStorage.setItem('bestScore', sessionData.score.toString());
    }
  }, []);

  const handleTogglePractice = async (metronomeIsPlaying: boolean, startMetronome: (bpm: number) => Promise<AudioContext | null>, stopMetronome: () => void) => {
    if (metronomeIsPlaying) {
      stopMetronome();
      
      const sessionData: PracticeSession = {
        id: new Date().toISOString(),
        date: Date.now(),
        bpm: currentBpm,
        score,
        hits,
        misses,
        streak,
        accuracy,
        timings
      };
      setSession(sessionData);
      saveSession(sessionData);

      cleanupMic();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setStatus('idle');
      setView('summary');
    } else {
      resetPracticeState();
      setStatus('requesting');
      const context = await startMetronome(currentBpm);
      if (context) {
        audioContextRef.current = context;
        const micStarted = await startMicrophone(context);
        if (micStarted) {
          setStatus('listening');
        } else {
          stopMetronome();
          cleanupMic();
          if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
          }
        }
      } else {
        setStatus('error');
      }
    }
  };
  
  const handleBeat = (beat: number, time: number) => {
    if(beat > 0 && time > 0) {
      beatTimesRef.current.push(time);
    }
  }

  useEffect(() => {
    if(hits + misses > 0) {
        setAccuracy(Math.round((hits / (hits + misses)) * 100));
    } else {
        setAccuracy(0);
    }
  }, [hits, misses]);

  useEffect(() => {
    return () => {
      cleanupMic();
       if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [cleanupMic]);

  const PracticeView = () => (
    <>
    <CardHeader className="text-center relative">
      <CardTitle className="text-3xl font-bold font-headline">BeatTime</CardTitle>
      <CardDescription>Real-time rhythm training for musicians.</CardDescription>
       <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={() => toast({ title: "Coming Soon!", description: "Practice history will be shown here." })}>
          <History className="h-5 w-5" />
        </Button>
    </CardHeader>
    <CardContent className="flex flex-col items-center gap-4 pt-2">
      <AudioVisualizer frequencyData={frequencyData} />
      <StatusIndicator status={status} />
      <ResultsDisplay score={score} accuracy={accuracy} streak={streak} bestStreak={bestStreak} lastHitTime={lastHitTime} />
      <Metronome
        onBeat={handleBeat}
        onBpmChange={setCurrentBpm}
        render={({ isPlaying, start, stop, controls, beatIndicator }) => (
          <div className="w-full flex flex-col items-center gap-4">
            {controls}
            {beatIndicator}
            <Button
              onClick={() => handleTogglePractice(isPlaying, start, stop)}
              disabled={status === 'requesting'}
              size="lg"
              className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 transform active:scale-95"
            >
              {isPlaying ? <MicOff className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
              <span className="font-bold">{isPlaying ? 'Stop Practice' : 'Start Practice'}</span>
            </Button>
          </div>
        )}
       />
    </CardContent>
    </>
  );
  
  const SummaryView = () => (
    <>
      <CardHeader>
          <div className="flex items-center justify-between">
              <CardTitle className="text-3xl font-bold font-headline">Session Summary</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setView('practice')}>
                  <ArrowLeft className="h-5 w-5" />
              </Button>
          </div>
          <CardDescription>Here's how you did in your last session.</CardDescription>
      </CardHeader>
      <CardContent>
          {session && <SummaryDisplay session={session} />}
      </CardContent>
      <CardFooter>
          <Button className="w-full" onClick={() => setView('practice')}>
              Start New Practice
          </Button>
      </CardFooter>
    </>
  )

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        {view === 'practice' ? <PracticeView /> : <SummaryView />}
      </Card>
    </main>
  );
}

const SummaryDisplay = ({ session }: { session: PracticeSession }) => (
  <div className="grid grid-cols-2 gap-4 text-center">
      <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">Score</p>
          <p className="text-2xl font-bold">{session.score}</p>
      </div>
      <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">Accuracy</p>
          <p className="text-2xl font-bold">{session.accuracy}%</p>
      </div>
      <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">BPM</p>
          <p className="text-2xl font-bold">{session.bpm}</p>
      </div>
      <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">Best Streak</p>
          <p className="text-2xl font-bold">{session.streak}</p>
      </div>
      <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">Hits</p>
          <p className="text-2xl font-bold">{session.hits}</p>
      </div>
      <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">Misses</p>
          <p className="text-2xl font-bold">{session.misses}</p>
      </div>
  </div>
);
