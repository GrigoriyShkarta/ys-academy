'use client';

import { useEffect, useState, useCallback } from 'react';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

// Хук для определения размера экрана
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
      });
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

export default function PianoLayout() {
  const [synth, setSynth] = useState<Tone.Sampler | null>(null);
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const [octaveOffset, setOctaveOffset] = useState(0); // Смещение октав (0 = октавы 3,4,5)
  const { width } = useWindowSize();

  // Определяем количество октав в зависимости от размера экрана
  const octaveCount = width < 768 ? 1 : width < 1024 ? 2 : 3;
  
  // Генерируем массив октав на основе смещения
  const octaves = Array.from({ length: octaveCount }, (_, i) => 3 + octaveOffset + i);

  // Минимальная и максимальная октава
  const MIN_OCTAVE = 1;
  const MAX_OCTAVE = 7;

  useEffect(() => {
    // Создаем сэмплер с реалистичными звуками пианино
    const newSynth = new Tone.Sampler({
      urls: {
        C4: 'C4.mp3',
        'D#4': 'Ds4.mp3',
        'F#4': 'Fs4.mp3',
        A4: 'A4.mp3',
      },
      release: 1,
      baseUrl: 'https://tonejs.github.io/audio/salamander/',
      onload: () => {
        setIsLoaded(true);
      },
    }).toDestination();

    setSynth(newSynth);

    return () => {
      newSynth.dispose();
    };
  }, []);

  const playNote = useCallback(async (fullNote: string) => {
    if (!synth || !isLoaded) return;
    
    await Tone.start();
    synth.triggerAttack(fullNote);
    setActiveNotes(prev => new Set(prev).add(fullNote));
  }, [synth, isLoaded]);

  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX - touchEndX;
    const threshold = 50; // Минимальное расстояние для свайпа

    if (Math.abs(diffX) > threshold) {
      if (diffX > 0 && canShiftUp) {
        shiftOctavesUp();
      } else if (diffX < 0 && canShiftDown) {
        shiftOctavesDown();
      }
    }
    
    setTouchStartX(null);
  };

  const stopNote = useCallback((fullNote: string) => {
    if (!synth) return;
    
    synth.triggerRelease(fullNote);
    setActiveNotes(prev => {
      const newSet = new Set(prev);
      newSet.delete(fullNote);
      return newSet;
    });
  }, [synth]);

  // Функции для изменения октав
  const shiftOctavesUp = useCallback(() => {
    setOctaveOffset(prev => {
      const maxOffset = MAX_OCTAVE - (3 + octaveCount - 1);
      return Math.min(prev + 1, maxOffset);
    });
  }, [octaveCount]);

  const shiftOctavesDown = useCallback(() => {
    setOctaveOffset(prev => {
      const minOffset = MIN_OCTAVE - 3;
      return Math.max(prev - 1, minOffset);
    });
  }, []);

  // Проверяем, можем ли мы сдвигать октавы
  const canShiftUp = octaves[octaves.length - 1] < MAX_OCTAVE;
  const canShiftDown = octaves[0] > MIN_OCTAVE;

  // Клавиатурные shortcuts
  useEffect(() => {
    const keyToNote = new Map(
      NOTES.filter(n => n.keyboardKey).map(n => [n.keyboardKey!, n.name])
    );

    const handleKeyDown = (e: KeyboardEvent) => {
      // Воспроизведение нот (используем первую октаву из диапазона)
      const note = keyToNote.get(e.key.toLowerCase());
      if (note && !e.repeat) {
        e.preventDefault();
        const fullNote = `${note}${octaves[0]}`; // Используем первую октаву
        playNote(fullNote);
        return;
      }

      // Смена октав стрелками
      if (e.key === 'ArrowRight' && canShiftUp) {
        e.preventDefault();
        shiftOctavesUp();
      }
      if (e.key === 'ArrowLeft' && canShiftDown) {
        e.preventDefault();
        shiftOctavesDown();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const note = keyToNote.get(e.key.toLowerCase());
      if (note) {
        const fullNote = `${note}${octaves[0]}`;
        stopNote(fullNote);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [canShiftUp, canShiftDown, shiftOctavesUp, shiftOctavesDown, octaves, playNote, stopNote]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4 w-full mt-18 sm:mt-0">
      <div className="w-full bg-card border border-border rounded-xl shadow-xl overflow-hidden p-6 space-y-6">
        
        <div className="flex flex-col gap-2 items-center">
          
          <div className="flex items-center gap-2">
            <Button
              onClick={shiftOctavesDown}
              disabled={!canShiftDown}
              variant="outline"
              size="sm"
              title="Сдвинуть октавы вниз (↓)"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-sm font-semibold min-w-[80px] text-center">
              {octaves.join('-')}
            </span>
            
            <Button
              onClick={shiftOctavesUp}
              disabled={!canShiftUp}
              variant="outline"
              size="sm"
              title="Сдвинуть октавы вверх (↑)"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <p>Октави</p>

          <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
             ← → для зміни октав
          </div>
        </div>

        {!isLoaded && (
          <div className="text-center text-gray-500">Загрузка...</div>
        )}

        {/* Пианино */}
        <div 
          className="w-full pb-4"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="relative h-64 w-full mx-auto border-t border-l border-r border-border rounded-t-lg overflow-hidden flex shadow-2xl bg-black/5">
            {/* Сначала рендерим все белые клавиши */}
            {octaves.map((octave, octaveIndex) => {
              const whiteKeysInOctave = NOTES.filter(n => !n.isBlack);
              const totalWhiteKeys = whiteKeysInOctave.length * octaves.length;
              const keyWidth = 100 / totalWhiteKeys;

              return whiteKeysInOctave.map((note, noteIndex) => {
                const fullNote = `${note.name}${octave}`;
                const isActive = activeNotes.has(fullNote);
                const globalIndex = octaveIndex * whiteKeysInOctave.length + noteIndex;

                return (
                  <button
                    key={`white-${fullNote}`}
                    disabled={!isLoaded}
                    className={`
                      relative h-64 border-r border-b border-border transition-all duration-75
                      ${isActive
                        ? 'bg-gray-200 dark:bg-gray-700'
                        : 'bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800'
                      }
                      first:rounded-tl-lg last:rounded-tr-lg last:border-r-0
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                    style={{ width: `${keyWidth}%` }}
                    onMouseDown={() => playNote(fullNote)}
                    onMouseUp={() => stopNote(fullNote)}
                    onMouseLeave={() => stopNote(fullNote)}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      playNote(fullNote);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      stopNote(fullNote);
                    }}
                  >
                    <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center pointer-events-none select-none">
                      {octaveIndex === 0 && note.keyboardKey && (
                        <span className="text-[10px] font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1 rounded border border-zinc-200 dark:border-zinc-700 mb-1">
                          {note.keyboardKey.toUpperCase()}
                        </span>
                      )}
                      <span className="text-xs font-bold text-zinc-400 mb-1">{note.name}</span>
                      <span className="text-[10px] text-zinc-500">{octave}</span>
                    </div>
                  </button>
                );
              });
            })}

            {/* Затем рендерим черные клавиши поверх белых */}
            {octaves.map((octave, octaveIndex) => {
              const whiteKeysInOctave = NOTES.filter(n => !n.isBlack);
              const totalWhiteKeys = whiteKeysInOctave.length * octaves.length;
              const whiteKeyWidth = 100 / totalWhiteKeys;
              const blackKeyWidth = whiteKeyWidth * 0.65;

              return NOTES.map((note, noteIndex) => {
                if (!note.isBlack) return null;

                const fullNote = `${note.name}${octave}`;
                const isActive = activeNotes.has(fullNote);
                
                // Находим индекс белой клавиши, после которой идет черная
                const prevWhiteKeys = NOTES.slice(0, noteIndex).filter(n => !n.isBlack).length;
                const globalWhiteIndex = octaveIndex * whiteKeysInOctave.length + prevWhiteKeys;
                
                // Позиция: точно на стыке белых клавиш
                const leftPosition = (globalWhiteIndex * whiteKeyWidth) - (blackKeyWidth / 2);

                return (
                  <button
                    key={`black-${fullNote}`}
                    disabled={!isLoaded}
                    className={`
                      absolute h-40 z-20 rounded-b-md transition-all duration-75 shadow-lg
                      ${isActive 
                        ? 'bg-blue-600 dark:bg-blue-500 scale-[0.98] translate-y-0.5' 
                        : 'bg-zinc-900 dark:bg-black hover:bg-zinc-800 dark:hover:bg-zinc-950 border-x border-b border-white/10'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                    style={{ 
                      left: `${leftPosition}%`,
                      width: `${blackKeyWidth}%`
                    }}
                    onMouseDown={() => playNote(fullNote)}
                    onMouseUp={() => stopNote(fullNote)}
                    onMouseLeave={() => stopNote(fullNote)}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      playNote(fullNote);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      stopNote(fullNote);
                    }}
                  >
                    {octaveIndex === 0 && note.keyboardKey && (
                      <span className="absolute bottom-2 left-0 right-0 text-[10px] font-medium text-white/40 pointer-events-none select-none flex justify-center">
                        {note.keyboardKey.toUpperCase()}
                      </span>
                    )}
                  </button>
                );
              });
            })}
          </div>
        </div>
      </div>
    </div>
  );
}