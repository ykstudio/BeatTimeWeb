# BeatTime - Product Requirements Document

## Executive Summary

**Product Name**: BeatTime  
**Product Type**: Web Music Training Application  
**Platform**: Progressive Web App (PWA) - Desktop & Mobile Web  
**Target Launch**: Q2 2025  

BeatTime is a rhythm training web application designed to help musicians improve their timing accuracy through real-time audio analysis and gamified practice sessions. The app listens to instrument playing via browser microphone, measures timing precision against a metronome, and provides immediate feedback with scoring and achievements.

## Problem Statement

### Core Problem
Most musicians struggle with timing consistency - the ability to play precisely on the beat. While metronomes exist, they provide no feedback on actual performance, leaving musicians unaware of their timing accuracy.

### Current Market Gaps
- **Traditional metronomes**: No performance feedback
- **Existing apps**: Focus on theory rather than practical skill development  
- **Music teachers**: Limited time to focus on timing precision
- **Practice efficiency**: Musicians spend time on timing issues without objective measurement

### Target Pain Points
- Musicians don't know how accurate their timing actually is
- No objective way to measure timing improvement over time
- Boring, repetitive practice with traditional metronomes
- Lack of motivation to practice timing consistently

## Market Opportunity

### Target Market Size
- **Primary**: 50M amateur musicians worldwide seeking to improve
- **Secondary**: 2M music students and semi-professionals
- **Tertiary**: 100K music teachers and instructors

### User Segments

#### Primary Users
**Hobbyist Musicians (70% of users)**
- Age: 16-45
- Play guitar, bass, drums, piano
- Practice 2-5 hours/week
- Willing to pay $5-15/month for improvement tools

**Music Students (20% of users)**  
- Age: 12-25
- Formal or informal music education
- Need objective practice feedback
- Schools/teachers may purchase

**Semi-Professional Musicians (10% of users)**
- Age: 20-50  
- Perform regularly, teach lessons
- Highest engagement and willingness to pay
- Potential ambassadors and content creators

### Competitive Analysis

| Competitor | Strengths | Weaknesses | Market Position |
|------------|-----------|------------|----------------|
| **Online Metronomes** | Free, accessible | No feedback/scoring | Basic utility |
| **Guitar Tuna Web** | Simple, popular | No rhythm training | Tuning focused |
| **Yousician** | Gamification, lessons | Limited timing focus | Broad music education |
| **Simply Piano** | Good UX, popular | Piano only, no timing measurement | Instrument specific |

**Competitive Advantage**: Only web app providing real-time timing accuracy measurement with gamified improvement tracking across all instruments, accessible from any device with a browser.

## Product Vision & Strategy

### Vision Statement
"Empower every musician to develop perfect timing through intelligent, engaging practice that turns rhythm improvement into an addictive game - accessible anywhere, anytime."

### Product Strategy
1. **Phase 1**: Prove technical feasibility with core timing detection using Web Audio API
2. **Phase 2**: Add gamification to drive engagement and retention  
3. **Phase 3**: Build social features for community and virality
4. **Phase 4**: Expand to advanced training modes and educational partnerships

### Success Metrics
- **Acquisition**: 10K unique users in first 3 months
- **Engagement**: 40% Day-7 retention, 15+ min average session
- **Monetization**: $50K MRR by month 6
- **Product**: 90%+ timing detection accuracy across browsers

## User Experience & Core Features

### User Journey

#### Onboarding Flow
1. **Welcome & Value Prop** - "Improve your timing in 30 days"
2. **Browser Compatibility Check** - Verify Web Audio API support
3. **Instrument Selection** - Choose primary instrument
4. **Skill Assessment** - 2-minute timing test for baseline  
5. **Microphone Permission** - Request and test microphone access
6. **First Practice** - Guided 5-minute session with immediate results

#### Core Practice Loop
1. **Choose Practice Mode** - Daily challenge, free practice, or battle
2. **Set Parameters** - Tempo (40-200 BPM), time signature, duration
3. **Practice Session** - Visual metronome + live recording + real-time feedback
4. **Results & Scoring** - Accuracy percentage, streak updates, achievements earned
5. **Progress Tracking** - View improvement graphs and compare to previous sessions

