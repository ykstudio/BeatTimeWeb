# BeatTime Development Workflow Guide

## 🎯 Current State Analysis

Your app is well-architected with:
- ✅ Next.js 14+ with App Router
- ✅ Web Audio API implementation started
- ✅ Real-time onset detection (basic level)
- ✅ Shadcn/ui components
- ✅ Firebase integration
- ✅ TypeScript + Tailwind CSS

## 🚀 Optimal Development Workflow

### 1. Cursor Configuration & Extensions

**Essential Cursor Settings:**
```json
// .vscode/settings.json
{
  "audio.autoDetection": true,
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "editor.codeActionsOnSave": {
    "source.addMissingImports": true,
    "source.organizeImports": true
  },
  "files.associations": {
    "*.js": "javascript",
    "audio-processor.js": "javascript"
  }
}
```

**Recommended Extensions:**
- Audio Waveform Viewer (for debugging audio files)
- Thunder Client (API testing for Firebase)
- Error Lens (real-time error highlighting)
- GitLens (version control for audio processing iterations)

### 2. MCP Servers for Your Project

**Audio Development MCP:**
```bash
# Install audio-focused MCP server
npm install -g @mcp/audio-dev-server
```

**Firebase MCP:**
```bash
# Firebase integration MCP
npm install -g @mcp/firebase-tools
```

**Web Performance MCP:**
```bash
# For optimizing Web Audio API performance
npm install -g @mcp/web-perf-analyzer
```

**Browser Testing MCP:**
```bash
# Cross-browser audio testing
npm install -g @mcp/browser-audio-test
```

### 3. AI Agent Recommendations

**Primary Agent: Claude 3.5 Sonnet (Current)**
- Best for: Complex audio processing logic, architecture decisions
- Use for: Web Audio API implementation, onset detection algorithms

**Secondary Agent: GPT-4 Turbo**
- Best for: React/Next.js optimization, UI/UX improvements
- Use for: Component refactoring, performance optimization

**Specialized Agent: Cursor Tab (Built-in)**
- Best for: Rapid iteration on audio parameters
- Use for: Tuning timing windows, threshold adjustments

### 4. Enhanced Tech Stack Recommendations

**Audio Processing Additions:**
```bash
# Add these to your package.json
npm install --save \
  tone.js \              # Advanced Web Audio utilities
  peaks.js \             # Audio waveform visualization
  web-audio-test-api \   # Audio testing utilities
  audio-worklet-polyfill # Better browser compatibility
```

**Development Tools:**
```bash
npm install --save-dev \
  @types/web-audio-api \ # TypeScript definitions
  audio-buffer-utils \   # Audio buffer manipulation
  browser-audio-utils \  # Cross-browser audio helpers
  web-audio-debug-utils  # Debugging tools
```

**Testing Stack:**
```bash
npm install --save-dev \
  @testing-library/user-event \
  mock-audio-context \           # Mock Web Audio for tests
  audio-context-mock            # Jest audio mocking
```

### 5. Audio Development Workflow

**Phase 0.1 Enhanced Audio Test (Days 1-3):**

Create `src/components/enhanced-audio-test.tsx`:
```typescript
"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function EnhancedAudioTest() {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [browserSupport, setBrowserSupport] = useState<string[]>([]);
  const [latency, setLatency] = useState(0);
  
  // Test audio latency and browser compatibility
  const testAudioCapabilities = async () => {
    const support = [];
    
    // Test Web Audio API
    if (window.AudioContext || (window as any).webkitAudioContext) {
      support.push('✅ Web Audio API');
    } else {
      support.push('❌ Web Audio API');
    }
    
    // Test getUserMedia
    if (navigator.mediaDevices?.getUserMedia) {
      support.push('✅ getUserMedia');
    } else {
      support.push('❌ getUserMedia');
    }
    
    // Test AudioWorklet
    try {
      const context = new AudioContext();
      if (context.audioWorklet) {
        support.push('✅ AudioWorklet');
      } else {
        support.push('❌ AudioWorklet');
      }
      context.close();
    } catch {
      support.push('❌ AudioWorklet');
    }
    
    setBrowserSupport(support);
  };
  
  // Test audio latency
  const measureLatency = async () => {
    const context = new AudioContext();
    const startTime = context.currentTime;
    const oscillator = context.createOscillator();
    oscillator.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.1);
    
    const endTime = context.currentTime;
    setLatency((endTime - startTime) * 1000);
    context.close();
  };
  
  useEffect(() => {
    testAudioCapabilities();
    measureLatency();
  }, []);
  
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Enhanced Audio Test</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Browser Support:</h3>
          {browserSupport.map((item, index) => (
            <div key={index}>{item}</div>
          ))}
        </div>
        
        <div>
          <h3 className="font-semibold">Audio Latency:</h3>
          <p>{latency.toFixed(2)}ms</p>
        </div>
        
        <div>
          <h3 className="font-semibold">Audio Level:</h3>
          <Progress value={audioLevel} className="w-full" />
          <p>{audioLevel}%</p>
        </div>
        
        <Button 
          onClick={() => setIsRecording(!isRecording)}
          className="w-full"
        >
          {isRecording ? 'Stop Test' : 'Start Audio Test'}
        </Button>
      </div>
    </Card>
  );
}
```

