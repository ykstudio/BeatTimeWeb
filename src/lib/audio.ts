// This is a placeholder for a more sophisticated onset detection.
// For now, we'll simulate it, but this is where the core audio processing logic will go.

export const TIMING_WINDOW = 0.1; // 100ms timing window (50ms before, 50ms after beat)

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
) {
  for (let i = lastBeatIndex; i < beatTimes.length; i++) {
    const beatTime = beatTimes[i];
    const timingDifference = onsetTime - beatTime;
    
    if (Math.abs(timingDifference) <= TIMING_WINDOW) {
      // It's a hit
      return { hit: true, timing: timingDifference, beatIndex: i + 1 };
    } else if (onsetTime < beatTime - TIMING_WINDOW) {
      // User played too early for this beat, and we assume they won't hit a previous beat again.
      // This case might mean they missed the previous beat and are early for the current one.
      // We'll consider it a miss for the beat they are closest to but outside the window.
      // If they are very early, we just wait for the next onset.
      return { hit: false, timing: timingDifference, beatIndex: i };
    }
    // If the onset is after the current beat's window, check the next beat.
  }
  
  // Onset didn't fall into any future beat window.
  return { hit: false, timing: Infinity, beatIndex: lastBeatIndex };
}
