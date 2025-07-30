"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AudioVisualizer from '@/components/audio-visualizer';
import StatusIndicator from '@/components/status-indicator';
import Metronome from '@/components/metronome';
import { Mic, MicOff } from 'lucide-react';

type Status = 'idle' | 'requesting' | 'listening' | 'denied' | 'error';

export default function Home() {
  const [status, setStatus] = useState<Status>('idle');
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(0));
  const [currentBeat, setCurrentBeat] = useState<number>(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  const cleanupMic = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
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

      source.connect(analyser);

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
      setStatus(err.name === 'NotAllowedError' ? 'denied' : 'error');
      return false;
    }
  }, [cleanupMic]);


  const handleTogglePractice = async (metronomeIsPlaying: boolean, startMetronome: () => Promise<AudioContext | null>, stopMetronome: () => void) => {
    if (metronomeIsPlaying) {
      stopMetronome();
      cleanupMic();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setStatus('idle');
      setCurrentBeat(0);
    } else {
      setStatus('requesting');
      const context = await startMetronome();
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
          setStatus('denied');
        }
      } else {
        setStatus('error');
      }
    }
  };
  
  const handleBeat = (beat: number) => {
    setCurrentBeat(beat);
  }

  useEffect(() => {
    // Ensure everything is cleaned up on unmount
    return () => {
      cleanupMic();
       if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [cleanupMic]);

  
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold font-headline">BeatTime</CardTitle>
          <CardDescription>Real-time rhythm training for musicians.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 pt-2">
          <AudioVisualizer frequencyData={frequencyData} />
          <StatusIndicator status={status} />
          <Metronome
            onBeat={handleBeat}
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
      </Card>
    </main>
  );
}