### Feature Specifications

#### Phase 1: Core MVP (Weeks 1-6)

**F1.1 Web Audio Engine**
- Web Audio API for real-time microphone processing
- AudioContext-based amplitude detection for note onsets
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Timing accuracy calculation vs. metronome with <50ms latency
- Adjustable sensitivity for different instruments

**F1.2 PWA Metronome System**
- Visual and audio metronome (40-200 BPM) using Web Audio API
- Common time signatures (4/4, 3/4, 2/4)
- Customizable click sounds with audio buffer management
- Precise timing using AudioContext scheduler
- Offline functionality when cached

**F1.3 Practice Sessions**
- Browser-based session recording with timing analysis
- Real-time accuracy display during practice
- Session summary with detailed statistics
- Local storage for practice history with cloud sync
- Export session data as JSON

**F1.4 Basic Scoring**
- Client-side accuracy percentage calculation
- Streak tracking with localStorage persistence
- Personal best records
- Practice time logging with session analytics

**F1.5 User Management (PWA)**
- Account creation via Firebase Authentication
- Social login (Google, Apple, GitHub, Facebook)  
- Profile sync across devices using Firestore
- Offline-first with Firebase offline persistence
- Progressive enhancement for mobile users

#### Phase 2: Gamification (Weeks 7-10)

**F2.1 Level System**
- Progressive skill levels: Novice → Intermediate → Advanced → Expert → Master
- Level advancement based on consistency and accuracy
- Unlock new features and challenges at each level
- Visual progress indicators with CSS animations

**F2.2 Achievement System**
- **Practice Achievements**: "First Session", "Week Warrior" (7-day streak)
- **Accuracy Achievements**: "Perfect Score" (100% accuracy), "Consistent Player" (90%+ for 5 sessions)
- **Challenge Achievements**: "Speed Demon" (120+ BPM), "Complex Rhythm" (odd time signatures)
- **Social Achievements**: "Battle Winner", "Community Helper"
- Achievement notifications with Web Notifications API

**F2.3 Daily Challenges**
- Server-generated daily challenges
- Rotating challenge types: speed, accuracy, endurance, complex rhythms
- Special rewards for completion
- Global leaderboard for daily performance
- Push notifications via Service Worker

**F2.4 Advanced Scoring**
- Combo multipliers for consistent accuracy
- Difficulty bonuses for higher tempos/complex rhythms
- Streak bonuses (up to 50% score boost)
- Weekly and monthly score competitions with real-time updates

#### Phase 3: Social Features (Weeks 11-14)

**F3.1 Friend System**
- Add friends via username or email invitation
- Friend activity feed using Firebase Realtime Database listeners  
- Private leaderboards among friend groups
- Challenge friends to practice sessions

**F3.2 Battle Mode**
- Real-time 1v1 rhythm battles using WebRTC for low latency
- Match-making based on skill level
- Battle history and win/loss records
- Tournament brackets for community events
- Spectator mode for watching battles

**F3.3 Leaderboards**
- Global rankings (daily, weekly, monthly, all-time)
- Category-specific leaderboards (by instrument, tempo, etc.)
- Friend leaderboards with social sharing
- Regional rankings based on IP geolocation

**F3.4 Social Sharing**
- Share achievements on social media with Open Graph meta tags
- Export practice session videos using MediaRecorder API
- Community challenges and group goals
- Success story sharing with embedded widgets

#### Phase 4: Advanced Training (Weeks 15-18)

**F4.1 Progressive Training Modes**
- **Fade-Out Mode**: Metronome gradually becomes quieter using Web Audio gain nodes
- **Silent Mode**: Practice without metronome assistance  
- **Variable Tempo**: Tempo changes during practice with smooth transitions
- **Subdivision Training**: Focus on eighth notes, triplets, etc.

**F4.2 Advanced Rhythm Patterns**
- Complex time signatures (5/4, 7/8, etc.) with visual guides
- Polyrhythmic exercises with multiple click tracks
- Genre-specific rhythm patterns (rock, jazz, latin, etc.)
- Custom rhythm pattern creator with drag-and-drop interface

