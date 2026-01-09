'use client';

import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useTuner } from '@/providers/TunerContext';

export default function TunerLayout() {
  const t = useTranslations('SideBar');
  const tCommon = useTranslations('Common');
  const { isListening, note, frequency, cents, tolerance, startListening, stopListening, setTolerance } = useTuner();

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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4 w-full mt-18 sm:mt-0">
      <div className="flex flex-col w-full max-w-md bg-card border border-border rounded-xl shadow-xl overflow-hidden p-8 space-y-8">
        <h2 className="text-2xl text-center font-bold text-foreground">{t('tuner')}</h2>

        {/* Tolerance Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-muted-foreground">{tCommon('tolerance')}</label>
            <span className="text-sm font-bold text-accent">
              ±{tolerance} {tCommon('cents')}
            </span>
          </div>
          <Slider
            value={[tolerance]}
            onValueChange={(value) => setTolerance(value[0])}
            min={1}
            max={50}
            step={1}
            className="cursor-pointer"
          />
        </div>

        <Button
          onClick={isListening ? stopListening : startListening}
          size="lg"
          variant={isListening ? 'destructive' : 'default'}
          className={cn('mx-auto', !isListening && 'bg-accent hover:bg-accent/90')}
        >
          {isListening ? <MicOff className="mr-2" /> : <Mic className="mr-2" />}
          {isListening ? tCommon('stop') : tCommon('start')}
        </Button>

        {isListening && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-6xl font-bold text-primary">{note || '—'}</div>

            <div className="text-2xl text-muted-foreground">{frequency > 0 ? `${frequency} Hz` : '—'}</div>

            {/* Deviation Indicator */}
            <div className="w-full max-w-md">
              <div className="relative h-12 bg-muted rounded-full overflow-hidden">
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
                {cents !== 0 && (
                  <div
                    className={cn(
                      'absolute top-0 h-full w-2 transition-all',
                      Math.abs(cents) <= tolerance ? 'bg-green-500' : 'bg-red-500'
                    )}
                    style={{
                      left: `calc(50% + ${Math.max(-100, Math.min(100, cents)) / 2}%)`,
                      transform: 'translateX(-50%)',
                    }}
                  />
                )}
              </div>

              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>-100¢</span>
                <span className="font-bold text-foreground">{cents > 0 ? `+${cents}` : cents}¢</span>
                <span>+100¢</span>
              </div>
            </div>

            {/* Tuning Status */}
            {/* <div className={cn('text-xl font-semibold', status.color)}>{status.text}</div> */}
          </div>
        )}
      </div>
    </div>
  );
}