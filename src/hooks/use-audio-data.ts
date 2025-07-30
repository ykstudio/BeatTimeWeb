
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
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;

      // Scale to 0-10 for display
      const scaledLevel = Math.round((average / 128) * 10);
      setAudioLevel(scaledLevel);


      animationFrameRef.current = requestAnimationFrame(draw);
    }
  }, [setAudioLevel]);

  const start = useCallback((analyserNode: AnalyserNode) => {
    analyserNodeRef.current = analyserNode;
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

  return { audioData, start, stop };
}

    