"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Metronome, { type MetronomeHandle } from '@/components/metronome';
import { Mic, MicOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [metronomeIsPlaying, setMetronomeIsPlaying] = useState(false);
  const [currentBpm, setCurrentBpm] = useState(120);

  const audioContextRef = useRef<AudioContext | null>(null);
  const metronomeRef = useRef<MetronomeHandle>(null);
  
  const { toast } = useToast();

  const stopPractice = useCallback(() => {
    if (metronomeRef.current) {
        metronomeRef.current.stop();
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().then(() => {
        audioContextRef.current = null;
      });
    }
    setMetronomeIsPlaying(false);
  }, []);

  const startPractice = useCallback(async () => {
    try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = context;

        if (context.state === 'suspended') {
            await context.resume();
        }

        if (metronomeRef.current) {
            metronomeRef.current.start(currentBpm, context);
            setMetronomeIsPlaying(true);
        }
    } catch (e) {
      console.error("Failed to start practice:", e);
      toast({
        title: "Error",
        description: "Could not start the microphone or metronome. Please check permissions and try again.",
        variant: "destructive"
      });
      setMetronomeIsPlaying(false);
    }
  }, [currentBpm, toast]);


  const handleTogglePractice = async () => {
    if (metronomeIsPlaying) {
      stopPractice();
    } else {
      await startPractice();
    }
  };

  useEffect(() => {
    // Cleanup on component unmount
    return () => {
      stopPractice();
    };
  }, [stopPractice]);

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center relative">
          <CardTitle className="text-3xl font-bold font-headline">BeatTime</CardTitle>
          <CardDescription>Real-time rhythm training for musicians.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 pt-2">
          <div className="h-32 w-full max-w-sm rounded-lg bg-muted/50 p-4 flex items-center justify-center">
            <p className="text-muted-foreground">Audio visualizer disabled</p>
          </div>
          <div className="grid grid-cols-3 gap-4 w-full text-center">
            <div>
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-2xl font-bold">0</p>
            </div>
            <div>
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="text-2xl font-bold">0%</p>
            </div>
            <div>
                <p className="text-sm text-muted-foreground">Streak</p>
                <p className="text-2xl font-bold">0</p>
            </div>
          </div>
          <Metronome
            ref={metronomeRef}
            onBeat={() => {}} // No-op for now
            initialBpm={currentBpm}
            onBpmChange={setCurrentBpm}
            isPlaying={metronomeIsPlaying}
          />
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleTogglePractice}
            size="lg"
            className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 transform active:scale-95"
          >
            {metronomeIsPlaying ? <MicOff className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
            <span className="font-bold">{metronomeIsPlaying ? 'Stop Practice' : 'Start Practice'}</span>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
