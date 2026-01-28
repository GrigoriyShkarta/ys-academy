'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import * as Tone from 'tone';

interface MetronomeContextType {
  isPlaying: boolean;
  bpm: number;
  isBeat: boolean;
  isWidgetVisible: boolean;
  togglePlay: () => Promise<void>;
  setBpm: (bpm: number) => void;
  changeBpm: (delta: number) => void;
  showWidget: () => void;
  hideWidget: () => void;
}

const MetronomeContext = createContext<MetronomeContextType | undefined>(undefined);

export function MetronomeProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [isBeat, setIsBeat] = useState(false);
  const [isWidgetVisible, setIsWidgetVisible] = useState(false);
  const synthRef = useRef<Tone.Synth | null>(null);
  const loopRef = useRef<Tone.Loop | null>(null);

  useEffect(() => {
    const synth = new Tone.Synth().toDestination();
    synthRef.current = synth;

    return () => {
      synth.dispose();
      if (loopRef.current) {
        loopRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  useEffect(() => {
    if (isPlaying) {
      const loop = new Tone.Loop((time) => {
        synthRef.current?.triggerAttackRelease('C5', '32n', time);
        
        Tone.Draw.schedule(() => {
          setIsBeat(true);
          // Notify tuner about metronome beat
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('metronome-beat'));
          }
        }, time);
        
        Tone.Draw.schedule(() => {
          setIsBeat(false);
        }, time + 0.1);
      }, '4n').start(0);
      
      loopRef.current = loop;
      Tone.Transport.start();
    } else {
      Tone.Transport.stop();
      if (loopRef.current) {
        loopRef.current.stop();
        loopRef.current.dispose();
        loopRef.current = null;
      }
      setIsBeat(false);
    }
    
    return () => {
      if (loopRef.current) {
        loopRef.current.stop();
        loopRef.current.dispose();
      }
      Tone.Transport.stop();
    };
  }, [isPlaying]);

  const togglePlay = async () => {
    if (!isPlaying) {
      await Tone.start();
      setIsWidgetVisible(true);
    }
    setIsPlaying(!isPlaying);
  };

  const changeBpm = (delta: number) => {
    setBpm((prev) => Math.max(40, Math.min(240, prev + delta)));
  };

  const hideWidget = () => {
    setIsWidgetVisible(false);
    setIsPlaying(false);
  };

  const showWidget = () => {
    setIsWidgetVisible(true);
  };

  return (
    <MetronomeContext.Provider value={{ isPlaying, bpm, isBeat, isWidgetVisible, togglePlay, setBpm, changeBpm, showWidget, hideWidget }}>
      {children}
    </MetronomeContext.Provider>
  );
}

export function useMetronome() {
  const context = useContext(MetronomeContext);
  if (context === undefined) {
    throw new Error('useMetronome must be used within a MetronomeProvider');
  }
  return context;
}
