import { TrendingUp, Calendar, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MONTHS_UA } from '../types';

interface ReportHeaderProps {
  rfT: any;
  startMonth: string;
  setStartMonth: (v: string) => void;
  startYear: string;
  setStartYear: (v: string) => void;
  endMonth: string;
  setEndMonth: (v: string) => void;
  endYear: string;
  setEndYear: (v: string) => void;
  currentYear: number;
}

export function ReportHeader({
  rfT,
  startMonth,
  setStartMonth,
  startYear,
  setStartYear,
  endMonth,
  setEndMonth,
  endYear,
  setEndYear,
  currentYear
}: ReportHeaderProps) {
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-card/40 backdrop-blur-2xl p-6 rounded-[2rem] border border-border/50 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
      
      <div className="space-y-1 relative z-10">
        <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-4">
          <div className="p-2 rounded-2xl bg-primary/10 border border-primary/20">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
          {rfT('title')}
        </h1>
        <p className="text-muted-foreground text-sm pl-16">
          {rfT('description')}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-background/20 p-2.5 rounded-2xl border border-white/5 relative z-10">
        <div className="flex items-center gap-2.5 px-3 py-1 bg-white/5 rounded-xl border border-white/5">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{rfT('range')}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={startMonth} onValueChange={setStartMonth}>
            <SelectTrigger className="w-[110px] h-9 bg-card/60 border-none shadow-sm font-medium">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS_UA.map((m, i) => (
                <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={startYear} onValueChange={setStartYear}>
            <SelectTrigger className="w-[90px] h-9 bg-card/60 border-none shadow-sm font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-6 flex justify-center">
          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
        </div>

        <div className="flex items-center gap-2">
           <Select value={endMonth} onValueChange={setEndMonth}>
            <SelectTrigger className="w-[110px] h-9 bg-card/60 border-none shadow-sm font-medium">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS_UA.map((m, i) => (
                <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={endYear} onValueChange={setEndYear}>
            <SelectTrigger className="w-[90px] h-9 bg-card/60 border-none shadow-sm font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
