'use client';

import { useMetronome } from '@/providers/MetronomeContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Minus, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';

export default function MetronomeWidget() {
  const { isPlaying, bpm, isBeat, isWidgetVisible, togglePlay, setBpm, changeBpm, hideWidget } = useMetronome();
  const t = useTranslations('SideBar');

  if (!isWidgetVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-lg"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Title and Beat Indicator */}
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-3 h-3 rounded-full transition-colors duration-100 shrink-0",
                isBeat ? "bg-accent shadow-[0_0_10px_theme(colors.accent.DEFAULT)]" : "bg-muted"
              )} />
              <span className="text-sm font-medium hidden sm:block">{t('metronome')}</span>
            </div>

            {/* Center: Controls */}
            <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-md">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => changeBpm(-1)}
                className="h-8 w-8 shrink-0 hidden sm:flex"
              >
                <Minus className="h-3 w-3" />
              </Button>

              <div className="flex items-center gap-2 flex-1">
                <span className="text-lg sm:text-2xl font-bold text-accent tabular-nums min-w-[3ch] sm:min-w-[4ch]">
                  {bpm}
                </span>
                <Slider
                  value={[bpm]}
                  onValueChange={(value) => setBpm(value[0])}
                  min={40}
                  max={240}
                  step={1}
                  className="flex-1 cursor-pointer"
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => changeBpm(1)}
                className="h-8 w-8 shrink-0 hidden sm:flex"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Right: Play/Pause and Close */}
            <div className="flex items-center gap-2">
              <Button
                onClick={togglePlay}
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-full transition-all duration-300",
                  isPlaying ? "bg-destructive hover:bg-destructive/90" : "bg-accent hover:bg-accent/90"
                )}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={hideWidget}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}