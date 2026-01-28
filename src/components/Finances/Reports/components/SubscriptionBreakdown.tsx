import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SubscriptionStats } from '../types';

interface SubscriptionBreakdownProps {
  stats: SubscriptionStats[];
  totalRevenue: number;
  rfT: any;
}

export function SubscriptionBreakdown({ stats, totalRevenue, rfT }: SubscriptionBreakdownProps) {
  return (
    <Card className="border-none shadow-2xl bg-card/40 backdrop-blur-xl overflow-hidden rounded-[2.5rem] h-fit">
      <CardHeader className="border-b border-white/5 bg-white/5 px-8 py-6">
        <CardTitle className="text-2xl font-bold tracking-tight">{rfT('income_per_subscription')}</CardTitle>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {stats.length > 0 ? (
          stats.map((sub, i) => (
            <motion.div 
              key={sub.id} 
              className="space-y-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <div className="flex justify-between items-end">
                <div className="space-y-0.5">
                  <span className="font-bold text-sm lg:text-base">{sub.title}</span>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full w-fit">
                    <Package className="w-3 h-3" />
                    <span>{sub.count} {rfT('units_sold')}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-emerald-500">{sub.revenue.toLocaleString()} ₴</span>
                  <span className="text-[10px] block text-muted-foreground/60 font-bold uppercase tracking-tighter">
                    {totalRevenue ? Math.round((sub.revenue / totalRevenue) * 100) : 0}% {rfT('of_mix')}
                  </span>
                </div>
              </div>
              <div className="h-3 w-full bg-secondary/30 rounded-full overflow-hidden p-[2px]">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${totalRevenue ? (sub.revenue / totalRevenue) * 100 : 0}%` }}
                  transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1], delay: 0.6 + i * 0.1 }}
                  className={cn(
                    "h-full rounded-full relative",
                    sub.color === 'emerald' && 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
                    sub.color === 'blue' && 'bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]',
                    sub.color === 'amber' && 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
                    sub.color === 'rose' && 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]',
                    sub.color === 'indigo' && 'bg-gradient-to-r from-indigo-600 to-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.3)]',
                    sub.color === 'orange' && 'bg-gradient-to-r from-orange-600 to-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]',
                    sub.color === 'cyan' && 'bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
                  )}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                </motion.div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground italic">
            <Package className="w-12 h-12 mb-4 opacity-20" />
            {rfT('no_sales')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
