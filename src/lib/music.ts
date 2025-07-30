
const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/**
 * Converts a frequency in Hz to a musical note name.
 * @param frequency The frequency to convert.
 * @param threshold The minimum frequency to consider.
 * @returns The note name (e.g., "A4") or "---" if below the threshold.
 */
export function frequencyToNoteName(frequency: number, threshold: number = 30): string {
    if (frequency < threshold) {
        return "---";
    }

    const midiNum = 12 * (Math.log(frequency / 440) / Math.log(2)) + 69;
    const noteIndex = Math.round(midiNum) % 12;
    const octave = Math.floor(Math.round(midiNum) / 12) - 1;
    
    return noteStrings[noteIndex] + octave;
}
