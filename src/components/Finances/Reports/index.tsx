'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Package,
  Loader2
} from 'lucide-react';

// Hooks
import { useReportAnalytics } from './hooks/useReportAnalytics';
import { useReportColumns } from './hooks/useReportColumns';

// Components
import { KPICard } from './components/KPICard';
import { ReportHeader } from './components/ReportHeader';
import { SubscriptionBreakdown } from './components/SubscriptionBreakdown';
import { ViewModeToggle } from './components/ViewModeToggle';
import { FactTable } from './components/FactTable';
import { ForecastTable } from './components/ForecastTable';

export default function ReportsLayout() {
  const st = useTranslations('Students');
  const materialsT = useTranslations('Materials');
  const commonT = useTranslations('Common');
  const rfT = useTranslations('Finance.reports');

  // Filter states
  const now = new Date();
  const currentYear = now.getFullYear();

  const [startMonth, setStartMonth] = useState('1');
  const [startYear, setStartYear] = useState(currentYear.toString());
  const [endMonth, setEndMonth] = useState((now.getMonth() + 1).toString());
  const [endYear, setEndYear] = useState(currentYear.toString());
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'fact' | 'forecast'>('fact');
  const [hiddenForecastIds, setHiddenForecastIds] = useState<string[]>([]);

  const { stats, isLoading } = useReportAnalytics({
    startMonth,
    startYear,
    endMonth,
    endYear,
    search,
    hiddenForecastIds
  });

  const { columnsTopStudents, columnsForecast } = useReportColumns({
    st,
    materialsT,
    commonT,
    rfT,
    setHiddenForecastIds
  });

  if (isLoading) {
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
      <ReportHeader 
        rfT={rfT}
        startMonth={startMonth}
        setStartMonth={setStartMonth}
        startYear={startYear}
        setStartYear={setStartYear}
        endMonth={endMonth}
        setEndMonth={setEndMonth}
        endYear={endYear}
        setEndYear={setEndYear}
        currentYear={currentYear}
      />

      {stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
              title={rfT('forecast') || 'Прогноз оплат'} 
              value={`${stats.forecastRevenue.toLocaleString()} ₴`}
              trend={`від ${stats.forecastStudents.length} студентів`}
              icon={<TrendingUp className="w-5 h-5" />}
              color="amber"
              delay={0.2}
              isCustomTrend
            />
            <KPICard 
              title={rfT('active_students')} 
              value={`${stats.activeStudentsCount} студентів`}
              trend={rfT('in_period')}
              icon={<Users className="w-5 h-5" />}
              color="blue"
              delay={0.3}
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

          <ViewModeToggle 
            viewMode={viewMode}
            setViewMode={setViewMode}
            rfT={rfT}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {viewMode === 'fact' ? (
              <FactTable 
                rfT={rfT}
                data={stats.topStudents}
                columns={columnsTopStudents}
                onSearchChange={setSearch}
              />
            ) : (
              <ForecastTable 
                rfT={rfT}
                hasHiddenItems={stats.hasHiddenItems}
                onShowAllHidden={() => setHiddenForecastIds([])}
                data={stats.forecastStudents}
                columns={columnsForecast}
                onSearchChange={setSearch}
              />
            )}

            <SubscriptionBreakdown 
              stats={stats.subscriptionStats}
              totalRevenue={stats.totalRevenue}
              rfT={rfT}
            />
          </div>
        </>
      )}
    </motion.div>
  );
}