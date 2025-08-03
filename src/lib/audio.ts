// This is a placeholder for a more sophisticated onset detection.
// For now, we'll simulate it, but this is where the core audio processing logic will go.

export const TIMING_WINDOW = 0.2; // 200ms timing window (100ms before, 100ms after beat)
export const DEFAULT_LATENCY = 0.13; // Default 130ms latency compensation based on observed timing

// Instrument frequency profiles for better tracking
export interface InstrumentProfile {
  name: string;
  fundamentalRange: [number, number]; // Primary frequency range
  harmonicRanges: [number, number][]; // Important harmonic frequencies
  sensitivity: number; // Threshold multiplier for this instrument
  latencyCompensation: number; // Instrument-specific latency
}

export const INSTRUMENT_PROFILES: Record<string, InstrumentProfile> = {
  drums: {
    name: "Drums",
    fundamentalRange: [60, 250], // Kick drum fundamental
    harmonicRanges: [
      [80, 120],   // Kick drum body
      [200, 500],  // Snare fundamental 
      [2000, 8000], // Snare/cymbals attack
    ],
    sensitivity: 1.2, // Higher sensitivity for percussive sounds
    latencyCompensation: 0.08, // Drums are more immediate
  },
  guitar: {
    name: "Guitar",
    fundamentalRange: [80, 1320], // Low E (82Hz) to high E (1320Hz) with margin
    harmonicRanges: [
      [80, 350],    // Lower strings fundamentals (E, A, D, G)
      [180, 900],   // Higher strings fundamentals (B, E) + harmonics
      [350, 1400],  // Second harmonics
      [700, 2800],  // Third harmonics (attack transients)
      [1400, 5600], // Higher harmonics (string brightness)
    ],
    sensitivity: 1.1, // Increased sensitivity for better detection
    latencyCompensation: 0.12, // Slightly reduced for more responsive detection
  },
  bass: {
    name: "Bass",
    fundamentalRange: [41, 200], // Low E to G
    harmonicRanges: [
      [41, 98],    // Fundamental bass range
      [82, 196],   // First octave
      [165, 392],  // Second octave harmonics
    ],
    sensitivity: 0.9,
    latencyCompensation: 0.18, // Bass notes have longer attack
  },
  piano: {
    name: "Piano",
    fundamentalRange: [27, 4186], // Full piano range A0 to C8
    harmonicRanges: [
      [27, 261],   // Lower register
      [261, 1047], // Middle register  
      [1047, 4186], // Upper register
    ],
    sensitivity: 0.7, // Piano has complex harmonics
    latencyCompensation: 0.12,
  },
  voice: {
    name: "Voice",
    fundamentalRange: [80, 1100], // Typical vocal range
    harmonicRanges: [
      [80, 350],   // Lower voice (bass/alto)
      [200, 700],  // Mid voice (baritone/soprano)
      [400, 1100], // Upper voice range
      [1000, 3000], // Vocal formants
    ],
    sensitivity: 0.6, // Voice needs lower sensitivity
    latencyCompensation: 0.16,
  },
  shaker: {
    name: "Shaker/Egg",
    fundamentalRange: [2000, 12000], // High-frequency noise-based instrument
    harmonicRanges: [
      [1000, 3000],  // Some mid presence
      [3000, 6000],  // Upper presence
      [6000, 12000], // Brilliance (main content)
      [12000, 20000], // Very high frequencies
    ],
    sensitivity: 1.4, // High sensitivity for noisy percussion
    latencyCompensation: 0.06, // Very immediate attack
  },
  clap: {
    name: "Hand Clap",
    fundamentalRange: [800, 4000], // Mid to high frequency transient
    harmonicRanges: [
      [500, 1200],   // Low-mid attack
      [1200, 2500],  // Mid attack (main clap sound)
      [2500, 5000],  // High-mid brightness
      [5000, 10000], // High frequency crack
    ],
    sensitivity: 1.3, // High sensitivity for sharp transients
    latencyCompensation: 0.05, // Extremely immediate
  },
  auto: {
    name: "Auto-Detect",
    fundamentalRange: [20, 8000], // Full spectrum
    harmonicRanges: [
      [20, 250],
      [250, 1000],
      [1000, 4000],
      [4000, 8000],
    ],
    sensitivity: 1.0,
    latencyCompensation: 0.13,
  }
};

