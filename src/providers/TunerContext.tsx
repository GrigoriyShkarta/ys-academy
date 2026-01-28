'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { PitchDetector } from 'pitchy';

const NOTE_STRINGS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

interface TunerContextType {
  isListening: boolean;
  note: string;
  frequency: number;
  cents: number;
  tolerance: number;
  isWidgetVisible: boolean;
  analyserRef: React.RefObject<AnalyserNode | null>;
  startListening: () => Promise<void>;
  stopListening: () => void;
  setTolerance: (tolerance: number) => void;
  showWidget: () => void;
  hideWidget: () => void;
}

const TunerContext = createContext<TunerContextType | undefined>(undefined);

export function TunerProvider({ children }: { children: ReactNode }) {
  const [isListening, setIsListening] = useState(false);
  const [note, setNote] = useState<string>('');
  const [frequency, setFrequency] = useState<number>(0);
  const [cents, setCents] = useState<number>(0);
  const [tolerance, setTolerance] = useState<number>(25);
  const [isWidgetVisible, setIsWidgetVisible] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const detectorRef = useRef<PitchDetector<Float32Array> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafIdRef = useRef<number | null>(null);
  
  // For filtering metronome clicks and requiring stable notes
  const lastMetronomeBeatRef = useRef<number>(0);
  const stableNoteRef = useRef<{ note: string; freq: number; cents: number; startTime: number } | null>(null);

  const frequencyToNote = (freq: number) => {
    const noteNum = 12 * (Math.log(freq / 440) / Math.log(2));
    const noteIndex = Math.round(noteNum) + 69;
    const noteName = NOTE_STRINGS[noteIndex % 12];
    const octave = Math.floor(noteIndex / 12) - 1;
    return `${noteName}${octave}`;
  };

  const getCents = (freq: number) => {
    const noteNum = 12 * (Math.log(freq / 440) / Math.log(2));
    const roundedNote = Math.round(noteNum);
    return Math.floor((noteNum - roundedNote) * 100);
  };

  const updatePitch = () => {
    const analyser = analyserRef.current;
    const detector = detectorRef.current;

    if (!analyser || !detector) return;

    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);

    const [pitch, clarity] = detector.findPitch(buffer, audioContextRef.current!.sampleRate);

    const now = Date.now();
    
    // Ignore detection for 100ms after metronome beat
    const timeSinceMetronomeBeat = now - lastMetronomeBeatRef.current;
    const shouldIgnoreMetronome = timeSinceMetronomeBeat < 100;

    if (clarity > 0.9 && pitch > 0 && !shouldIgnoreMetronome) {
      const detectedNote = frequencyToNote(pitch);
      const detectedCents = getCents(pitch);
      
      // Check if this is the same note as before (within 10 cents tolerance)
      const isSameNote = 
        stableNoteRef.current &&
        stableNoteRef.current.note === detectedNote &&
        Math.abs(stableNoteRef.current.cents - detectedCents) < 10;

      if (isSameNote) {
        // Note is stable, check if it's been stable long enough (150ms)
        const stableDuration = now - stableNoteRef.current!.startTime;
        if (stableDuration >= 150) {
          // Update display with stable note
          setFrequency(Math.round(pitch * 10) / 10);
          setNote(detectedNote);
          setCents(detectedCents);
        }
      } else {
        // New note detected, start tracking it
        stableNoteRef.current = {
          note: detectedNote,
          freq: pitch,
          cents: detectedCents,
          startTime: now,
        };
      }
    } else if (!shouldIgnoreMetronome) {
      // No clear pitch detected, reset stable note tracking
      stableNoteRef.current = null;
    }

    rafIdRef.current = requestAnimationFrame(updatePitch);
  };

  // Listen to metronome beats to filter them out
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleMetronomeBeat = () => {
        lastMetronomeBeatRef.current = Date.now();
      };

      window.addEventListener('metronome-beat', handleMetronomeBeat);
      return () => {
        window.removeEventListener('metronome-beat', handleMetronomeBeat);
      };
    }
  }, []);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      detectorRef.current = PitchDetector.forFloat32Array(analyser.fftSize);

      setIsListening(true);
      setIsWidgetVisible(true);
      stableNoteRef.current = null;
      updatePitch();
    } catch (error) {
      console.error('Microphone access denied:', error);
    }
  };

  const stopListening = () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    setIsListening(false);
    setNote('');
    setFrequency(0);
    setCents(0);
    stableNoteRef.current = null;
  };

  const hideWidget = () => {
    stopListening();
    setIsWidgetVisible(false);
  };

  const showWidget = () => {
    setIsWidgetVisible(true);
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  return (
    <TunerContext.Provider
      value={{
        isListening,
        note,
        frequency,
        cents,
        tolerance,
        isWidgetVisible,
        analyserRef,
        startListening,
        stopListening,
        setTolerance,
        showWidget,
        hideWidget,
      }}
    >
      {children}
    </TunerContext.Provider>
  );
}

export function useTuner() {
  const context = useContext(TunerContext);
  if (context === undefined) {
    throw new Error('useTuner must be used within a TunerProvider');
  }
  return context;
}