### 6. Audio Resource Folders

**Recommended Audio Assets Structure:**
```
public/
  audio/
    metronome/
      click-classic.wav     # Traditional metronome click
      click-electronic.wav  # Electronic beep
      click-wood.wav       # Wooden block sound
      click-subtle.wav     # Soft click for practice
    
    samples/
      test-instruments/
        guitar-strum.wav
        piano-note.wav
        drum-hit.wav
        bass-pluck.wav
      
      calibration/
        440hz-sine.wav       # For tuning/calibration
        metronome-test.wav   # Known BPM reference
        latency-test.wav     # For measuring audio latency
    
    feedback/
      success.wav           # Hit feedback
      miss.wav             # Miss feedback
      streak-bonus.wav     # Achievement sounds
```

**Download High-Quality Audio Sources:**
- **Freesound.org** - Professional audio samples (CC licensed)
- **Zapsplat** - Professional sound effects library
- **BBC Sound Effects** - High-quality, royalty-free
- **Adobe Audition Templates** - Metronome and timing sounds

### 8. Cursor-Specific Workflow

**AI-Assisted Audio Development:**

1. **Use Cursor Chat for audio algorithms:**
```
@cursor How can I improve onset detection accuracy for guitar strumming?
```

2. **Code completion for Web Audio API:**
```typescript
// Cursor will autocomplete complex Web Audio chains
const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();
analyser.fftSize = // Cursor suggests optimal values
```

3. **AI debugging for timing issues:**
```
@cursor This timing detection has 20ms latency, how can I optimize it?
```

### 9. Testing Workflow

**Cross-Browser Audio Testing:**
```typescript
// tests/audio-compatibility.test.ts
import { render, screen } from '@testing-library/react';
import { mockAudioContext } from 'audio-context-mock';

describe('Audio Compatibility', () => {
  beforeEach(() => {
    global.AudioContext = mockAudioContext;
  });
  
  test('supports Web Audio API', () => {
    expect(window.AudioContext).toBeDefined();
  });
  
  test('handles audio latency under 50ms', async () => {
    // Test audio latency requirements
  });
});
```

### 10. Performance Monitoring

**Audio Performance Dashboard:**
```typescript
// src/lib/audio-monitor.ts
export class AudioPerformanceMonitor {
  private latencyHistory: number[] = [];
  
  measureLatency(startTime: number, endTime: number) {
    const latency = (endTime - startTime) * 1000;
    this.latencyHistory.push(latency);
    
    if (latency > 50) {
      console.warn(`High audio latency detected: ${latency}ms`);
    }
  }
  
  getAverageLatency() {
    return this.latencyHistory.reduce((a, b) => a + b, 0) / this.latencyHistory.length;
  }
}
```

### 11. Deployment & PWA Optimization

**Audio-Optimized PWA Config:**
```typescript
// next.config.ts
const nextConfig = {
  // Optimize for audio applications
  experimental: {
    serverComponentsExternalPackages: ['tone.js'],
  },
  headers: async () => [
    {
      source: '/audio/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
};
```

This workflow guide provides a professional-grade development environment optimized for building high-performance audio web applications with Cursor. The combination of proper tooling, AI assistance, and audio-specific optimizations will significantly accelerate your development process.