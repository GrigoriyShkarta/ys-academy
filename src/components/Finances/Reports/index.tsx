'use client';

import Image from 'next/image';
import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  DollarSign, 
  ArrowUpRight,
  Package,
  Calendar,
  ChevronRight,
  Download,
  Filter,
  TrendingDown,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DataTable from '@/common/Table';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { getStudents } from '@/components/Students/actions';
import { getSubscriptions } from '@/components/Finances/Subscriptions/action';
import { Student } from '@/components/Students/interface';
import { Subscription } from '@/components/Materials/utils/interfaces';

// Data types for visualization
interface StudentRevenue {
  photo?: string;
  id: number;
  name: string;
  revenue: number;
  subscriptionsCount: number;
}

interface SubscriptionStats {
  id: number;
  title: string;
  revenue: number;
  count: number;
  color: string;
}

const MONTHS_UA = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
];

const COLORS = ['emerald', 'blue', 'amber', 'rose', 'indigo', 'orange', 'cyan'];

export default function ReportsLayout() {
  const sidebarT = useTranslations('SideBar');
  const st = useTranslations('Students');
  const materialsT = useTranslations('Materials');
  const commonT = useTranslations('Common');
  const rfT = useTranslations('Finance.reports');

  // Filter states
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [startMonth, setStartMonth] = useState('1');
  const [startYear, setStartYear] = useState(currentYear.toString());
  const [endMonth, setEndMonth] = useState(currentMonth.toString());
  const [endYear, setEndYear] = useState(currentYear.toString());
  const [search, setSearch] = useState('');

  // Fetch real data
  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students-all'],
    queryFn: () => getStudents('', 'all', true),
  });

  const { data: subsTypesData, isLoading: isLoadingSubs } = useQuery({
    queryKey: ['subscriptions-all'],
    queryFn: () => getSubscriptions({ page: 'all' }),
  });

  // Analytics processing
  const stats = useMemo(() => {
    if (!studentsData?.data || !subsTypesData?.data) return null;

    const students = studentsData.data as Student[];
    const subTypes = subsTypesData.data as Subscription[];

    const startDate = new Date(parseInt(startYear), parseInt(startMonth) - 1, 1);
    const endDate = new Date(parseInt(endYear), parseInt(endMonth), 0, 23, 59, 59);

    const studentRevenueMap: Record<number, StudentRevenue> = {};
    const subTypeStatsMap: Record<number, SubscriptionStats> = {};

    // Initialize subtype stats
    subTypes.forEach((type, index) => {
      subTypeStatsMap[type.id] = {
        id: type.id,
        title: type.title,
        revenue: 0,
        count: 0,
        color: COLORS[index % COLORS.length]
      };
    });

    let totalRevenue = 0;
    let totalSubCount = 0;

    students.filter(student => student.name.toLowerCase().includes(search.toLowerCase())).forEach(student => {
      student.subscriptions?.forEach((sub: any) => {
        // Use createdAt if available, otherwise fallback to the first lesson's scheduled date
        const subDateRaw = sub.createdAt || sub.lessons?.[0]?.scheduledAt;
        const subDate = subDateRaw ? new Date(subDateRaw) : null;
        
        if (!subDate) return;

        // Check if date is within range and subscription is considered 'revenue' (paid or partially paid)
        if (subDate >= startDate && subDate <= endDate && (sub.paymentStatus === 'paid' || sub.paymentStatus === 'partially_paid' || sub.paymentStatus === 'partial_paid')) {
          // Use the price from the nested subscription object as requested, fallback to amount
          const amount = sub.subscription?.price || sub.amount || 0;
          
          totalRevenue += amount;
          totalSubCount += 1;

          // Student revenue
          if (!studentRevenueMap[student.id]) {
            studentRevenueMap[student.id] = {
              id: student.id,
              name: student.name,
              photo: typeof student.photo === 'string' ? student.photo : undefined,
              revenue: 0,
              subscriptionsCount: 0
            };
          }
          studentRevenueMap[student.id].revenue += amount;
          studentRevenueMap[student.id].subscriptionsCount += 1;

          // SubType revenue
          const typeId = sub.subscription?.id;
          if (typeId && subTypeStatsMap[typeId]) {
            subTypeStatsMap[typeId].revenue += amount;
            subTypeStatsMap[typeId].count += 1;
          }
        }
      });
    });

    const topStudents = Object.values(studentRevenueMap).sort((a, b) => b.revenue - a.revenue);
    const subscriptionStats = Object.values(subTypeStatsMap).filter(s => s.count > 0).sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue,
      totalSubCount,
      topStudents,
      subscriptionStats,
      activeStudentsCount: topStudents.length
    };
  }, [studentsData, subsTypesData, startMonth, startYear, endMonth, endYear, search]);

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
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {s.revenue.toLocaleString()} ₴
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{commonT('total') || 'Total'}</span>
        </div>
      )
    },
  ];

  if (isLoadingStudents || isLoadingSubs) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">{rfT('generating_reports')}</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-8 max-w-7xl mx-auto"
    >
      {/* Header & Date Filter */}
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
                {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(y => (
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
                {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {stats && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <KPICard 
              title={rfT('total_income')} 
              value={`${stats.totalRevenue.toLocaleString()} ₴`}
              trend={rfT('in_period')}
              icon={<DollarSign className="w-5 h-5" />}
              color="primary"
              delay={0.1}
              isCustomTrend
            />
            <KPICard 
              title={rfT('active_students')} 
              value={`${stats.activeStudentsCount} студентів`}
              trend={rfT('in_period')}
              icon={<Users className="w-5 h-5" />}
              color="blue"
              delay={0.2}
              isCustomTrend
            />
            <KPICard 
              title={rfT('total_sales')} 
              value={`${stats.totalSubCount} абонементів`}
              trend={rfT('successful_payments')}
              icon={<Package className="w-5 h-5" />}
              color="emerald"
              delay={0.4}
              isCustomTrend
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Table - Revenue by Student */}
            <Card className="lg:col-span-2 border-none shadow-2xl bg-card/40 backdrop-blur-xl overflow-hidden rounded-[2.5rem]">
              <CardHeader className="border-b border-white/5 bg-white/5 px-8 py-6">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-2xl font-bold tracking-tight">{rfT('revenue_per_student')}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <DataTable 
                  data={stats.topStudents} 
                  columns={columnsTopStudents} 
                  onSearchChange={setSearch}
                />
              </CardContent>
            </Card>

            {/* Subscription Breakdown */}
            <Card className="border-none shadow-2xl bg-card/40 backdrop-blur-xl overflow-hidden rounded-[2.5rem] h-fit">
              <CardHeader className="border-b border-white/5 bg-white/5 px-8 py-6">
                <CardTitle className="text-2xl font-bold tracking-tight">{rfT('income_per_subscription')}</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {stats.subscriptionStats.length > 0 ? (
                  stats.subscriptionStats.map((sub, i) => (
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
                            {stats.totalRevenue ? Math.round((sub.revenue / stats.totalRevenue) * 100) : 0}% {rfT('of_mix')}
                          </span>
                        </div>
                      </div>
                      <div className="h-3 w-full bg-secondary/30 rounded-full overflow-hidden p-[2px]">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${stats.totalRevenue ? (sub.revenue / stats.totalRevenue) * 100 : 0}%` }}
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
          </div>
        </>
      )}
    </motion.div>
  );
}

function KPICard({ title, value, trend, icon, color, delay, isCustomTrend }: any) {
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