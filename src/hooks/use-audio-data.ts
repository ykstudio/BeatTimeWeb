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
      analyserNodeRef.current.getByteTimeDomainData(dataArray);
      setAudioData(dataArray);
      animationFrameRef.current = requestAnimationFrame(draw);
    }
  }, []);

  const start = useCallback((context: AudioContext, source: MediaStreamAudioSourceNode) => {
    analyserNodeRef.current = context.createAnalyser();
    analyserNodeRef.current.fftSize = 2048;
    source.connect(analyserNodeRef.current);
    draw();
  }, [draw]);

  const stop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if(analyserNodeRef.current) {
        analyserNodeRef.current.disconnect();
        analyserNodeRef.current = null;
    }
  }, []);

  return { analyserNodeRef, audioData, start, stop };
}
