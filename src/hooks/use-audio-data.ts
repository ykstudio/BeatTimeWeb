
"use client";

import { useState, useRef, useCallback, Dispatch, SetStateAction, useEffect } from 'react';
import { analyzeInstrumentFrequencies, detectInstrumentType, INSTRUMENT_PROFILES } from '@/lib/audio';
import { analyzePitch, analyzeChord, findFrequencyPeaks, PitchAnalysis, ChordAnalysis } from '@/lib/music';

import { PitchAnalysis, ChordAnalysis } from '@/lib/music';

export type AudioAnalysisData = {
  audioLevel: number;
  frequencyData: Uint8Array;
  dominantFrequency: number;
  spectralCentroid: number;
  // New instrument-specific data
  instrumentLevel: number;
  instrumentFrequency: number;
  instrumentConfidence: number;
  selectedInstrument: string;
  // Auto-detection data
  detectedInstrument: string;
  detectionConfidence: number;
  detectionBreakdown: Record<string, number>;
  // Enhanced pitch/chord analysis
  pitchAnalysis: PitchAnalysis | null;
  chordAnalysis: ChordAnalysis;
  frequencyPeaks: number[];
};

export function useAudioData(setAudioAnalysisData: Dispatch<SetStateAction<AudioAnalysisData>>) {
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [selectedInstrument, setSelectedInstrument] = useState('auto');
  
  // Add persistence for stable auto-detection
  const lastDetectionRef = useRef<{instrument: string, confidence: number, breakdown: any} | null>(null);
  
  // 4-beat averaging for auto-detection - stable instrument decisions
  const beatDetectionsRef = useRef<Array<{instrument: string, confidence: number, beatNumber: number}>>([]);
  const [stableDetectedInstrument, setStableDetectedInstrument] = useState<string>('auto');
  const [stableDetectionConfidence, setStableDetectionConfidence] = useState<number>(0);
  const lastDecisionBeat = useRef<number>(0);

  // 4-beat averaging for auto-detection (moved to main app)
  // This hook now just provides current detection data

  const draw = useCallback(() => {
    if (!analyserNodeRef.current || !audioContextRef.current) return;

    const analyser = analyserNodeRef.current;
    const freqDataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(freqDataArray);

    // Find dominant frequency and calculate spectral centroid
    let maxLevel = 0;
    let dominantFrequency = 0;
    let weightedSum = 0;
    let totalEnergy = 0;

    for (let i = 0; i < freqDataArray.length; i++) {
      const frequency = (i * audioContextRef.current.sampleRate) / (analyser.fftSize * 2);
      const level = freqDataArray[i];
      
      if (level > maxLevel) {
        maxLevel = level;
        dominantFrequency = frequency;
      }
      
      weightedSum += frequency * level;
      totalEnergy += level;
    }
    
    const spectralCentroid = totalEnergy > 0 ? weightedSum / totalEnergy : 0;
    const scaledLevel = Math.round((maxLevel / 255) * 20);

    // Analyze for the selected instrument using profiles
    const instrumentAnalysis = analyzeInstrumentFrequencies(
      freqDataArray, 
      audioContextRef.current.sampleRate, 
      analyser.fftSize,
      selectedInstrument
    );

    // RMS calculation for better level representation
    const rms = Math.sqrt(freqDataArray.reduce((sum, val) => sum + val * val, 0) / freqDataArray.length);

    // MOVE AUTO-DETECTION OUTSIDE LOGGING CONDITIONAL
    // Quick frequency band calculation for continuous detection
    const freqBinWidth = audioContextRef.current.sampleRate / analyser.fftSize;
    const frequencyBands = {
      sub: { energy: 0, dominantFreq: 0 },
      bass: { energy: 0, dominantFreq: 0 },
      lowMid: { energy: 0, dominantFreq: 0 },
      mid: { energy: 0, dominantFreq: 0 },
      highMid: { energy: 0, dominantFreq: 0 },
      presence: { energy: 0, dominantFreq: 0 },
      brilliance: { energy: 0, dominantFreq: 0 }
    };
    
    const bandRanges = {
      sub: [20, 80], bass: [80, 250], lowMid: [250, 500], mid: [500, 2000],
      highMid: [2000, 4000], presence: [4000, 6000], brilliance: [6000, 20000]
    };
    
    // Calculate frequency bands
    for (const [bandName, [minFreq, maxFreq]] of Object.entries(bandRanges)) {
      const startBin = Math.floor(minFreq / freqBinWidth);
      const endBin = Math.floor(maxFreq / freqBinWidth);
      for (let i = startBin; i <= endBin && i < freqDataArray.length; i++) {
        frequencyBands[bandName as keyof typeof frequencyBands].energy += freqDataArray[i];
      }
    }
    
    // Quick harmonic analysis
    const harmonics: {harmonic: number, freq: number, level: number}[] = [];
    const timeDataArray = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(timeDataArray);
    
    // Zero crossing rate
    let zcr = 0;
    let peak = 0;
    for (let i = 1; i < timeDataArray.length; i++) {
      if ((timeDataArray[i-1] < 128 && timeDataArray[i] >= 128) || 
          (timeDataArray[i-1] >= 128 && timeDataArray[i] < 128)) {
        zcr++;
      }
      if (timeDataArray[i] > peak) peak = timeDataArray[i];
    }
    
    // Enhanced pitch/chord analysis
    const frequencyPeaks = findFrequencyPeaks(freqDataArray, audioContextRef.current.sampleRate, 30);
    const pitchAnalysis = analyzePitch(dominantFrequency);
    const chordAnalysis = analyzeChord(frequencyPeaks);

    // Continuous auto-detection
    const crestFactor = peak > 0 ? rms / peak : 0;
    const currentDetection = detectInstrumentType(
      spectralCentroid,
      frequencyBands,
      harmonics,
      zcr,
      crestFactor
    );
    
    // Persistence: Only update if we have a CONFIDENT valid detection (ignore auto results)
    if (currentDetection.instrument !== 'auto' && currentDetection.confidence > 0.25) {
      lastDetectionRef.current = currentDetection;
      console.log(`🎯 STABLE UPDATE: ${currentDetection.instrument} (${(currentDetection.confidence * 100).toFixed(1)}%)`);
    }
    
    const detectionResult = lastDetectionRef.current || { instrument: 'auto', confidence: 0, breakdown: {} };

    // Default auto-detection result (for logging compatibility)
    let logDetectionResult = detectionResult;

    // COMPREHENSIVE AUDIO DATA LOGGING (only for detailed analysis)
    if (Date.now() % 500 < 50) { // Log every 500ms for more data points
      // Full analysis for logging (reuse frequency bands calculated above)
      const significantFreqs = [];
      for (let i = 1; i < freqDataArray.length; i++) {
        const energy = freqDataArray[i];
        const freq = i * freqBinWidth;
        if (energy > 30 && energy > freqDataArray[i-1] && energy > freqDataArray[i+1]) {
          significantFreqs.push({ freq: freq.toFixed(1), level: energy });
        }
      }
      significantFreqs.sort((a, b) => b.level - a.level);
      
      // Enhanced harmonic analysis for logging
      const detailedHarmonics: {harmonic: number, freq: number, level: number}[] = [];
      if (significantFreqs.length > 0) {
        const fundamental = parseFloat(significantFreqs[0].freq);
        for (let h = 2; h <= 8; h++) {
          const harmonicFreq = fundamental * h;
          const closestBin = Math.round(harmonicFreq / freqBinWidth);
          if (closestBin < freqDataArray.length) {
            const harmonicLevel = freqDataArray[closestBin];
            if (harmonicLevel > 15) {
              detailedHarmonics.push({ harmonic: h, freq: harmonicFreq, level: harmonicLevel });
            }
          }
        }
      }
      
      // Re-run detection with detailed data for logging
      logDetectionResult = detectInstrumentType(
        spectralCentroid,
        frequencyBands,
        detailedHarmonics,
        zcr,
        crestFactor
      );
      
      const currentTime = audioContextRef.current.currentTime;
      console.log(`📊 INSTRUMENT DATA [${selectedInstrument}] @${currentTime.toFixed(2)}s:`);
      console.log(`  🔊 LEVELS: audio=${scaledLevel} | rms=${rms.toFixed(2)} | peak=${peak} | instrument=${(instrumentAnalysis.weightedLevel / 128 * 20).toFixed(1)}`);
      console.log(`  🎵 FREQUENCY: dominant=${dominantFrequency.toFixed(1)}Hz | centroid=${spectralCentroid.toFixed(1)}Hz | instFreq=${instrumentAnalysis.dominantFreqInRange.toFixed(1)}Hz`);
      console.log(`  📈 BANDS: ${Object.entries(frequencyBands).map(([band, data]) => `${band}:${data.energy.toFixed(0)}`).join(' | ')}`);
      console.log(`  🎶 TOP_FREQS: ${significantFreqs.slice(0, 8).map(f => `${f.freq}Hz(${f.level})`).join(' | ')}`);
      console.log(`  🔄 HARMONICS: ${detailedHarmonics.length > 0 ? detailedHarmonics.map(h => `H${h.harmonic}:${h.freq.toFixed(1)}Hz(${h.level})`).join(' | ') : 'none'}`);
      console.log(`  🌊 WAVEFORM: zcr=${zcr} | crest=${crestFactor.toFixed(3)} | confidence=${(instrumentAnalysis.confidenceScore * 100).toFixed(1)}%`);
      console.log(`  🤖 AUTO-DETECT: ${logDetectionResult.instrument} (${(logDetectionResult.confidence * 100).toFixed(1)}%) | centroid:${(logDetectionResult.breakdown.centroid * 100).toFixed(0)}% bands:${(logDetectionResult.breakdown.bands * 100).toFixed(0)}% harmonics:${(logDetectionResult.breakdown.harmonics * 100).toFixed(0)}% zcr:${(logDetectionResult.breakdown.zcr * 100).toFixed(0)}% crest:${(logDetectionResult.breakdown.crest * 100).toFixed(0)}%`);
      
      // Enhanced pitch/chord logging
      if (pitchAnalysis) {
        console.log(`  🎼 PITCH: ${pitchAnalysis.noteName} (${pitchAnalysis.frequency.toFixed(1)}Hz) | cents: ${pitchAnalysis.cents > 0 ? '+' : ''}${pitchAnalysis.cents} | midi: ${pitchAnalysis.midiNumber}`);
      }
      
      if (chordAnalysis.detectedNotes.length > 1) {
        console.log(`  🎵 NOTES: ${chordAnalysis.detectedNotes.map(n => `${n.noteName}(${n.frequency.toFixed(1)}Hz)`).join(' | ')}`);
        if (chordAnalysis.possibleChords.length > 0) {
          console.log(`  🎶 CHORDS: ${chordAnalysis.possibleChords.map(c => `${c.root}${c.type}(${c.confidence.toFixed(1)}%)`).join(' | ')}`);
        }
      }
      
      if (frequencyPeaks.length > 0) {
        console.log(`  📊 PEAKS: ${frequencyPeaks.slice(0, 5).map(f => `${f.toFixed(1)}Hz`).join(' | ')}`);
      }
      
      console.log(`  ⏰ TIME: ${currentTime.toFixed(3)}s | stamp=${Date.now()}`);
      console.log('---');
    }

    setAudioAnalysisData({
      audioLevel: scaledLevel,
      frequencyData: freqDataArray,
      dominantFrequency: dominantFrequency,
      spectralCentroid: spectralCentroid,
      // New instrument-specific data
      instrumentLevel: instrumentAnalysis.weightedLevel / 128 * 20,
      instrumentFrequency: instrumentAnalysis.dominantFreqInRange,
      instrumentConfidence: instrumentAnalysis.confidenceScore,
      selectedInstrument: selectedInstrument,
      // Auto-detection data (now stable)
      detectedInstrument: detectionResult.instrument,
      detectionConfidence: detectionResult.confidence,
      detectionBreakdown: detectionResult.breakdown,
      // Enhanced pitch/chord analysis
      pitchAnalysis: pitchAnalysis,
      chordAnalysis: chordAnalysis,
      frequencyPeaks: frequencyPeaks,
    });

    animationFrameRef.current = requestAnimationFrame(draw);
  }, [setAudioAnalysisData]); // REMOVED selectedInstrument to prevent constant recreation

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
  }, []);

  // Reset stable detection when manually changing instrument
  useEffect(() => {
    if (selectedInstrument !== 'auto') {
      setStableDetectedInstrument('auto');
      setStableDetectionConfidence(0);
      beatDetectionsRef.current = [];
    }
  }, [selectedInstrument]);

  return {
    start,
    stop,
    selectedInstrument,
    setSelectedInstrument
  };
}
