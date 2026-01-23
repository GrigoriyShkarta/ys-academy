import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowUpRight, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface KPICardProps {
  title: string;
  value: string;
  trend: string;
  icon: ReactNode;
  color: 'primary' | 'blue' | 'amber' | 'emerald';
  delay: number;
  isCustomTrend?: boolean;
}

export function KPICard({ title, value, trend, icon, color, delay, isCustomTrend }: KPICardProps) {
  const isUp = trend?.startsWith('+');
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        type: 'spring',
        stiffness: 100,
        damping: 15,
        delay 
      }}
    >
      <Card className="relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border-none bg-card/40 backdrop-blur-xl shadow-2xl rounded-3xl">
        <div className={cn(
          "absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-150 transition-all duration-700 blur-2xl",
          color === 'primary' && 'bg-primary',
          color === 'blue' && 'bg-blue-500',
          color === 'amber' && 'bg-amber-500',
          color === 'emerald' && 'bg-emerald-500',
        )} />
        
        <CardHeader className="flex flex-row items-center justify-between pb-3 px-6 pt-6">
          <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{title}</CardTitle>
          <div className={cn(
            "p-3 rounded-2xl border border-white/5 shadow-inner transition-transform group-hover:rotate-12",
            color === 'primary' && 'bg-primary/10 text-primary',
            color === 'blue' && 'bg-blue-500/10 text-blue-500',
            color === 'amber' && 'bg-amber-500/10 text-amber-500',
            color === 'emerald' && 'bg-emerald-500/10 text-emerald-500',
          )}>
            {icon}
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="text-3xl font-black tracking-tight mb-2 flex items-baseline gap-1">
            {value}
          </div>
          <p className={cn(
            "text-[11px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-full w-fit border",
            isCustomTrend ? 'bg-secondary/50 text-muted-foreground border-white/5' : 
            isUp ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10' : 'bg-rose-500/10 text-rose-500 border-rose-500/10'
          )}>
            {!isCustomTrend && (isUp ? <ArrowUpRight className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />)}
            {trend}
            {!isCustomTrend && <span className="opacity-60 font-medium ml-0.5">vs period</span>}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