// NEW: Enhanced instrument detection based on real test data analysis
export interface InstrumentSignature {
  spectralCentroidRange: [number, number];
  dominantBandEnergy: string[]; // Which frequency bands are strongest
  harmonicClarity: number; // How clear the harmonic structure is (0-1)
  zcrRange: [number, number]; // Zero crossing rate range
  crestFactorRange: [number, number]; // Crest factor range (transient vs sustained)
  confidenceWeights: {
    centroid: number;
    bands: number;
    harmonics: number;
    zcr: number;
    crest: number;
  };
}

export const INSTRUMENT_SIGNATURES: Record<string, InstrumentSignature> = {
  bass: {
    // From analysis: Working well, pure low-frequency energy signature
    spectralCentroidRange: [100, 200],
    dominantBandEnergy: ['sub', 'bass'],
    harmonicClarity: 0.3, // Weak harmonics as observed
    zcrRange: [400, 700], // Stable, low ZCR
    crestFactorRange: [0.01, 0.02], // Very low crest factor (sustained)
    confidenceWeights: { centroid: 0.40, bands: 0.40, harmonics: 0.10, zcr: 0.05, crest: 0.05 }
  },
  guitar: {
    // MAJOR REWRITE: Based on analysis showing rich harmonics but misclassified as bass
    spectralCentroidRange: [200, 800], // Brighter than bass, but not as high as expected
    dominantBandEnergy: ['bass', 'lowMid', 'mid'], // Strong in multiple bands
    harmonicClarity: 0.85, // STRONGEST SIGNATURE: Rich H2-H8 harmonic series
    zcrRange: [20, 500], // Highly variable due to playing technique
    crestFactorRange: [0.04, 0.20], // Pick attack creates transients
    confidenceWeights: { centroid: 0.10, bands: 0.15, harmonics: 0.60, zcr: 0.10, crest: 0.05 } // HEAVY weight on harmonics
  },
  shaker: {
    // From analysis: High-frequency noise, correctly detected
    spectralCentroidRange: [5000, 6000], // Very high centroid
    dominantBandEnergy: ['presence', 'brilliance'], // Extreme high-frequency content
    harmonicClarity: 0.05, // Almost no harmonic structure (noise)
    zcrRange: [1500, 1700], // Very high ZCR
    crestFactorRange: [0.30, 0.60], // High transient content
    confidenceWeights: { centroid: 0.35, bands: 0.40, harmonics: 0.05, zcr: 0.15, crest: 0.05 }
  },
  voice: {
    // MAJOR REWRITE: Based on analysis showing mid-band dominance + rich harmonics
    spectralCentroidRange: [400, 700], // Mid-range centroid
    dominantBandEnergy: ['lowMid', 'mid', 'highMid'], // KEY: Strong mid-band energy (2000-8700Hz)
    harmonicClarity: 0.75, // Very rich harmonic content (formant structure)
    zcrRange: [25, 500], // Variable due to articulation
    crestFactorRange: [0.09, 0.20], // Moderate dynamics
    confidenceWeights: { centroid: 0.20, bands: 0.35, harmonics: 0.30, zcr: 0.10, crest: 0.05 } // Emphasize mid-band + harmonics
  },
  clap: {
    // NEW: Based on analysis showing mid-frequency transient with harmonic content
    spectralCentroidRange: [1100, 4000], // Mid to high centroid
    dominantBandEnergy: ['mid', 'highMid'], // Strong mid-band energy
    harmonicClarity: 0.4, // Moderate harmonic content (unexpected!)
    zcrRange: [350, 650], // High but not as high as shaker
    crestFactorRange: [0.11, 0.35], // Sharp transient
    confidenceWeights: { centroid: 0.25, bands: 0.30, harmonics: 0.20, zcr: 0.15, crest: 0.10 }
  }
};

/**
 * Enhanced multi-stage instrument detection based on comprehensive analysis
 */
