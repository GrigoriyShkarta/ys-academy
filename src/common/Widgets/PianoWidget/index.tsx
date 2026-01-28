'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import { usePiano } from '@/providers/PianoContext';
import { useMetronome } from '@/providers/MetronomeContext';
import { useTuner } from '@/providers/TunerContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';

interface Note {
  name: string;
  isBlack: boolean;
  keyboardKey?: string;
}

const NOTES: Note[] = [
  { name: 'C', isBlack: false, keyboardKey: 'a' },
  { name: 'C#', isBlack: true, keyboardKey: 'w' },
  { name: 'D', isBlack: false, keyboardKey: 's' },
  { name: 'D#', isBlack: true, keyboardKey: 'e' },
  { name: 'E', isBlack: false, keyboardKey: 'd' },
  { name: 'F', isBlack: false, keyboardKey: 'f' },
  { name: 'F#', isBlack: true, keyboardKey: 't' },
  { name: 'G', isBlack: false, keyboardKey: 'g' },
  { name: 'G#', isBlack: true, keyboardKey: 'y' },
  { name: 'A', isBlack: false, keyboardKey: 'h' },
  { name: 'A#', isBlack: true, keyboardKey: 'u' },
  { name: 'B', isBlack: false, keyboardKey: 'j' },
];

export default function PianoWidget() {
  const { isWidgetVisible, hideWidget } = usePiano();
  const { isWidgetVisible: isMetronomeVisible } = useMetronome();
  const { isWidgetVisible: isTunerVisible } = useTuner();
  const t = useTranslations('SideBar');

  const [synth, setSynth] = useState<Tone.Sampler | null>(null);
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const [octaveOffset, setOctaveOffset] = useState(0);
  
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const octaveCount = windowWidth < 768 ? 1 : windowWidth < 1024 ? 2 : 2.5;
  const octaves = Array.from({ length: Math.ceil(octaveCount) }, (_, i) => 3 + octaveOffset + i);

  const MIN_OCTAVE = 1;
  const MAX_OCTAVE = 7;

  useEffect(() => {
    if (!isWidgetVisible) return;

    const newSynth = new Tone.Sampler({
      urls: {
        C4: 'C4.mp3',
        'D#4': 'Ds4.mp3',
        'F#4': 'Fs4.mp3',
        A4: 'A4.mp3',
      },
      release: 1,
      baseUrl: 'https://tonejs.github.io/audio/salamander/',
      onload: () => setIsLoaded(true),
    }).toDestination();

    setSynth(newSynth);

    return () => {
      newSynth.dispose();
    };
  }, [isWidgetVisible]);

  const playNote = useCallback(async (fullNote: string) => {
    if (!synth || !isLoaded) return;
    await Tone.start();
    synth.triggerAttack(fullNote);
    setActiveNotes(prev => new Set(prev).add(fullNote));
  }, [synth, isLoaded]);

  const stopNote = useCallback((fullNote: string) => {
    if (!synth) return;
    synth.triggerRelease(fullNote);
    setActiveNotes(prev => {
      const newSet = new Set(prev);
      newSet.delete(fullNote);
      return newSet;
    });
  }, [synth]);

  const shiftOctavesUp = useCallback(() => {
    setOctaveOffset(prev => Math.min(prev + 1, MAX_OCTAVE - (3 + Math.ceil(octaveCount) - 1)));
  }, [octaveCount]);

  const shiftOctavesDown = useCallback(() => {
    setOctaveOffset(prev => Math.max(prev - 1, MIN_OCTAVE - 3));
  }, []);

  const canShiftUp = octaves[octaves.length - 1] < MAX_OCTAVE;
  const canShiftDown = octaves[0] > MIN_OCTAVE;

  const getBottomOffset = () => {
    return 0; // Piano is always at the bottom
  };

  if (!isWidgetVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 200, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 right-0 z-[40] bg-card/95 backdrop-blur-md border-t border-border shadow-lg"
        style={{ bottom: '0px' }}
      >
        <div className="container mx-auto px-4 pt-2 pb-0">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium hidden sm:block">{t('piano')}</span>
              <div className="flex items-center gap-1 bg-muted rounded-full px-2 py-0.5">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={shiftOctavesDown} disabled={!canShiftDown}>
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <span className="text-[10px] font-bold min-w-[40px] text-center">
                  {octaves[0]}-{octaves[octaves.length - 1]}
                </span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={shiftOctavesUp} disabled={!canShiftUp}>
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <Button variant="ghost" size="icon" onClick={hideWidget} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative h-24 w-full flex border-t border-l border-border rounded-t overflow-hidden shadow-inner">
            {octaves.map((octave, octaveIndex) => {
              const whiteKeys = NOTES.filter(n => !n.isBlack);
              const totalWhiteKeys = whiteKeys.length * octaves.length;
              const keyWidth = 100 / totalWhiteKeys;

              return whiteKeys.map((note) => {
                const fullNote = `${note.name}${octave}`;
                const isActive = activeNotes.has(fullNote);
                return (
                  <button
                    key={`white-${fullNote}`}
                    className={cn(
                      "h-full border-r border-border transition-colors duration-75",
                      isActive ? "bg-accent" : "bg-white dark:bg-zinc-900"
                    )}
                    style={{ width: `${keyWidth}%` }}
                    onMouseDown={() => playNote(fullNote)}
                    onMouseUp={() => stopNote(fullNote)}
                    onMouseLeave={() => stopNote(fullNote)}
                    onTouchStart={(e) => { e.preventDefault(); playNote(fullNote); }}
                    onTouchEnd={(e) => { e.preventDefault(); stopNote(fullNote); }}
                  />
                );
              });
            })}

            {octaves.map((octave, octaveIndex) => {
              const whiteKeys = NOTES.filter(n => !n.isBlack);
              const totalWhiteKeys = whiteKeys.length * octaves.length;
              const whiteKeyWidth = 100 / totalWhiteKeys;
              const blackKeyWidth = whiteKeyWidth * 0.7;

              return NOTES.map((note, noteIndex) => {
                if (!note.isBlack) return null;
                const fullNote = `${note.name}${octave}`;
                const isActive = activeNotes.has(fullNote);
                const prevWhiteKeys = NOTES.slice(0, noteIndex).filter(n => !n.isBlack).length;
                const leftPosition = ((octaveIndex * whiteKeys.length + prevWhiteKeys) * whiteKeyWidth) - (blackKeyWidth / 2);

                return (
                  <button
                    key={`black-${fullNote}`}
                    className={cn(
                      "absolute h-14 z-20 rounded-b transition-colors duration-75 shadow-md",
                      isActive ? "bg-blue-500" : "bg-zinc-950 border-x border-b border-white/10"
                    )}
                    style={{ left: `${leftPosition}%`, width: `${blackKeyWidth}%` }}
                    onMouseDown={() => playNote(fullNote)}
                    onMouseUp={() => stopNote(fullNote)}
                    onMouseLeave={() => stopNote(fullNote)}
                    onTouchStart={(e) => { e.preventDefault(); playNote(fullNote); }}
                    onTouchEnd={(e) => { e.preventDefault(); stopNote(fullNote); }}
                  />
                );
              });
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
