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
import { calculateAccuracy } from '@/lib/audio';
import SummaryDisplay from '@/components/summary-display';

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
  const [metronomeIsPlaying, setMetronomeIsPlaying] = useState(false);
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
  const metronomeRef = useRef<{ start: (bpm: number) => Promise<AudioContext | null>, stop: () => void }>(null);
  
  const beatTimesRef = useRef<number[]>([]);
  const lastBeatIndexRef = useRef<number>(0);
  
  const { toast } = useToast();

  useEffect(() => {
    setBestStreak(parseInt(localStorage.getItem('bestStreak') || '0', 10));
  }, []);
  
  useEffect(() => {
    if(hits + misses > 0) {
        setAccuracy(Math.round((hits / (hits + misses)) * 100));
    } else {
        setAccuracy(0);
    }
  }, [hits, misses]);

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
      animationFrameIdRef.current = null;
    }
    if (onsetProcessorRef.current) {
        onsetProcessorRef.current.port.onmessage = null;
        onsetProcessorRef.current.disconnect();
        onsetProcessorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    analyserRef.current = null;
    setFrequencyData(new Uint8Array(0));
  }, []);
  
  const handleOnset = useCallback((onsetTime: number) => {
    if (!audioContextRef.current) return;
    
    const { hit, timing, beatIndex } = calculateAccuracy(onsetTime, beatTimesRef.current, lastBeatIndexRef.current);
    
    if (beatIndex > lastBeatIndexRef.current) {
        lastBeatIndexRef.current = beatIndex;

        setTimings(t => [...t, timing]);
        if (hit) {
            setScore(s => s + 10);
            setHits(h => h + 1);
            setStreak(s => {
                const newStreak = s + 1;
                setBestStreak(bs => {
                    if (newStreak > bs) {
                        localStorage.setItem('bestStreak', newStreak.toString());
                        return newStreak;
                    }
                    return bs;
                });
                return newStreak;
            });
            setLastHitTime(Date.now());
        } else {
            setMisses(m => m + 1);
            setStreak(0);
        }
    }
  }, []);

  const startMicrophone = useCallback(async (context: AudioContext) => {
    cleanupMic();
    try {
      if (!context.audioWorklet) {
        throw new Error("AudioWorklet not supported");
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      
      const source = context.createMediaStreamSource(stream);
      sourceRef.current = source;

      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      try {
        await context.audioWorklet.addModule('/audio-processor.js');
      } catch (e) {
        console.error("Error adding AudioWorklet module", e);
        throw new Error("Failed to load audio processor module.");
      }

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
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
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
      cleanupMic();
      return false;
    }
  }, [cleanupMic, handleOnset, toast]);
  
  const saveSession = useCallback(() => {
    try {
      const finalAccuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0;
      const finalBestStreak = parseInt(localStorage.getItem('bestStreak') || '0', 10);
      const sessionData: PracticeSession = {
          id: new Date().toISOString(),
          date: Date.now(),
          bpm: currentBpm,
          score,
          hits,
          misses,
          streak: finalBestStreak,
          accuracy: finalAccuracy,
          timings
      };
      setSession(sessionData);

      const history: PracticeSession[] = JSON.parse(localStorage.getItem('practiceHistory') || '[]');
      const newHistory = [sessionData, ...history].slice(0, 10); // Keep last 10 sessions
      localStorage.setItem('practiceHistory', JSON.stringify(newHistory));
      
      const bestScore = parseInt(localStorage.getItem('bestScore') || '0', 10);
      if (sessionData.score > bestScore) {
        localStorage.setItem('bestScore', sessionData.score.toString());
      }
    } catch (error) {
      console.error("Failed to save session:", error);
      toast({
        title: "Error",
        description: "Could not save your session history.",
        variant: "destructive",
      });
    }
  }, [toast, hits, misses, score, timings, currentBpm]);

  const handleTogglePractice = async () => {
    if (metronomeIsPlaying) {
      metronomeRef.current?.stop();
      saveSession();
      cleanupMic();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setStatus('idle');
      setMetronomeIsPlaying(false);
      setView('summary');
    } else {
      resetPracticeState();
      setStatus('requesting');
      const context = await metronomeRef.current?.start(currentBpm);
      if (context) {
        audioContextRef.current = context;
        const micStarted = await startMicrophone(context);
        if (micStarted) {
          setStatus('listening');
          setMetronomeIsPlaying(true);
        } else {
          metronomeRef.current?.stop();
          cleanupMic();
          if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            await audioContextRef.current.close();
            audioContextRef.current = null;
          }
           setStatus('idle');
           setMetronomeIsPlaying(false);
        }
      } else {
        setStatus('error');
        setMetronomeIsPlaying(false);
      }
    }
  };
  
  const handleBeat = (beat: number, time: number) => {
    if(beat > 0 && time > 0) {
      beatTimesRef.current.push(time);
    }
  }

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
        ref={metronomeRef}
        onBeat={handleBeat}
        onBpmChange={setCurrentBpm}
        isPlaying={metronomeIsPlaying}
        status={status}
      />
    </CardContent>
    <CardFooter>
      <Button
        onClick={handleTogglePractice}
        disabled={status === 'requesting'}
        size="lg"
        className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 transform active:scale-95"
      >
        {metronomeIsPlaying ? <MicOff className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
        <span className="font-bold">{metronomeIsPlaying ? 'Stop Practice' : 'Start Practice'}</span>
      </Button>
    </CardFooter>
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
          <Button className="w-full" onClick={() => { setView('practice'); resetPracticeState(); }}>
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
