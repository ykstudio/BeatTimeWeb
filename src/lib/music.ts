
const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Common chord patterns (intervals from root)
const chordPatterns = {
    'major': [0, 4, 7],
    'minor': [0, 3, 7],
    'major7': [0, 4, 7, 11],
    'minor7': [0, 3, 7, 10],
    'dominant7': [0, 4, 7, 10],
    'diminished': [0, 3, 6],
    'augmented': [0, 4, 8],
    'sus2': [0, 2, 7],
    'sus4': [0, 5, 7]
};

export interface PitchAnalysis {
    frequency: number;
    noteName: string;
    midiNumber: number;
    cents: number; // How many cents off from perfect pitch
    octave: number;
    noteIndex: number;
}

export interface ChordAnalysis {
    detectedNotes: PitchAnalysis[];
    possibleChords: Array<{
        root: string;
        type: string;
        confidence: number;
        notes: string[];
    }>;
    dominantNote: PitchAnalysis | null;
}

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

/**
 * Detailed pitch analysis including cents deviation
 */
export function analyzePitch(frequency: number, threshold: number = 30): PitchAnalysis | null {
    if (frequency < threshold) {
        return null;
    }

    const midiNum = 12 * (Math.log(frequency / 440) / Math.log(2)) + 69;
    const roundedMidi = Math.round(midiNum);
    const cents = Math.round((midiNum - roundedMidi) * 100);
    const noteIndex = roundedMidi % 12;
    const octave = Math.floor(roundedMidi / 12) - 1;
    
    return {
        frequency,
        noteName: noteStrings[noteIndex] + octave,
        midiNumber: roundedMidi,
        cents,
        octave,
        noteIndex
    };
}

/**
 * Find multiple peaks in frequency spectrum for chord detection
 */
export function findFrequencyPeaks(frequencyData: Uint8Array, sampleRate: number, minAmplitude: number = 50): number[] {
    const peaks: number[] = [];
    const binSize = sampleRate / (frequencyData.length * 2);
    
    // Find local maxima above threshold
    for (let i = 2; i < frequencyData.length - 2; i++) {
        const amplitude = frequencyData[i];
        if (amplitude > minAmplitude &&
            amplitude > frequencyData[i - 1] &&
            amplitude > frequencyData[i - 2] &&
            amplitude > frequencyData[i + 1] &&
            amplitude > frequencyData[i + 2]) {
            
            const frequency = i * binSize;
            if (frequency > 50 && frequency < 2000) { // Musical range
                peaks.push(frequency);
            }
        }
    }
    
    // Sort by amplitude (strongest first)
    return peaks.sort((a, b) => {
        const aIndex = Math.round(a / binSize);
        const bIndex = Math.round(b / binSize);
        return frequencyData[bIndex] - frequencyData[aIndex];
    }).slice(0, 6); // Keep top 6 peaks
}

/**
 * Analyze chord from multiple frequencies
 */
export function analyzeChord(frequencies: number[]): ChordAnalysis {
    const detectedNotes = frequencies
        .map(freq => analyzePitch(freq))
        .filter((pitch): pitch is PitchAnalysis => pitch !== null)
        .sort((a, b) => a.frequency - b.frequency); // Sort by frequency (low to high)

    const possibleChords: ChordAnalysis['possibleChords'] = [];
    
    if (detectedNotes.length >= 2) {
        // Try each detected note as a potential root
        for (const rootNote of detectedNotes) {
            for (const [chordType, intervals] of Object.entries(chordPatterns)) {
                const expectedNotes = intervals.map(interval => 
                    (rootNote.noteIndex + interval) % 12
                );
                
                // Count how many detected notes match this chord
                const matches = detectedNotes.filter(note => 
                    expectedNotes.includes(note.noteIndex)
                ).length;
                
                const confidence = matches / Math.max(expectedNotes.length, detectedNotes.length);
                
                if (confidence > 0.5) { // At least 50% match
                    possibleChords.push({
                        root: noteStrings[rootNote.noteIndex],
                        type: chordType,
                        confidence: confidence * 100,
                        notes: expectedNotes.map(idx => noteStrings[idx])
                    });
                }
            }
        }
    }
    
    // Sort by confidence
    possibleChords.sort((a, b) => b.confidence - a.confidence);
    
    return {
        detectedNotes,
        possibleChords: possibleChords.slice(0, 3), // Top 3 matches
        dominantNote: detectedNotes.length > 0 ? detectedNotes[0] : null
    };
}

/**
 * Get instrument-specific frequency ranges
 */
export function getInstrumentRange(instrument: string): { min: number; max: number; typical: number } {
    const ranges = {
        'bass': { min: 41, max: 350, typical: 100 },
        'guitar': { min: 82, max: 1000, typical: 250 },
        'drums': { min: 60, max: 8000, typical: 200 },
        'vocals': { min: 85, max: 1100, typical: 300 },
        'piano': { min: 27, max: 4200, typical: 500 },
        'auto': { min: 30, max: 2000, typical: 200 }
    };
    
    return ranges[instrument] || ranges['auto'];
}
