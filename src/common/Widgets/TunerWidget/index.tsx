'use client';

import { useTuner } from '@/providers/TunerContext';
import { useMetronome } from '@/providers/MetronomeContext';
import { usePiano } from '@/providers/PianoContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { X, Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';

export default function TunerWidget() {
  const { 
    isWidgetVisible, 
    note, 
    frequency, 
    cents, 
    tolerance, 
    isListening,
    startListening,
    stopListening,
    setTolerance, 
    hideWidget 
  } = useTuner();
  const { isWidgetVisible: isMetronomeVisible } = useMetronome();
  const { isWidgetVisible: isPianoVisible } = usePiano();
  const t = useTranslations('SideBar');
  const tCommon = useTranslations('Common');

  if (!isWidgetVisible) return null;

  const getTuningStatus = () => {
    const absCents = Math.abs(cents);
    if (absCents <= tolerance) return { text: tCommon('tuned'), color: 'text-green-500' };
    if (absCents <= tolerance * 3) return { text: tCommon('almost'), color: 'text-yellow-500' };
    return {
      text: cents > 0 ? tCommon('higher') : tCommon('lower'),
      color: 'text-red-500',
    };
  };

  const status = getTuningStatus();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed z-1001 left-0 right-0 z-60 bg-card/95 backdrop-blur-md border-t border-border shadow-lg transition-all duration-300"
        style={{
          bottom: `${(isPianoVisible ? 144 : 0) + (isMetronomeVisible ? 64 : 0)}px`
        }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Title and Note */}
            <div className="flex items-center gap-3 sm:w-[250px]">
              <span className="text-sm font-medium hidden sm:block">{t('tuner')}</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary tabular-nums">
                  {isListening ? (note || '—') : '—'}
                </span>
              </div>
            </div>

            {/* Center: Frequency and Cents */}
            <div className="flex items-center gap-4 flex-1 max-w-md">
              <div className="text-sm text-muted-foreground hidden sm:block">
                {isListening && frequency > 0 ? `${frequency} Hz` : '—'}
              </div>

              {/* Deviation Indicator */}
              <div className="flex-1">
                <div className="relative h-8 bg-muted rounded-full overflow-hidden">
                  {/* Center line */}
                  <div className="absolute left-1/2 top-0 w-0.5 h-full bg-green-500 z-10" />

                  {/* Tolerance zone */}
                  <div
                    className="absolute top-0 h-full bg-green-500/20"
                    style={{
                      left: `calc(50% - ${tolerance / 2}%)`,
                      width: `${tolerance}%`,
                    }}
                  />

                  {/* Indicator */}
                  {isListening && cents !== 0 && (
                    <div
                      className={cn(
                        'absolute top-0 h-full w-1.5 transition-all',
                        Math.abs(cents) <= tolerance ? 'bg-green-500' : 'bg-red-500'
                      )}
                      style={{
                        left: `calc(50% + ${Math.max(-100, Math.min(100, cents)) / 2}%)`,
                        transform: 'translateX(-50%)',
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="text-xs text-center text-muted-foreground mt-1 min-w-[30px]">
                  {isListening ? `${cents > 0 ? `+${cents}` : cents}¢` : '—'}
                </div>
            </div>

            {/* Right: Controls, Tolerance and Close */}
            <div className="flex items-center gap-3">
              <Button
                onClick={isListening ? stopListening : startListening}
                size="sm"
                variant={isListening ? 'destructive' : 'default'}
                className={cn('h-8', !isListening && 'bg-accent hover:bg-accent/90')}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                <span className="ml-2 hidden xs:inline">
                  {isListening ? tCommon('stop') : tCommon('start')}
                </span>
              </Button>

              <div className="hidden md:flex items-center gap-2 min-w-[120px]">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  ±{tolerance}¢
                </span>
                <Slider
                  value={[tolerance]}
                  onValueChange={(value) => setTolerance(value[0])}
                  min={1}
                  max={50}
                  step={1}
                  className="w-20 cursor-pointer"
                />
              </div>

              <Button variant="ghost" size="icon" onClick={hideWidget} className="h-8 w-8 shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}