export function detectInstrumentType(
  spectralCentroid: number,
  frequencyBands: Record<string, {energy: number, dominantFreq: number}>,
  harmonics: {harmonic: number, freq: number, level: number}[],
  zcr: number,
  crestFactor: number,
  confidenceThreshold: number = 0.45
): {instrument: string, confidence: number, breakdown: Record<string, number>} {
  
  const totalEnergy = Object.values(frequencyBands).reduce((sum, band) => sum + band.energy, 0);
  if (totalEnergy === 0) {
    return { instrument: 'auto', confidence: 0, breakdown: {} };
  }
  
  // STAGE 1: Quick frequency-based filtering to eliminate impossible matches
  const candidates: string[] = [];
  
  if (spectralCentroid < 300 && frequencyBands.bass?.energy > totalEnergy * 0.3) {
    candidates.push('bass');
  }
  if (spectralCentroid > 4000 && frequencyBands.brilliance?.energy > totalEnergy * 0.4) {
    candidates.push('shaker');
  }
  if (spectralCentroid >= 200 && spectralCentroid <= 1000) {
    candidates.push('guitar', 'voice');
  }
  if (spectralCentroid >= 800 && spectralCentroid <= 4500) {
    candidates.push('clap', 'voice');
  }
  
  // If no candidates from stage 1, check all instruments
  if (candidates.length === 0) {
    candidates.push(...Object.keys(INSTRUMENT_SIGNATURES));
  }
  
  let bestMatch = 'auto';
  let bestConfidence = 0;
  let bestBreakdown = {};
  
  for (const instrument of candidates) {
    const signature = INSTRUMENT_SIGNATURES[instrument];
    if (!signature) continue;
    
    const weights = signature.confidenceWeights;
    let confidence = 0;
    const breakdown: Record<string, number> = {};
    
    // 1. Spectral Centroid Match (improved scoring)
    const [centroidMin, centroidMax] = signature.spectralCentroidRange;
    let centroidScore = 0;
    if (spectralCentroid >= centroidMin && spectralCentroid <= centroidMax) {
      centroidScore = 1.0;
    } else {
      const centroidCenter = (centroidMin + centroidMax) / 2;
      const centroidRange = centroidMax - centroidMin;
      const distance = Math.abs(spectralCentroid - centroidCenter) / centroidRange;
      centroidScore = Math.max(0, 1.0 - distance * 0.5); // More forgiving
    }
    breakdown.centroid = centroidScore;
    confidence += centroidScore * weights.centroid;
    
    // 2. Enhanced Frequency Band Analysis
    let bandScore = 0;
    const expectedBands = signature.dominantBandEnergy;
    
    // Calculate energy in expected bands vs total energy
    let expectedEnergy = 0;
    for (const bandName of expectedBands) {
      if (frequencyBands[bandName]) {
        expectedEnergy += frequencyBands[bandName].energy;
      }
    }
    
    // Score based on concentration of energy in expected bands
    bandScore = expectedEnergy / totalEnergy;
    
    // SPECIAL CASE: Voice detection - boost for strong mid-band energy
    if (instrument === 'voice' && frequencyBands.mid?.energy > totalEnergy * 0.3) {
      bandScore *= 1.5; // 50% boost for strong mid-band
    }
    
    breakdown.bands = Math.min(1.0, bandScore);
    confidence += Math.min(1.0, bandScore) * weights.bands;
    
    // 3. Enhanced Harmonic Analysis
    const strongHarmonics = harmonics.filter(h => h.level > 30).length; // Lower threshold
    const veryStrongHarmonics = harmonics.filter(h => h.level > 80).length;
    
    let harmonicScore = 0;
    if (instrument === 'guitar' && strongHarmonics >= 4) {
      // Guitar gets major boost for rich harmonic content
      harmonicScore = Math.min(1.0, strongHarmonics / 6);
      if (veryStrongHarmonics >= 2) harmonicScore *= 1.2;
    } else if (instrument === 'voice' && strongHarmonics >= 3) {
      // Voice gets boost for formant-like harmonic structure
      harmonicScore = Math.min(1.0, strongHarmonics / 5);
    } else if (instrument === 'bass' && strongHarmonics <= 2) {
      // Bass gets boost for weak harmonic content
      harmonicScore = 1.0 - (strongHarmonics / 4);
    } else if (instrument === 'shaker' && strongHarmonics <= 1) {
      // Shaker gets boost for no harmonic content
      harmonicScore = 1.0 - (strongHarmonics / 2);
    } else if (instrument === 'clap') {
      // Clap has moderate harmonic content
      harmonicScore = strongHarmonics >= 2 && strongHarmonics <= 4 ? 1.0 : 0.5;
    } else {
      // Fallback to original logic
      const totalHarmonics = Math.max(harmonics.length, 1);
      const harmonicRatio = strongHarmonics / totalHarmonics;
      harmonicScore = 1.0 - Math.abs(harmonicRatio - signature.harmonicClarity);
    }
    
    breakdown.harmonics = Math.min(1.0, harmonicScore);
    confidence += Math.min(1.0, harmonicScore) * weights.harmonics;
    
    // 4. Zero Crossing Rate Match (more forgiving)
    const [zcrMin, zcrMax] = signature.zcrRange;
    let zcrScore = 0;
    if (zcr >= zcrMin && zcr <= zcrMax) {
      zcrScore = 1.0;
    } else {
      const zcrCenter = (zcrMin + zcrMax) / 2;
      const zcrRange = zcrMax - zcrMin;
      const zcrDistance = Math.abs(zcr - zcrCenter) / zcrRange;
      zcrScore = Math.max(0, 1.0 - zcrDistance * 0.3); // More forgiving
    }
    breakdown.zcr = zcrScore;
    confidence += zcrScore * weights.zcr;
    
    // 5. Crest Factor Match (more forgiving)
    const [crestMin, crestMax] = signature.crestFactorRange;
    let crestScore = 0;
    if (crestFactor >= crestMin && crestFactor <= crestMax) {
      crestScore = 1.0;
    } else {
      const crestCenter = (crestMin + crestMax) / 2;
      const crestRange = crestMax - crestMin;
      const crestDistance = Math.abs(crestFactor - crestCenter) / crestRange;
      crestScore = Math.max(0, 1.0 - crestDistance * 0.3); // More forgiving
    }
    breakdown.crest = crestScore;
    confidence += crestScore * weights.crest;
    
    // STAGE 3: Instrument-specific confidence boosts
    if (instrument === 'guitar' && strongHarmonics >= 5) {
      confidence *= 1.2; // 20% boost for very rich harmonics
    }
    if (instrument === 'voice' && frequencyBands.mid?.energy > totalEnergy * 0.4) {
      confidence *= 1.15; // 15% boost for strong mid-band
    }
    if (instrument === 'shaker' && spectralCentroid > 5000) {
      confidence *= 1.1; // 10% boost for very high centroid
    }
    
    if (confidence > bestConfidence) {
      bestConfidence = confidence;
      bestMatch = instrument;
      bestBreakdown = breakdown;
    }
  }
  
  // STAGE 4: Confidence thresholding with instrument-specific thresholds
  const instrumentThresholds = {
    bass: 0.40,     // Working well, keep lower threshold
    guitar: 0.50,   // Needs higher threshold due to complexity
    voice: 0.45,    // Moderate threshold
    shaker: 0.40,   // Working well
    clap: 0.50      // New instrument, higher threshold
  };
  
  const threshold = instrumentThresholds[bestMatch as keyof typeof instrumentThresholds] || confidenceThreshold;
  
  if (bestConfidence >= threshold) {
    return { instrument: bestMatch, confidence: bestConfidence, breakdown: bestBreakdown };
  }
  
  return { instrument: 'auto', confidence: bestConfidence, breakdown: bestBreakdown };
}

