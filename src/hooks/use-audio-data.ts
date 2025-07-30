
"use client";

import { useState, useRef, useCallback, Dispatch, SetStateAction } from 'react';

export function useAudioData(setAudioLevel: Dispatch<SetStateAction<number>>) {
  const [audioData, setAudioData] = useState(new Uint8Array(0));
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const draw = useCallback(() => {
    if (analyserNodeRef.current) {
      const bufferLength = analyserNodeRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserNodeRef.current.getByteFrequencyData(dataArray);
      setAudioData(dataArray);

      // Calculate the average volume and update the audio level state
      const level = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
      // Scale to 0-10 for display
      const scaledLevel = Math.round((level / 255) * 10);
      setAudioLevel(scaledLevel);


      animationFrameRef.current = requestAnimationFrame(draw);
    }
  }, [setAudioLevel]);

  const start = useCallback((context: AudioContext, source: MediaStreamAudioSourceNode) => {
    if(context.state === 'closed') return;
    analyserNodeRef.current = context.createAnalyser();
    analyserNodeRef.current.fftSize = 256; 
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
    setAudioData(new Uint8Array(0));
    setAudioLevel(0);
  }, [setAudioLevel]);

  return { audioData, analyserNodeRef, start, stop };
}