**F4.3 Visual Notation**
- SVG-based rhythm notation display
- Chord progressions for practice with interactive diagrams
- Tab notation for guitar/bass using Web Components
- Drum pattern visualization with animated elements

**F4.4 Educational Content**
- Embedded video lessons using HTML5 video
- Interactive rhythm theory explanations
- Tips from professional musicians
- Instrument-specific guidance with adaptive content

## Technical Requirements

### Web Technology Stack
- **Frontend Framework**: Next.js 14+ with App Router  
- **CSS Methodology**: BEM (Block Element Modifier) with CSS Modules
- **Audio Processing**: Web Audio API with AudioWorklet for performance
- **Backend**: Firebase (Firestore, Authentication, Cloud Functions)
- **Real-time**: Firebase Realtime Database + WebSocket connections
- **PWA**: Service Worker + Web App Manifest
- **Analytics**: Firebase Analytics + Google Analytics 4

### Browser Compatibility Requirements
- **Chrome/Edge**: 88+ (full Web Audio API support)
- **Firefox**: 85+ (AudioWorklet support)
- **Safari**: 14.1+ (getUserMedia improvements)
- **Mobile Safari**: iOS 14.3+ (Web Audio API fixes)
- **Graceful degradation**: Basic metronome for unsupported browsers

### Audio Processing Requirements
- **Latency**: <50ms from sound to detection
- **Accuracy**: 95%+ onset detection accuracy across browsers
- **Sample Rate**: 44.1kHz for precise timing
- **Buffer Size**: 256-1024 samples for optimal performance
- **Background Processing**: AudioWorklet to avoid main thread blocking

### Performance Requirements  
- **First Contentful Paint**: <1.5 seconds
- **Time to Interactive**: <3 seconds
- **Practice Session Start**: <2 seconds from click to recording
- **Bundle Size**: <500KB initial JS bundle
- **Offline Support**: Core features work without internet

### PWA Requirements  
- **Installable**: Meets PWA installation criteria
- **Offline-First**: Critical features work offline with Firestore offline persistence
- **Background Sync**: Firebase offline queue for practice data sync
- **Push Notifications**: Firebase Cloud Messaging for practice reminders
- **Responsive**: BEM-based responsive design for mobile, tablet, desktop

### Data & Privacy
- **GDPR Compliance**: EU user data protection with cookie consent
- **Audio Privacy**: Audio processed locally, not transmitted to servers
- **Local Storage**: IndexedDB for offline practice sessions
- **Cloud Backup**: Optional encrypted backup to Supabase
- **Export Options**: Allow users to export all their data

## Business Model & Monetization

### Revenue Streams

#### Primary: Freemium SaaS
- **Free Tier**: 3 practice sessions/day, basic scoring, limited features
- **Premium ($4.99/month)**: Unlimited sessions, all features, detailed analytics
- **Pro ($12.99/month)**: Advanced training modes, priority support, early features

#### Secondary Revenue  
- **One-time Features**: Instrument-specific training packs ($1.99-4.99)
- **Educational SaaS**: Sell to music schools and teachers ($50-200/classroom/year)
- **Affiliate Marketing**: Music gear recommendations and links
- **White-label Licensing**: Custom versions for music companies

### Pricing Strategy
- **Free trial**: 14-day full premium access
- **Student discount**: 50% off with .edu email verification
- **Annual plans**: 2 months free (20% discount)
- **Family plans**: Up to 6 accounts for $19.99/month
- **Lifetime deal**: $199 one-time payment for early adopters

### Unit Economics (Month 12 projection)
- **Free users**: 8,000 (80%)
- **Premium users**: 1,800 (18%) - $4.99/month
- **Pro users**: 200 (2%) - $12.99/month
- **Monthly Revenue**: ~$11,600
- **User Acquisition Cost**: $6 (lower due to web virality)
- **Lifetime Value**: $75 (better retention than mobile apps)

## Marketing & Go-to-Market

### Launch Strategy

