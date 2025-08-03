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
  voice: {
    // Based on your logs: centroid 647-4065Hz, harmonics present but often weaker than guitar
    spectralCentroidRange: [600, 4500],
    dominantBandEnergy: ['bass', 'lowMid', 'mid', 'highMid'],
    harmonicClarity: 0.6, // Good but not as clear as guitar
    zcrRange: [50, 250],
    crestFactorRange: [0.10, 0.45],
    confidenceWeights: { centroid: 0.20, bands: 0.25, harmonics: 0.30, zcr: 0.15, crest: 0.10 }
  },
  shaker: {
    // RECALIBRATED: Your shaker appears to have different characteristics than expected
    // From logs: often confused with bass, suggesting lower frequency content
    spectralCentroidRange: [3000, 7000], // Broadened range
    dominantBandEnergy: ['highMid', 'presence', 'brilliance'],
    harmonicClarity: 0.1, // Very poor harmonic structure (noise-like)
    zcrRange: [400, 1000], // Much higher ZCR for noise-based percussion
    crestFactorRange: [0.25, 0.50], // High transient content
    confidenceWeights: { centroid: 0.30, bands: 0.35, harmonics: 0.05, zcr: 0.25, crest: 0.05 }
  },
  guitar: {
    // RECALIBRATED: From your logs showing much wider centroid range
    spectralCentroidRange: [800, 4500], // Much wider range to capture your guitar
    dominantBandEnergy: ['bass', 'lowMid', 'mid', 'highMid'],
    harmonicClarity: 0.85, // Excellent harmonic series - this is guitar's strongest signature
    zcrRange: [30, 200],
    crestFactorRange: [0.15, 0.40],
    confidenceWeights: { centroid: 0.15, bands: 0.20, harmonics: 0.45, zcr: 0.10, crest: 0.10 } // Higher weight on harmonics
  },
  bass: {
    // From your logs: working well, keeping similar but slightly adjusted
    spectralCentroidRange: [100, 500], // Slightly wider
    dominantBandEnergy: ['sub', 'bass', 'lowMid'],
    harmonicClarity: 0.6, // Better harmonic structure than originally thought
    zcrRange: [80, 350], // Broader ZCR range
    crestFactorRange: [0.04, 0.20], // Broader crest range
    confidenceWeights: { centroid: 0.35, bands: 0.35, harmonics: 0.15, zcr: 0.10, crest: 0.05 }
  }
};

/**
 * Auto-detect instrument based on real-time audio analysis patterns
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
  
  let bestMatch = 'auto';
  let bestConfidence = 0;
  let bestBreakdown = {};
  
  for (const [instrument, signature] of Object.entries(INSTRUMENT_SIGNATURES)) {
    const weights = signature.confidenceWeights;
    let confidence = 0;
    const breakdown: Record<string, number> = {};
    
    // 1. Spectral Centroid Match
    const [centroidMin, centroidMax] = signature.spectralCentroidRange;
    let centroidScore = 0;
    if (spectralCentroid >= centroidMin && spectralCentroid <= centroidMax) {
      centroidScore = 1.0;
    } else {
      const centroidCenter = (centroidMin + centroidMax) / 2;
      const centroidRange = centroidMax - centroidMin;
      const distance = Math.abs(spectralCentroid - centroidCenter) / centroidRange;
      centroidScore = Math.max(0, 1.0 - distance * 0.8);
    }
    breakdown.centroid = centroidScore;
    confidence += centroidScore * weights.centroid;
    
    // 2. Frequency Band Energy Distribution
    let bandScore = 0;
    for (const expectedBand of signature.dominantBandEnergy) {
      if (frequencyBands[expectedBand]) {
        bandScore += frequencyBands[expectedBand].energy / totalEnergy;
      }
    }
    bandScore = bandScore / signature.dominantBandEnergy.length;
    breakdown.bands = bandScore;
    confidence += bandScore * weights.bands;
    
    // 3. Zero Crossing Rate Match
    const [zcrMin, zcrMax] = signature.zcrRange;
    let zcrScore = 0;
    if (zcr >= zcrMin && zcr <= zcrMax) {
      zcrScore = 1.0;
    } else {
      const zcrCenter = (zcrMin + zcrMax) / 2;
      const zcrRange = zcrMax - zcrMin;
      const zcrDistance = Math.abs(zcr - zcrCenter) / zcrRange;
      zcrScore = Math.max(0, 1.0 - zcrDistance * 0.6);
    }
    breakdown.zcr = zcrScore;
    confidence += zcrScore * weights.zcr;
    
    // 4. Crest Factor Match
    const [crestMin, crestMax] = signature.crestFactorRange;
    let crestScore = 0;
    if (crestFactor >= crestMin && crestFactor <= crestMax) {
      crestScore = 1.0;
    } else {
      const crestCenter = (crestMin + crestMax) / 2;
      const crestRange = crestMax - crestMin;
      const crestDistance = Math.abs(crestFactor - crestCenter) / crestRange;
      crestScore = Math.max(0, 1.0 - crestDistance * 0.5);
    }
    breakdown.crest = crestScore;
    confidence += crestScore * weights.crest;
    
    // 5. Harmonic Clarity Assessment
    const strongHarmonics = harmonics.filter(h => h.level > 50).length;
    const totalHarmonics = Math.max(harmonics.length, 1);
    const harmonicRatio = strongHarmonics / totalHarmonics;
    const harmonicScore = 1.0 - Math.abs(harmonicRatio - signature.harmonicClarity);
    breakdown.harmonics = harmonicScore;
    confidence += harmonicScore * weights.harmonics;
    
    if (confidence > bestConfidence) {
      bestConfidence = confidence;
      bestMatch = instrument;
      bestBreakdown = breakdown;
    }
  }
  
  // Only return detection if confidence is above threshold
  if (bestConfidence >= confidenceThreshold) {
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
