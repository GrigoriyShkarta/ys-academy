'use client';

import { Play, Pause, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useMetronome } from '@/providers/MetronomeContext';

export default function MetronomeLayout() {
  const t = useTranslations('SideBar');
  const { isPlaying, bpm, isBeat, togglePlay, setBpm, changeBpm } = useMetronome();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4 w-full mt-18 sm:mt-0">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl overflow-hidden p-8 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">{t('metronome')}</h2>
          <div className={cn(
            "w-4 h-4 rounded-full transition-colors duration-100",
            isBeat ? "bg-primary shadow-[0_0_10px_theme(colors.primary.DEFAULT)]" : "bg-muted"
          )} />
        </div>

        <div className="flex flex-col items-center space-y-2">
          <span className="text-6xl font-black text-primary tabular-nums tracking-tighter">
            {bpm}
          </span>
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            BPM
          </span>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => changeBpm(-1)}
              className="h-10 w-10 shrink-0 rounded-full"
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <Slider
              value={[bpm]}
              onValueChange={(value) => setBpm(value[0])}
              min={40}
              max={240}
              step={1}
              className="flex-1 cursor-pointer"
            />
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => changeBpm(1)}
              className="h-10 w-10 shrink-0 rounded-full"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex justify-center pt-4">
            <Button
              onClick={togglePlay}
              size="lg"
              className={cn(
                "h-16 w-16 rounded-full bg-accent! transition-all duration-300 shadow-lg hover:scale-105",
                isPlaying ? "bg-destructive! hover:bg-destructive/90 text-destructive-foreground" : "bg-primary hover:bg-primary/90 text-primary-foreground"
              )}
            >
              {isPlaying ? (
                <Pause className="h-8 w-8 fill-current" />
              ) : (
                <Play className="h-8 w-8 fill-current ml-1" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}