#### Pre-Launch (Months 1-2)
- **Beta Program**: 100 musician beta testers via web link
- **SEO Foundation**: Blog content about timing, rhythm, practice tips
- **Music Community Engagement**: Reddit, Discord, Facebook groups
- **Influencer Outreach**: Music YouTubers and TikTok creators

#### Launch (Month 3)
- **Product Hunt Launch**: Coordinate launch day with community
- **SEO Optimization**: Target keywords like "online metronome", "rhythm trainer"
- **Social Media**: Instagram, TikTok videos showing improvement
- **Partnership Outreach**: Music blogs, online music communities

#### Post-Launch (Months 4-6)
- **Content Marketing**: SEO-optimized blog posts about music practice
- **User-Generated Content**: Share success stories and improvements
- **Referral Program**: Free premium month for successful referrals
- **Educational Partnerships**: Music schools and private instructors

### Marketing Channels
1. **Organic**: SEO, social media content, user referrals, viral sharing
2. **Paid**: Google Ads, Facebook/Instagram ads, YouTube pre-roll
3. **Partnerships**: Music YouTubers, gear companies, music schools
4. **Content**: Educational blog posts, practice tips, musician interviews
5. **Web-Specific**: Product Hunt, Hacker News, web development communities

## Risk Assessment & Mitigation

### Technical Risks
**Risk**: Browser audio API inconsistencies across platforms
**Mitigation**: Extensive cross-browser testing, polyfills, graceful degradation

**Risk**: Web Audio API limitations vs. native mobile apps
**Mitigation**: Use AudioWorklet for performance, optimize for web constraints

**Risk**: Users disable microphone permissions
**Mitigation**: Clear explanation of permissions, fallback practice modes

### Market Risks  
**Risk**: Low user adoption due to web app stigma
**Mitigation**: PWA installation, native-like experience, performance optimization

**Risk**: Competition from native mobile apps
**Mitigation**: Leverage web advantages: instant access, no downloads, cross-platform

### Business Risks
**Risk**: Insufficient conversion from free users
**Mitigation**: Optimize conversion funnel, add value-driven premium features

**Risk**: High customer acquisition costs  
**Mitigation**: Focus on SEO, viral features, content marketing

## Success Criteria & KPIs

### Product-Market Fit Indicators
- **Retention**: 40% Day-7, 25% Day-30 retention rates
- **Engagement**: 15+ minutes average session duration  
- **NPS Score**: 50+ Net Promoter Score from active users
- **Organic Growth**: 40%+ of new users from referrals/SEO

### Business Success Metrics
- **User Growth**: 10K users by month 3, 50K by month 6
- **Revenue**: $10K MRR by month 6, $50K MRR by month 12
- **Conversion**: 18%+ free-to-paid conversion rate (higher than mobile)
- **Churn**: <8% monthly churn for premium subscribers

### Technical Performance Metrics
- **Core Web Vitals**: 90+ Lighthouse score
- **Audio Latency**: <50ms average across browsers
- **Detection Accuracy**: 95%+ timing detection accuracy
- **PWA Metrics**: 60%+ installation rate on mobile

### Operational Metrics
- **Browser Support**: Works on 95%+ of target browsers
- **Customer Support**: <12 hour response time, 95%+ satisfaction
- **Feature Usage**: 70%+ of users complete daily challenges
- **SEO Performance**: Top 3 ranking for "rhythm trainer online"

## Roadmap & Timeline

### Phase 0.1: Audio Feasibility Test (Week 1 - Days 1-3)
**🎯 Goal**: Validate browser audio capabilities before any development

#### Core Requirements:
- **Microphone Access**: Request and receive browser microphone permissions
- **Audio Level Detection**: Display real-time audio input levels (0-100%)
- **Cross-Browser Testing**: Verify functionality on Chrome, Firefox, Safari, Edge
- **Mobile Browser Testing**: Test on mobile Safari and Chrome mobile
- **Audio Context Setup**: Initialize Web Audio API successfully

