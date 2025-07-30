
"use client";

import { useState, useRef, useCallback } from 'react';

export function useAudioData() {
  const [audioData, setAudioData] = useState(new Uint8Array(0));
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const draw = useCallback(() => {
    if (analyserNodeRef.current) {
      const bufferLength = analyserNodeRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      // Use getByteFrequencyData for the equalizer effect
      analyserNodeRef.current.getByteFrequencyData(dataArray);
      setAudioData(dataArray);
      animationFrameRef.current = requestAnimationFrame(draw);
    }
  }, []);

  const start = useCallback((context: AudioContext, source: MediaStreamAudioSourceNode) => {
    if(context.state === 'closed') return;
    analyserNodeRef.current = context.createAnalyser();
    analyserNodeRef.current.fftSize = 256; // Smaller FFT size for more responsive visualization
    source.connect(analyserNodeRef.current);
    draw();
  }, [draw]);

  const stop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if(analyserNodeRef.current) {
        // Disconnect to stop processing
        analyserNodeRef.current.disconnect();
        analyserNodeRef.current = null;
    }
    setAudioData(new Uint8Array(0)); // Clear the visualizer data
  }, []);

  return { audioData, start, stop };
}
