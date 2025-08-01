"use client";

import React, { useEffect, useRef, useState } from 'react';

interface AudioWaveformProps {
  audioData: {
    audioLevel: number;
    frequencyData: Uint8Array;
  };
  isActive: boolean;
  beatTimes?: number[]; // Array of beat timestamps
  beatQualities?: number[]; // Array of beat quality scores (0-100)
  latencyCompensation?: number; // Latency compensation in seconds
  currentTime?: number; // Current audio context time
  bpm?: number; // BPM for constant metronome lines
  currentBeat?: number; // Current beat number for highlighting
}

export default function AudioWaveform({ 
  audioData, 
  isActive, 
  beatTimes = [], 
  beatQualities = [], 
  latencyCompensation = 0,
  bpm = 120,
  currentBeat = 0 
}: AudioWaveformProps) {
  const [speedCorrectionFactor, setSpeedCorrectionFactor] = useState(1.8);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const waveformDataRef = useRef<number[]>([]);
  const lastDataTimeRef = useRef<number>(0);
  
  // Use device pixel ratio for crisp rendering
  const CANVAS_WIDTH = 1600; // Even higher resolution for better quality
  const CANVAS_HEIGHT = 240; // Higher resolution  
  const DISPLAY_WIDTH = 800;  // Larger display size
  const DISPLAY_HEIGHT = 120; // Display size
  const MAX_DATA_POINTS = 400; // More data points for smoother curves
  const TIME_WINDOW = 10; // Show last 10 seconds of audio

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawWaveform = () => {
      // Set up high-DPI rendering
      const dpr = window.devicePixelRatio || 1;
      canvas.width = CANVAS_WIDTH * dpr;
      canvas.height = CANVAS_HEIGHT * dpr;
      ctx.scale(dpr, dpr);
      
      // Enable anti-aliasing for smooth lines
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Clear canvas with dark background
      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Add data points based on actual time intervals to match beat line speed
      if (isActive) {
        const currentTime = Date.now() / 1000;
        
        // Calculate how often we should add data points to match our time window
        // TIME_WINDOW seconds should contain MAX_DATA_POINTS
        const targetDataInterval = TIME_WINDOW / MAX_DATA_POINTS; // seconds per data point
        
        // Initialize timing
        if (lastDataTimeRef.current === 0) {
          lastDataTimeRef.current = currentTime;
        }
        
        // Only add data if enough time has passed
        const timeSinceLastData = currentTime - lastDataTimeRef.current;
        if (timeSinceLastData >= targetDataInterval) {
          // Normalize current audio level (0-100) to canvas height
          const normalizedLevel = (audioData.audioLevel / 100) * (CANVAS_HEIGHT / 2);
          waveformDataRef.current.push(normalizedLevel);
          
          // Keep only the last MAX_DATA_POINTS for the time window
          if (waveformDataRef.current.length > MAX_DATA_POINTS) {
            waveformDataRef.current.shift();
          }
          
          // Update last data time
          lastDataTimeRef.current = currentTime;
        }
      }

      // Draw subtle grid lines
      ctx.strokeStyle = '#334155'; // slate-700
      ctx.lineWidth = 0.5;
      
      // Horizontal center line
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_HEIGHT / 2);
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT / 2);
      ctx.stroke();

      // Vertical grid lines (every 50px)
      for (let x = 0; x <= CANVAS_WIDTH; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }

      // Draw smooth waveform with curves
      if (waveformDataRef.current.length > 1) {
        const stepX = CANVAS_WIDTH / MAX_DATA_POINTS;
        
        // Create smooth curves using quadratic curves
        const drawSmoothWave = (yOffset: number, color: string, lineWidth: number) => {
          ctx.strokeStyle = color;
          ctx.lineWidth = lineWidth;
          ctx.beginPath();
          
          for (let i = 0; i < waveformDataRef.current.length; i++) {
            const level = waveformDataRef.current[i];
            const x = i * stepX;
            const y = (CANVAS_HEIGHT / 2) + yOffset * level;
            
            if (i === 0) {
              ctx.moveTo(x, y);
            } else if (i === 1) {
              ctx.lineTo(x, y);
            } else {
              // Use quadratic curve for smoothness
              const prevX = (i - 1) * stepX;
              const prevY = (CANVAS_HEIGHT / 2) + yOffset * waveformDataRef.current[i - 1];
              const cpX = (prevX + x) / 2;
              const cpY = (prevY + y) / 2;
              ctx.quadraticCurveTo(cpX, cpY, x, y);
            }
          }
          ctx.stroke();
        };
        
        // Draw positive waveform (above center) with glow effect
        drawSmoothWave(-1, '#22d3ee', 3); // cyan-400 with glow
        drawSmoothWave(-1, '#06b6d4', 1.5); // cyan-500 core line

        // Draw negative waveform (below center) with mirror effect
        drawSmoothWave(1, '#0891b2', 3); // cyan-600 with glow
        drawSmoothWave(1, '#0e7490', 1.5); // cyan-700 core line

        // Draw current audio level indicator (right edge) with glow
        if (isActive && audioData.audioLevel > 0) {
          const currentLevel = (audioData.audioLevel / 100) * (CANVAS_HEIGHT / 2);
          
          // Bright indicator for current level with glow effect
          ctx.fillStyle = '#f59e0b'; // amber-500
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 8;
          ctx.fillRect(CANVAS_WIDTH - 6, (CANVAS_HEIGHT / 2) - currentLevel - 3, 6, 6);
          ctx.fillRect(CANVAS_WIDTH - 6, (CANVAS_HEIGHT / 2) + currentLevel - 3, 6, 6);
          ctx.shadowBlur = 0; // Reset shadow
        }
      }

      // Draw constant metronome lines based on BPM (always visible)
      // Calculate beat interval from BPM
      const beatIntervalSeconds = 60 / bpm; // seconds per beat
      const baseTimePerDataPoint = TIME_WINDOW / MAX_DATA_POINTS;
      
      // Apply speed correction factor
      const correctedBeatInterval = Math.abs(speedCorrectionFactor) > 0 
        ? beatIntervalSeconds / Math.abs(speedCorrectionFactor)
        : beatIntervalSeconds;
      
      // Calculate how many data points represent one beat
      const dataPointsPerBeat = correctedBeatInterval / baseTimePerDataPoint;
      
      // Calculate which beat should be highlighted as current
      const currentBeatInWindow = isActive && currentBeat > 0 ? 
        (currentBeat - 1) % Math.floor(MAX_DATA_POINTS / dataPointsPerBeat) : -1;
      
      // Draw metronome lines at regular intervals
      let beatIndex = 0;
      for (let i = 0; i < MAX_DATA_POINTS; i += dataPointsPerBeat) {
        const xPosition = (i / MAX_DATA_POINTS) * CANVAS_WIDTH;
        
        if (xPosition >= 0 && xPosition <= CANVAS_WIDTH) {
          // Determine if this is the current beat
          const isCurrentBeat = beatIndex === currentBeatInWindow;
          
          // Metronome line style - white for current beat, blue for others
          ctx.strokeStyle = isCurrentBeat ? '#ffffff' : '#4a90e2';
          ctx.lineWidth = isCurrentBeat ? 3 : 2;
          ctx.shadowColor = '#fff';
          ctx.shadowBlur = isCurrentBeat ? 2 : 1;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          // Draw vertical line
          ctx.beginPath();
          ctx.moveTo(xPosition, 0);
          ctx.lineTo(xPosition, CANVAS_HEIGHT);
          ctx.stroke();
          
          // Reset shadow
          ctx.shadowBlur = 0;
          
          // Draw beat marker at the top
          ctx.fillStyle = isCurrentBeat ? '#ffffff' : '#4a90e2';
          ctx.font = isCurrentBeat ? '12px monospace' : '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('♪', xPosition, isCurrentBeat ? 16 : 15);
          ctx.textAlign = 'left'; // Reset alignment
        }
        
        beatIndex++;
      }

      // Draw labels
      ctx.fillStyle = '#9ca3af'; // gray-400
      ctx.font = '10px monospace';
      ctx.fillText('Audio Input Level', 8, 15);
      ctx.fillText(`${audioData.audioLevel.toFixed(1)}%`, CANVAS_WIDTH - 50, 15);

      // Continue animation if active
      if (isActive) {
        animationFrameRef.current = requestAnimationFrame(drawWaveform);
      }
    };

    // Start drawing
    drawWaveform();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioData, isActive]);

  // Reset waveform data when inactive
  useEffect(() => {
    if (!isActive) {
      waveformDataRef.current = [];
      lastDataTimeRef.current = 0;
    }
  }, [isActive]);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-muted-foreground">Audio Input Waveform</h3>
        <div className="flex items-center gap-4">
          {/* Speed Correction Control */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Beat Speed:</span>
            <input
              type="range"
              min="-3.0"
              max="3.0"
              step="0.1"
              value={speedCorrectionFactor}
              onChange={(e) => setSpeedCorrectionFactor(Number(e.target.value))}
              className="w-20 h-1"
            />
            <span className="text-xs text-muted-foreground w-8">{speedCorrectionFactor.toFixed(1)}x</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-xs text-muted-foreground">
              {isActive ? 'Recording' : 'Stopped'}
            </span>
          </div>
        </div>
      </div>
      <div className="border border-gray-700 rounded-lg p-2 bg-black/50">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-auto max-w-full"
          style={{ 
            width: `${DISPLAY_WIDTH}px`, 
            height: `${DISPLAY_HEIGHT}px`,
            imageRendering: 'auto' // Enable smooth scaling
          }}
        />
      </div>
      <div className="text-xs text-muted-foreground text-center">
        Real-time audio input visualization • Cyan: signal level • Amber: current peak • Blue lines: metronome grid • White line: current beat ({bpm} BPM)
      </div>
    </div>
  );
}