#### Success Criteria:
- [ ] Microphone permission granted on all target browsers
- [ ] Real-time audio level visualization (simple bar or number)
- [ ] Can detect difference between silence and sound (clapping, speaking)
- [ ] No console errors or crashes during 5-minute test
- [ ] Works on both desktop and mobile browsers

#### Deliverable:
Simple React component with Next.js:
```jsx
// pages/audio-test.js
import { useState, useEffect, useRef } from 'react';

export default function AudioTest() {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Click start to test microphone');
  
  return (
    <div className="audio-test">
      <h1 className="audio-test__title">BeatTime - Audio Test</h1>
      <button className="audio-test__button">
        {isRecording ? 'Stop Test' : 'Start Audio Test'}
      </button>
      <div className="audio-test__level">Audio Level: {audioLevel}%</div>
      <div className="audio-test__status">{status}</div>
    </div>
  );
}
```

#### Technical Implementation:
- Use React hooks (`useState`, `useEffect`, `useRef`) for state management
- `navigator.mediaDevices.getUserMedia()` for microphone access
- Set up `AudioContext` and `AnalyserNode` for level detection
- Calculate RMS (Root Mean Square) for accurate level reading
- Update state at 30-60 FPS with `requestAnimationFrame`
- Handle permission denied and cleanup on component unmount

#### Testing Protocol:
1. **Silent Test**: Verify 0-5% levels in quiet room
2. **Clap Test**: Hand claps should spike to 80-100%
3. **Speech Test**: Normal speaking should show 20-60%
4. **Sustained Test**: 5 minutes without crashes or memory leaks
5. **Mobile Test**: Same tests on mobile devices

**⚠️ Blocker Decision Point**: If audio doesn't work reliably across browsers, consider alternative approaches or platform changes before proceeding to Phase 1.

### Phase 1: Core MVP Development (Weeks 1-6)
- Week 1: **Phase 0.1 Audio Test (Days 1-3)** + Next.js setup, Web Audio API foundation
- Week 2: Cross-browser testing and audio engine optimization
- Week 3-4: Metronome and timing detection implementation
- Week 5-6: Basic UI, PWA setup, user accounts, Supabase integration

### Phase 2: Gamification (Weeks 7-10)  
- Week 7-8: Achievement system, level progression, local storage optimization
- Week 9-10: Daily challenges, advanced scoring, push notifications

### Phase 3: Social Features (Weeks 11-14)
- Week 11-12: Friend system, leaderboards, real-time updates
- Week 13-14: Battle mode with WebRTC, social sharing APIs

### Phase 4: Advanced Features (Weeks 15-18)
- Week 15-16: Progressive training modes, advanced audio processing
- Week 17-18: Educational content, SEO optimization, launch preparation

### Post-Launch Evolution (Months 4-12)
- Advanced rhythm patterns and time signatures
- Instrument-specific training modes with visual guides
- Educational partnerships and classroom dashboard features
- AI-powered practice recommendations based on user data
- Integration with music streaming services via Web APIs
- Multi-language support for global expansion

## Web-Specific Considerations

### SEO Strategy
- **Target Keywords**: "online metronome", "rhythm trainer", "timing practice"
- **Content Strategy**: Blog posts about music practice, timing tips, instrument guides
- **Technical SEO**: Server-side rendering with Next.js, structured data markup
- **Local SEO**: Target music teachers and schools in major cities

### Web Performance Optimization
- **Code Splitting**: Load audio processing modules on-demand
- **Image Optimization**: WebP/AVIF images with fallbacks
- **Caching Strategy**: Service Worker for offline functionality
- **CDN**: Global content delivery for low latency
- **Bundle Analysis**: Regular monitoring of JavaScript bundle size

### Cross-Browser Strategy
- **Progressive Enhancement**: Core features work in all browsers
- **Feature Detection**: Graceful fallbacks for unsupported features
- **Polyfills**: Minimal polyfills for essential Web Audio features
- **Testing Matrix**: Automated testing on BrowserStack

---

**Document Version**: 2.0 (Web App Edition)  
**Last Updated**: [Current Date]  
**Owner**: Product Team  
**Reviewers**: Engineering, Design, Marketing