
"use client";

import { useState, useRef, useCallback, Dispatch, SetStateAction } from 'react';

export type AudioAnalysisData = {
  audioLevel: number;
  frequencyData: Uint8Array;
  dominantFrequency: number;
};

export function useAudioData(setAudioAnalysisData: Dispatch<SetStateAction<AudioAnalysisData>>) {
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const draw = useCallback(() => {
    if (analyserNodeRef.current && audioContextRef.current) {
      const analyser = analyserNodeRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const freqDataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(freqDataArray);
      
      // Calculate audio level (RMS)
      let sum = 0;
      for (let i = 0; i < freqDataArray.length; i++) {
        sum += freqDataArray[i] * freqDataArray[i];
      }
      const rms = Math.sqrt(sum / freqDataArray.length);
      const scaledLevel = Math.round((rms / 128) * 20);

      // Calculate dominant frequency
      let maxVal = -1;
      let maxIndex = -1;
      for (let i = 0; i < bufferLength; i++) {
        if (freqDataArray[i] > maxVal) {
          maxVal = freqDataArray[i];
          maxIndex = i;
        }
      }
      const dominantFrequency = maxIndex * audioContextRef.current.sampleRate / analyser.fftSize;

      setAudioAnalysisData({
        audioLevel: scaledLevel,
        frequencyData: freqDataArray,
        dominantFrequency: dominantFrequency,
      });

      animationFrameRef.current = requestAnimationFrame(draw);
    }
  }, [setAudioAnalysisData]);

  const start = useCallback((analyserNode: AnalyserNode, audioContext: AudioContext) => {
    analyserNodeRef.current = analyserNode;
    audioContextRef.current = audioContext;
    draw();
  }, [draw]);

  const stop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (analyserNodeRef.current) {
        analyserNodeRef.current.disconnect();
        analyserNodeRef.current = null;
    }
    audioContextRef.current = null;
    setAudioAnalysisData({
        audioLevel: 0,
        frequencyData: new Uint8Array(0),
        dominantFrequency: 0
    });
  }, [setAudioAnalysisData]);

  return { start, stop };
}
