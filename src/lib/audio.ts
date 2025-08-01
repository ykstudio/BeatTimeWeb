// This is a placeholder for a more sophisticated onset detection.
// For now, we'll simulate it, but this is where the core audio processing logic will go.

export const TIMING_WINDOW = 0.2; // 200ms timing window (100ms before, 100ms after beat)
export const DEFAULT_LATENCY = 0.13; // Default 130ms latency compensation based on observed timing

export interface TimingResult {
  hit: boolean;
  timing: number;
  rawTiming: number; // Before latency compensation
  beatIndex: number;
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
