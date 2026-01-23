import { cn } from '@/lib/utils';
import { CreditCard, TrendingUp } from 'lucide-react';

interface ViewModeToggleProps {
  viewMode: 'fact' | 'forecast';
  setViewMode: (v: 'fact' | 'forecast') => void;
  rfT: any;
}

export function ViewModeToggle({ viewMode, setViewMode, rfT }: ViewModeToggleProps) {
  return (
    <div className="flex justify-center mb-6">
      <div className="flex p-1 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 gap-1 shadow-lg">
        <button 
          onClick={() => setViewMode('fact')}
          className={cn(
            "px-6 py-2  rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2",
            viewMode === 'fact' ? "bg-accent text-white shadow-lg scale-105" : "hover:bg-white/10 text-muted-foreground"
          )}
        >
          <CreditCard className="w-4 h-4" />
          {rfT('fact') || 'Реальні оплати'}
        </button>
        <button 
          onClick={() => setViewMode('forecast')}
          className={cn(
            "px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2",
            viewMode === 'forecast' ? "bg-amber-500 text-white shadow-lg scale-105" : "hover:bg-white/10 text-muted-foreground"
          )}
        >
          <TrendingUp className="w-4 h-4" />
          {rfT('forecast_short') || 'Прогноз'}
        </button>
      </div>
    </div>
  );
}
