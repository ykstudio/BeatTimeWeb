# BeatTime - v2 Feature Additions PRD

## 1. Overview

This document outlines the features developed for BeatTime after the initial Core MVP was established. The goal of these features was to provide richer, more detailed feedback to the musician, enhancing the training experience by visualizing more aspects of the audio input and providing granular, measure-by-measure accuracy feedback.

## 2. Feature Specifications

### F2.1: Advanced Real-time Audio Analysis & Visualization

**User Problem**: Musicians need more than just hit/miss feedback. Understanding the quality of their sound (timbre, loudness, pitch) provides a more holistic practice session.

**Implementation**: A dedicated "Audio Analysis" card was created to house several new visualizations, driven by real-time data from the `useAudioData` hook.

-   **F2.1.1: Velocity Meter**
    -   **Description**: A vertical meter that displays the intensity (0-20) of the detected audio input, referred to as "Velocity." This helps users see how hard they are playing.
    -   **Component**: `src/components/velocity-meter.tsx`
    -   **Data Source**: `audioAnalysisData.audioLevel` from `useAudioData` hook.

-   **F2.1.2: Dominant Note Display**
    -   **Description**: A display that shows the closest musical note (e.g., "A4", "C#5") for the most prominent frequency in the audio input.
    -   **Component**: Integrated into `src/components/audio-analysis-display.tsx`
    -   **Data Source**: `audioAnalysisData.dominantFrequency` converted via `frequencyToNoteName` lib.

-   **F2.1.3: Timbre Visualization**
    -   **Description**: A colored circle that dynamically changes hue based on the "brightness" or timbre of the sound. Bright, sharp sounds (high spectral centroid) have a different color from dark, mellow sounds (low spectral centroid).
    -   **Component**: Integrated into `src/components/audio-analysis-display.tsx`
    -   **Data Source**: `audioAnalysisData.spectralCentroid`. Color is calculated via `getTimbreColor` function.

-   **F2.1.4: Audio Spectrum Visualizer**
    -   **Description**: A 32-bar visualizer showing the real-time frequency distribution of the audio input.
    -   **Component**: `src/components/audio-visualizer.tsx`
    -   **Data Source**: `audioAnalysisData.frequencyData`.

### F2.2: Granular Rhythm Feedback System

**User Problem**: Overall accuracy is useful, but musicians need to know *when* they are inaccurate. Feedback on a measure-by-measure basis helps pinpoint specific problem areas.

**Implementation**: Two new components were created to visualize accuracy over time. Both are driven by a 4-beat cycle accuracy calculation performed in the main `page.tsx` component.

-   **F2.2.1: Rhythm Matrix**
    -   **Description**: A single, color-coded block that represents the rhythm accuracy of the current 4-beat measure. The color changes from red (inaccurate) to green (accurate) based on performance within that measure. It resets every four beats.
    -   **Component**: `src/components/rhythm-matrix.tsx`
    -   **Data Source**: `fourBeatAccuracy` state variable in `page.tsx`.

-   **F2.2.2: Song Grid**
    -   **Description**: A 16x16 grid (representing 256 measures) that creates a visual "quilt" of the entire practice session. At the end of each 4-beat measure, a new square is added to the grid, colored according to the accuracy of the measure that just finished.
    -   **Component**: `src/components/song-grid.tsx`
    -   **Data Source**: `songGridColors` state array in `page.tsx`.

### F2.3: Automatic Audio Latency Calibration (Currently Disabled/Buggy)

**User Problem**: The time it takes for sound to travel from the speaker, be picked up by the microphone, and processed by the browser can vary. This latency can cause accurately played notes to be registered as misses.

**Implementation (Intended)**: A system to automatically calculate and compensate for this latency.

-   **F2.3.1: Calibration Sequence**
    -   **Description**: On starting a session, the app was intended to play a series of metronome clicks. By measuring the time difference between when a click was scheduled and when the sound was detected by the microphone, an average latency could be calculated.
    -   **Component**: `src/components/calibration-overlay.tsx` (now unused).
    -   **Status**: This feature introduced significant bugs, particularly in state management and the core hit detection logic. It has been the source of the recent "no streak" and "no metronome" issues and is currently removed from the active codebase until the core functionality is stable.

## 3. Technical Implementation Summary

-   The `useAudioData` hook (`src/hooks/use-audio-data.ts`) was enhanced to calculate `dominantFrequency` and `spectralCentroid` in addition to the raw `audioLevel` and `frequencyData`.
-   The main page component (`src/app/page.tsx`) was updated to manage the state for these new features, including `fourBeatAccuracy` and the `songGridColors`.
-   The `handleBeat` function in `page.tsx` was modified to be the primary trigger for the measure-by-measure accuracy calculations.
-   The `AudioAnalysisDisplay` component (`src/components/audio-analysis-display.tsx`) was created to act as a container for the new visualization components.

**Conclusion**: The features in F2.1 and F2.2 represent a significant step forward in providing detailed, actionable feedback. However, the attempt to implement F2.3 introduced instability that has compromised the core application loop. The immediate priority is to restore the stable, working functionality of the core practice loop *before* re-attempting latency calibration.
