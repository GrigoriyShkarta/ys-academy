'use client';

import { useState } from 'react';
import { useMetronome } from '@/providers/MetronomeContext';
import { useTuner } from '@/providers/TunerContext';
import { usePiano } from '@/providers/PianoContext';
import { Button } from '@/components/ui/button';
import { Timer, Music, Piano, Component } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface WidgetHubProps {
  className?: string;
  isShiftedByReminder?: boolean;
}

export default function WidgetHub({ className, isShiftedByReminder }: WidgetHubProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isWidgetVisible: isMetronomeVisible, showWidget: showMetronome, hideWidget: hideMetronome } = useMetronome();
  const { isWidgetVisible: isTunerVisible, showWidget: showTuner, hideWidget: hideTuner } = useTuner();
  const { isWidgetVisible: isPianoVisible, showWidget: showPiano, hideWidget: hidePiano } = usePiano();
  const t = useTranslations('SideBar');

  const widgetsHeight = 
    (isTunerVisible ? 60 : 0) + 
    (isMetronomeVisible ? 64 : 0) + 
    (isPianoVisible ? 144 : 0);
  const reminderShift = isShiftedByReminder ? 144 : 0;
  
  // Base offset to stay above the "Contact Teacher" button
  // 24 (base) + 72 (button height) + 16 (gap) = 112
  const totalBottom = 112 + reminderShift + widgetsHeight;

  const widgets = [
    {
      id: 'metronome',
      icon: <Timer className="w-5 h-5" />,
      label: t('metronome'),
      active: isMetronomeVisible,
      onClick: () => {
        if (!isMetronomeVisible) {
          showMetronome();
        } else {
          hideMetronome();
        }
      },
      color: 'bg-orange-500 hover:bg-orange-600',
    },
    {
      id: 'tuner',
      icon: <Music className="w-5 h-5" />,
      label: t('tuner'),
      active: isTunerVisible,
      onClick: () => {
        if (!isTunerVisible) {
          showTuner();
        } else {
          hideTuner();
        }
      },
      color: 'bg-emerald-500 hover:bg-emerald-600',
    },
    {
      id: 'piano',
      icon: <Piano className="w-5 h-5" />,
      label: t('piano'),
      active: isPianoVisible,
      onClick: () => {
        if (!isPianoVisible) {
          showPiano();
        } else {
          hidePiano();
        }
      },
      color: 'bg-blue-500 hover:bg-blue-600',
    },
  ];

  return (
    <div
      className={cn(
        "fixed hidden md:flex right-6 z-[100] items-center transition-all duration-300",
        className
      )}
      style={{ bottom: `${totalBottom}px` }}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className="flex items-center gap-2">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.8 }}
              className="flex items-center gap-2"
            >
              {widgets.map((widget) => (
                <Button
                  key={widget.id}
                  variant="default"
                  size="icon"
                  onClick={widget.onClick}
                  className={cn(
                    "w-12 h-12 rounded-full shadow-lg transition-all duration-300 hover:scale-110 text-white border-none",
                    widget.color,
                    widget.active && "ring-2 ring-white ring-offset-2"
                  )}
                  title={widget.label}
                >
                  {widget.icon}
                </Button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-14 h-14 sm:w-18 sm:h-18 rounded-full shadow-xl transition-all duration-300 z-10",
            isOpen 
              ? "bg-slate-700 rotate-90 scale-105" 
              : "bg-slate-900 hover:bg-slate-800 hover:scale-105"
          )}
        >
          <Component className="w-7 h-7 text-white" />
        </Button>
      </div>
    </div>
  );
}
