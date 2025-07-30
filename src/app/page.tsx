"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AudioVisualizer from '@/components/audio-visualizer';
import StatusIndicator from '@/components/status-indicator';
import { Mic, MicOff } from 'lucide-react';

type Status = 'idle' | 'requesting' | 'listening' | 'denied' | 'error';

export default function Home() {
  const [status, setStatus] = useState<Status>('idle');
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(0));

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }

    audioContextRef.current = null;
    analyserRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
    animationFrameIdRef.current = null;
    setFrequencyData(new Uint8Array(0));
  }, []);

  const startListening = useCallback(async () => {
    cleanup();
    setStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = context;
      
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
      setStatus('listening');

    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      setStatus(err.name === 'NotAllowedError' ? 'denied' : 'error');
      cleanup();
    }
  }, [cleanup]);

  const stopListening = useCallback(() => {
    cleanup();
    setStatus('idle');
  }, [cleanup]);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  const handleToggleListening = () => {
    if (status === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  };
  
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold font-headline">BeatMaster</CardTitle>
          <CardDescription>Real-time audio level visualization from your microphone.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-8 pt-2">
          <AudioVisualizer frequencyData={frequencyData} />
          <StatusIndicator status={status} />
          <Button
            onClick={handleToggleListening}
            disabled={status === 'requesting'}
            size="lg"
            className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 transform active:scale-95"
          >
            {status === 'listening' ? <MicOff className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
            <span className="font-bold">{status === 'listening' ? 'Stop Listening' : 'Start Listening'}</span>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