export interface TimingResult {
  hit: boolean;
  timing: number;
  rawTiming: number; // Before latency compensation
  beatIndex: number;
}

/**
 * Analyzes frequency data for instrument-specific onset detection
 */
export function analyzeInstrumentFrequencies(
  frequencyData: Uint8Array,
  sampleRate: number,
  fftSize: number,
  instrument: string = 'auto'
): {
  weightedLevel: number;
  dominantFreqInRange: number;
  confidenceScore: number;
} {
  const profile = INSTRUMENT_PROFILES[instrument] || INSTRUMENT_PROFILES.auto;
  const freqBinWidth = sampleRate / fftSize;
  
  let totalWeightedEnergy = 0;
  let totalWeight = 0;
  let maxEnergyInRange = 0;
  let dominantFreqInRange = 0;
  
  // Analyze fundamental frequency range
  const [fundMin, fundMax] = profile.fundamentalRange;
  const fundMinBin = Math.floor(fundMin / freqBinWidth);
  const fundMaxBin = Math.floor(fundMax / freqBinWidth);
  
  for (let i = fundMinBin; i <= fundMaxBin && i < frequencyData.length; i++) {
    const energy = frequencyData[i];
    const freq = i * freqBinWidth;
    
    // Weight fundamental frequencies more heavily
    const weight = 2.0;
    totalWeightedEnergy += energy * weight;
    totalWeight += weight;
    
    if (energy > maxEnergyInRange) {
      maxEnergyInRange = energy;
      dominantFreqInRange = freq;
    }
  }
  
  // Analyze harmonic ranges
  profile.harmonicRanges.forEach(([min, max], index) => {
    const minBin = Math.floor(min / freqBinWidth);
    const maxBin = Math.floor(max / freqBinWidth);
    
    for (let i = minBin; i <= maxBin && i < frequencyData.length; i++) {
      const energy = frequencyData[i];
      const freq = i * freqBinWidth;
      
      // Weight harmonics based on importance (first harmonic gets more weight)
      const weight = 1.0 / (index + 1);
      totalWeightedEnergy += energy * weight;
      totalWeight += weight;
      
      if (energy > maxEnergyInRange) {
        maxEnergyInRange = energy;
        dominantFreqInRange = freq;
      }
    }
  });
  
  const weightedLevel = totalWeight > 0 ? totalWeightedEnergy / totalWeight : 0;
  
  // Calculate confidence based on how much energy is in the target ranges vs noise
  const totalEnergy = frequencyData.reduce((sum, val) => sum + val, 0);
  let confidenceScore = totalEnergy > 0 ? totalWeightedEnergy / totalEnergy : 0;
  
  // Boost confidence for instruments that have lower baseline confidence
  if (instrument === 'guitar' || instrument === 'piano' || instrument === 'voice') {
    confidenceScore = Math.min(1.0, confidenceScore * 1.5); // 50% boost for complex harmonic instruments
  }
  
  return {
    weightedLevel,
    dominantFreqInRange,
    confidenceScore: Math.min(confidenceScore, 1.0)
  };
}

