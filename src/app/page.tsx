
"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Metronome, { type MetronomeHandle } from '@/components/metronome';
import { Mic, MicOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import StatusIndicator from '@/components/status-indicator';
import ResultsDisplay from '@/components/results-display';
import { useAudioData, type AudioAnalysisData } from '@/hooks/use-audio-data';
import { calculateAccuracy, TIMING_WINDOW } from '@/lib/audio';
import LogSettings, { LogSettingsType } from '@/components/log-settings';
import RhythmControls, { RhythmControlsType } from '@/components/rhythm-controls';
import AudioAnalysisDisplay from '@/components/audio-analysis-display';
import RhythmMatrix from '@/components/rhythm-matrix';
import SongGrid from '@/components/song-grid';

export type PracticeSession = {
    score: number;
    accuracy: number;
    streak: number;
    hits: number;
    misses: number;
    bpm: number;
};

type Status = 'idle' | 'requesting' | 'listening' | 'denied' | 'error' | 'stopped';

const ONSET_THRESHOLD = 1; // Audio level threshold to trigger a note onset - Made more sensitive for testing

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
  
  // Rhythm feedback state
  const [fourBeatAccuracy, setFourBeatAccuracy] = useState(0);
  const [songGridColors, setSongGridColors] = useState<string[]>([]);
  const [currentMeasureHits, setCurrentMeasureHits] = useState(0);
  const [currentMeasureBeats, setCurrentMeasureBeats] = useState(0);
  const [currentMeasureTimingScores, setCurrentMeasureTimingScores] = useState<number[]>([]);
  const currentMeasureTimingScoresRef = useRef<number[]>([]);
  
  const [logSettings, setLogSettings] = useState<LogSettingsType>({
    metronome: true,
    onsets: true,
    hits: true,
    velocity: true,
    beats: true,
    measures: true,
    timingQuality: true,
    songGrid: true,
  });

  const [rhythmControls, setRhythmControls] = useState<RhythmControlsType>({
    hitContribution: 85,
    missContribution: 0,
    timingWindowMs: 200,
    timingWindow: 0.2,
    onsetThreshold: 1,
    streak2Bonus: 10,
    streak3Bonus: 15,
    streak5Bonus: 25,
    greenThreshold: 70,
    yellowThreshold: 50,
    orangeThreshold: 25,
    emptyMeasureMin: 20,
    emptyMeasureMax: 40,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const metronomeRef = useRef<MetronomeHandle>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const [audioAnalysisData, setAudioAnalysisData] = useState<AudioAnalysisData>({
    audioLevel: 0,
    frequencyData: new Uint8Array(0),
    dominantFrequency: 0,
    spectralCentroid: 0,
  });

  const { start: startVisualizer, stop: stopVisualizer } = useAudioData(setAudioAnalysisData);
  
  const beatTimesRef = useRef<number[]>([]);
  const lastBeatIndexRef = useRef(0);
  const lastOnsetTimeRef = useRef(0);
  const beatCountRef = useRef(0);

  const { toast } = useToast();
  
  // Convert accuracy percentage to color class for song grid (using rhythm controls)
  const getAccuracyColorClass = useCallback((accuracy: number): string => {
    if (accuracy >= rhythmControls.greenThreshold) return 'bg-green-500';
    if (accuracy >= rhythmControls.yellowThreshold) return 'bg-yellow-500';
    if (accuracy >= rhythmControls.orangeThreshold) return 'bg-orange-500';
    return 'bg-red-500';
  }, [rhythmControls.greenThreshold, rhythmControls.yellowThreshold, rhythmControls.orangeThreshold]);

  // Handle beat events from metronome for rhythm feedback
  const handleBeat = useCallback((beatNumber: number, time: number) => {
    if (beatNumber > 0 && time > 0) {
      beatTimesRef.current.push(time);
      beatCountRef.current += 1;
      setCurrentMeasureBeats(prev => prev + 1);
      if (logSettings.beats) {
        console.log(`🥁 BEAT ${beatNumber}: Total beats: ${beatCountRef.current}, Measure beat: ${(beatCountRef.current % 4) || 4}/4`);
      }
      
      // Every 4 beats (end of measure), calculate accuracy and update song grid
      if (beatCountRef.current % 4 === 0) {
        if (logSettings.measures) {
          console.log(`\n🎼 MEASURE COMPLETE (Beat ${beatCountRef.current})`);
          console.log(`📊 Current measure timing scores (state):`, currentMeasureTimingScores);
          console.log(`📊 Current measure timing scores (ref):`, currentMeasureTimingScoresRef.current);
          console.log(`📈 Current streak: ${streak}, hits: ${hits}, misses: ${misses}`);
        }
        
        // Calculate measure accuracy using hit/miss contributions from rhythm controls
        let measureAccuracy = 0;
        const timingScores = currentMeasureTimingScoresRef.current;
        
        if (timingScores.length > 0) {
          // Calculate based on hit/miss contributions (much simpler and more predictable)
          let totalContribution = 0;
          let hitCount = 0;
          let missCount = 0;
          
          timingScores.forEach(score => {
            if (score > 0) {
              // This was a hit - use hit contribution
              totalContribution += rhythmControls.hitContribution;
              hitCount++;
            } else {
              // This was a miss - use miss contribution
              totalContribution += rhythmControls.missContribution;
              missCount++;
            }
          });
          
          measureAccuracy = Math.round(totalContribution / timingScores.length);
          if (logSettings.measures) {
            console.log(`🎯 Measure calculation: ${hitCount} hits (${rhythmControls.hitContribution}% each) + ${missCount} misses (${rhythmControls.missContribution}% each) = ${measureAccuracy}%`);
          }
        } else {
          // No beats detected in this measure - use empty measure defaults
          const sessionAccuracy = hits > 0 ? Math.round((hits / (hits + misses)) * 100) : 0;
          measureAccuracy = Math.max(rhythmControls.emptyMeasureMin, Math.min(rhythmControls.emptyMeasureMax, sessionAccuracy));
          if (logSettings.measures) {
            console.log(`❌ No beats in measure, using empty measure default: ${measureAccuracy}%`);
          }
        }
        
        // Add configurable streak bonuses to reward consistency
        const originalAccuracy = measureAccuracy;
        if (streak >= 5) {
          measureAccuracy = Math.min(100, measureAccuracy + rhythmControls.streak5Bonus);
          if (logSettings.measures) {
            console.log(`⬆️ High streak bonus: ${originalAccuracy}% -> ${measureAccuracy}%`);
          }
        } else if (streak >= 3) {
          measureAccuracy = Math.min(100, measureAccuracy + rhythmControls.streak3Bonus);
          if (logSettings.measures) {
            console.log(`⬆️ Good streak bonus: ${originalAccuracy}% -> ${measureAccuracy}%`);
          }
        } else if (streak >= 2) {
          measureAccuracy = Math.min(100, measureAccuracy + rhythmControls.streak2Bonus);
          if (logSettings.measures) {
            console.log(`⬆️ Streak bonus: ${originalAccuracy}% -> ${measureAccuracy}%`);
          }
        }
        // Configurable bonuses - adjust via controls to find perfect balance
        
        setFourBeatAccuracy(measureAccuracy);
        
        // Add this measure's color to the song grid
        const colorClass = getAccuracyColorClass(measureAccuracy);
        if (logSettings.songGrid) {
          console.log(`🎨 Song Grid: Adding measure ${songGridColors.length + 1} with ${measureAccuracy}% accuracy, color: ${colorClass}`);
        }
        setSongGridColors(prev => {
          const newColors = [...prev, colorClass];
          if (logSettings.songGrid) {
            console.log(`🗺️ Song Grid now has ${newColors.length} squares:`, newColors);
          }
          return newColors;
        });
        
        // Reset measure counters
        setCurrentMeasureHits(0);
        setCurrentMeasureBeats(0);
        setCurrentMeasureTimingScores([]);
        currentMeasureTimingScoresRef.current = [];
        console.log(`🔄 Reset measure counters\n`);
      }
    }
  }, [logSettings.metronome, hits, misses, streak, getAccuracyColorClass]);

  const processHit = useCallback((onsetTime: number) => {
    const result = calculateAccuracy(onsetTime, beatTimesRef.current, lastBeatIndexRef.current);
    const timingDeltaMs = result.timing * 1000;

    if (result.hit) {
        if (logSettings.hits) console.log(`Hit detected! Timing delta: ${timingDeltaMs.toFixed(2)}ms`);
        setScore(s => s + 10);
        setStreak(s => s + 1);
        setHits(h => h + 1);
        setCurrentMeasureHits(prev => prev + 1);
        setLastHitTime(onsetTime);
        
        // Calculate timing quality score (0-100) based on how close to perfect timing
        const timingQuality = Math.max(0, 100 - (Math.abs(result.timing) / rhythmControls.timingWindow) * 100);
        setCurrentMeasureTimingScores(prev => {
          const newScores = [...prev, timingQuality];
          currentMeasureTimingScoresRef.current = newScores;
          if (logSettings.timingQuality) {
            console.log(`🎯 HIT: Timing delta: ${(result.timing * 1000).toFixed(1)}ms, Quality: ${timingQuality.toFixed(1)}%, Total scores in measure: ${newScores.length}`);
          }
          return newScores;
        });
    } else {
        if (logSettings.hits && isFinite(timingDeltaMs)) {
            console.log(`Miss detected. Timing delta: ${timingDeltaMs.toFixed(2)}ms`);
        }
        setStreak(0);
        setMisses(m => m + 1);
        // Add 0 score for missed beats
        setCurrentMeasureTimingScores(prev => {
          const newScores = [...prev, 0];
          currentMeasureTimingScoresRef.current = newScores;
          if (logSettings.timingQuality) {
            console.log(`❌ MISS: Added 0% quality score, Total scores in measure: ${newScores.length}`);
          }
          return newScores;
        });
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
    beatCountRef.current = 0;
    setScore(0);
    setAccuracy(0);
    setStreak(0);
    setHits(0);
    setMisses(0);
    // Reset rhythm feedback state
    setFourBeatAccuracy(0);
    setSongGridColors([]);
    setCurrentMeasureHits(0);
    setCurrentMeasureBeats(0);
    setCurrentMeasureTimingScores([]);
    currentMeasureTimingScoresRef.current = [];

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
        analyserNode.fftSize = 4096; // Increased for better frequency resolution
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
      const onsetTime = audioContextRef.current.currentTime;
      const timingDeltaMs = (onsetTime - lastOnsetTimeRef.current) * 1000;
      
      if (audioAnalysisData.audioLevel > rhythmControls.onsetThreshold && timingDeltaMs > 100) {
        if(logSettings.onsets) console.log(`Onset detected at time: ${onsetTime.toFixed(3)} with level: ${audioAnalysisData.audioLevel}`);
        lastOnsetTimeRef.current = onsetTime;
        processHit(onsetTime);
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
    <main className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <Card className="w-full h-full shadow-lg flex flex-col">
            <CardHeader className="text-center relative">
              <CardTitle className="text-3xl font-bold font-headline">BeatTime</CardTitle>
              <CardDescription>Real-time rhythm training for musicians.</CardDescription>
              <div className="absolute top-4 right-4">
                <StatusIndicator status={status} />
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 pt-2 flex-grow">
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
              <Button
                onClick={handleTogglePractice}
                size="lg"
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 transform active:scale-95"
                disabled={status === 'requesting'}
              >
                {metronomeIsPlaying ? <MicOff className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
                <span className="font-bold">{metronomeIsPlaying ? 'Stop Practice' : 'Start Practice'}</span>
              </Button>
              
              {/* Rhythm Controls inside main window */}
              <div className="w-full">
                <RhythmControls controls={rhythmControls} onChange={setRhythmControls} />
              </div>
            </CardContent>
          </Card>
        </div>
    
    <div className="lg:col-span-2 flex flex-col gap-4">
      {/* Rhythm Feedback Section */}
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">Rhythm Feedback</CardTitle>
          <CardDescription className="text-center">Measure-by-measure accuracy tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex justify-center">
              <RhythmMatrix fourBeatAccuracy={fourBeatAccuracy} />
            </div>
            <div className="flex flex-col items-center gap-2">
              <h3 className="text-sm font-medium text-muted-foreground">Practice Session Map</h3>
              <SongGrid songGridColors={songGridColors} />
              <div className="text-xs text-muted-foreground">
                {songGridColors.length} / 256
                <br />
                Measures Completed
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <AudioAnalysisDisplay 
        analysisData={audioAnalysisData}
        logSettings={logSettings}
      />
      
      <div className="w-full flex justify-center">
            <LogSettings settings={logSettings} onChange={setLogSettings} />
      </div>
    </div>
  </div>
</main>
);
}
