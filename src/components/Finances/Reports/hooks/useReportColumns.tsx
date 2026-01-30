import Image from 'next/image';
import { Package, Calendar, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StudentRevenue, ForecastStudent } from '../types';

interface UseReportColumnsProps {
  st: any;
  materialsT: any;
  commonT: any;
  rfT: any;
  setHiddenForecastIds: (fn: (prev: string[]) => string[]) => void;
}

export function useReportColumns({
  st,
  materialsT,
  commonT,
  rfT,
  setHiddenForecastIds
}: UseReportColumnsProps) {
  const columnsTopStudents = [
    { 
      key: 'name', 
      label: st('name') || 'Name', 
      render: (s: StudentRevenue) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-inner">
            {s.photo ? <Image src={s.photo} alt={s.name} width={40} height={40} className='rounded-full'/> : s.name.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold">{s.name}</span>
          </div>
        </div>
      )
    },
    { 
      key: 'subscriptionsCount', 
      label: st('subscriptions') || 'Subscriptions',
      render: (s: StudentRevenue) => (
        <div className="flex items-center gap-2 text-sm">
          <Package className="w-4 h-4 text-muted-foreground" />
          <span>{s.subscriptionsCount} {materialsT('subscription').toLowerCase()}</span>
        </div>
      )
    },
    { 
      key: 'revenue', 
      label: st('amount') || 'Amount', 
      render: (s: StudentRevenue) => (
        <div className="flex flex-col items-end">
          <span className={cn(
            "font-bold",
            s.isPartial ? "text-orange-700 dark:text-orange-500" : "text-emerald-600 dark:text-emerald-400"
          )}>
            {s.revenue.toLocaleString()} ₴
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{commonT('total') || 'Total'}</span>
        </div>
      )
    },
  ];

  const columnsForecast = [
    {
      key: 'actions',
      label: '',
      render: (s: ForecastStudent) => (
        <button 
          onClick={() => setHiddenForecastIds(prev => [...prev, s.id])}
          className="p-2 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded-lg transition-colors group/hide"
          title="Приховати з прогнозу"
        >
          <Filter className="w-4 h-4 group-hover/hide:scale-110 transition-transform" />
        </button>
      )
    },
    { 
      key: 'name', 
      label: st('name') || 'Name', 
      render: (s: ForecastStudent) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-inner">
            {s.photo ? <Image src={s.photo} alt={s.name} width={40} height={40} className='rounded-full'/> : s.name.charAt(0)}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{s.name}</span>
              <span className={cn(
                "text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider border",
                s.type === 'extra' 
                  ? "bg-orange-500/10 text-orange-600 border-orange-500/20" 
                  : "bg-amber-500/10 text-amber-600 border-amber-500/20"
              )}>
                {s.type === 'extra' ? rfT('extra_payment') : rfT('renewal')}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">{s.subscriptionTitle}</span>
          </div>
        </div>
      )
    },
    { 
      key: 'lastLessonDate', 
      label: rfT('payment_date') || 'Дата оплати',
      render: (s: ForecastStudent) => (
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>{new Date(s.paymentDate || s.lastLessonDate).toLocaleDateString()}</span>
        </div>
      )
    },
    { 
      key: 'expectedAmount', 
      label: rfT('expected_sum') || 'Expected Sum', 
      render: (s: ForecastStudent) => (
        <div className="flex flex-col items-end">
          <span className="font-bold text-amber-600 dark:text-amber-400">
            {s.expectedAmount.toLocaleString()} ₴
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {s.type === 'extra' ? rfT('extra_payment') : rfT('renewal')}
          </span>
        </div>
      )
    },
  ];

  return {
    columnsTopStudents,
    columnsForecast
  };
}