/**
 * Enhanced onset detection using instrument-specific frequency analysis
 */
export function detectInstrumentOnset(
  currentLevel: number,
  previousLevel: number,
  frequencyAnalysis: ReturnType<typeof analyzeInstrumentFrequencies>,
  instrument: string = 'auto',
  baseThreshold: number = 0.3
): boolean {
  const profile = INSTRUMENT_PROFILES[instrument] || INSTRUMENT_PROFILES.auto;
  
  // Adjust threshold based on instrument profile and confidence
  const adjustedThreshold = baseThreshold * profile.sensitivity * (0.5 + frequencyAnalysis.confidenceScore * 0.5);
  
  // Use weighted level instead of raw audio level
  const levelIncrease = frequencyAnalysis.weightedLevel - previousLevel;
  const hasOnset = levelIncrease > adjustedThreshold && frequencyAnalysis.confidenceScore > 0.3;
  
  return hasOnset;
}

export function detectOnsets(
  audioBuffer: AudioBuffer,
  sensitivity: number,
  onOnset: (time: number) => void
) {
  // Placeholder for real onset detection. In a real implementation, you would:
  // 1. Get the raw audio data from the audioBuffer.
  // 2. Process it in chunks.
  // 3. Apply an onset detection function (e.g., looking for sharp energy increases).
  // 4. When an onset is detected, call onOnset with the precise time.
  // This is a complex topic involving digital signal processing (DSP).
}

/**
 * Calculates if a user's input was a hit or miss.
 * @param onsetTime The time of the user's note.
 * @param beatTimes An array of expected beat times from the metronome.
 * @param lastBeatIndex The last beat index that was checked.
 * @returns An object indicating if it was a hit, the timing difference, and the beat index.
 */
export function calculateAccuracy(
  onsetTime: number,
  beatTimes: number[],
  lastBeatIndex: number,
  latencyCompensation: number = DEFAULT_LATENCY
): TimingResult {
  // Apply latency compensation
  const adjustedOnsetTime = onsetTime - latencyCompensation;

  for (let i = lastBeatIndex; i < beatTimes.length; i++) {
    const beatTime = beatTimes[i];
    const rawTiming = onsetTime - beatTime;
    const timingDifference = adjustedOnsetTime - beatTime;
    
    // For on-beat detection, check if timing is near the beat point (0ms or 500ms)
    const isNearBeat = Math.abs(timingDifference) <= TIMING_WINDOW;
    
    if (isNearBeat) {
      // It's a hit - either on-beat or intentionally off-beat
      return { 
        hit: true, 
        timing: timingDifference,
        rawTiming: rawTiming,
        beatIndex: i + 1 
      };
    } else if (adjustedOnsetTime < beatTime - TIMING_WINDOW) {
      // User played too early for this beat
      return { 
        hit: false, 
        timing: timingDifference,
        rawTiming: rawTiming,
        beatIndex: i 
      };
    }
  }
  
  // Onset didn't fall into any future beat window
  return { 
    hit: false, 
    timing: Infinity,
    rawTiming: Infinity,
    beatIndex: lastBeatIndex 
  };
}
