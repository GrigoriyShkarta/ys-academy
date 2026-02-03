import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStudents } from '@/components/Students/actions';
import { getSubscriptions } from '@/components/Finances/Subscriptions/action';
import { Student } from '@/components/Students/interface';
import { Subscription } from '@/components/Materials/utils/interfaces';
import { StudentRevenue, SubscriptionStats, ForecastStudent, COLORS } from '../types';
import { useTranslations } from 'next-intl';

interface UseReportAnalyticsProps {
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  search: string;
  hiddenForecastIds: string[];
}

export function useReportAnalytics({
  startMonth,
  startYear,
  endMonth,
  endYear,
  search,
  hiddenForecastIds
}: UseReportAnalyticsProps) {
  const rfT = useTranslations('Finance.reports');

  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students-all'],
    queryFn: () => getStudents('', 'all', true),
  });

  const { data: subsTypesData, isLoading: isLoadingSubs } = useQuery({
    queryKey: ['subscriptions-all'],
    queryFn: () => getSubscriptions({ page: 'all' }),
  });

  const stats = useMemo(() => {
    if (!studentsData?.data || !subsTypesData?.data) return null;

    const students = studentsData.data as Student[];
    const subTypes = subsTypesData.data as Subscription[];

    const startDate = new Date(parseInt(startYear), parseInt(startMonth) - 1, 1);
    const endDate = new Date(parseInt(endYear), parseInt(endMonth), 0, 23, 59, 59);

    const studentRevenueMap: Record<number, StudentRevenue> = {};
    const subTypeStatsMap: Record<number, SubscriptionStats> = {};

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
    const forecastItems: ForecastStudent[] = [];

    const filteredStudents = students.filter(student => student.name.toLowerCase().includes(search.toLowerCase()));

    filteredStudents.forEach(student => {
      const subs = student.subscriptions || [];

      subs.forEach((sub: any) => {
        const firstLessonDate = sub.lessons && sub.lessons.length > 0
          ? new Date(Math.min(...sub.lessons.map((l: any) => new Date(l.scheduledAt).getTime())))
          : null;
        const subDate = sub.paymentDate ? new Date(sub.paymentDate) : (sub.createdAt ? new Date(sub.createdAt) : firstLessonDate);
        
        if (subDate && subDate >= startDate && subDate <= endDate && (sub.paymentStatus === 'paid' || sub.paymentStatus === 'partially_paid' || sub.paymentStatus === 'partial_paid')) {
          const isPartial = sub.paymentStatus === 'partially_paid' || sub.paymentStatus === 'partial_paid';
          const amount = isPartial ? (sub.amount || 0) : (sub.subscription?.price || sub.amount || 0);
          
          totalRevenue += amount;
          totalSubCount += 1;

          if (!studentRevenueMap[student.id]) {
            studentRevenueMap[student.id] = {
              id: student.id,
              name: student.name,
              photo: typeof student.photo === 'string' ? student.photo : undefined,
              revenue: 0,
              subscriptionsCount: 0,
              isPartial: false
            };
          }
          studentRevenueMap[student.id].revenue += amount;
          studentRevenueMap[student.id].subscriptionsCount += 1;
          if (isPartial) studentRevenueMap[student.id].isPartial = true;

          const typeId = sub.subscription?.id;
          if (typeId && subTypeStatsMap[typeId]) {
            subTypeStatsMap[typeId].revenue += amount;
            subTypeStatsMap[typeId].count += 1;
          }
        }
      });

      subs.forEach((sub: any) => {
        const firstLessonDate = sub.lessons && sub.lessons.length > 0
          ? new Date(Math.min(...sub.lessons.map((l: any) => new Date(l.scheduledAt).getTime())))
          : null;
        const subDate = sub.paymentDate ? new Date(sub.paymentDate) : (sub.createdAt ? new Date(sub.createdAt) : firstLessonDate);
        
        if (subDate && subDate >= startDate && subDate <= endDate) {
          const price = sub.subscription?.price || 0;
          const paid = sub.amount || 0;
          const debt = price - paid;
          const forecastId = `extra-${student.id}-${sub.id}`;
          
          if (sub.paymentStatus !== 'paid' && debt > 0) {
            if (!hiddenForecastIds.includes(forecastId)) {
              forecastItems.push({
                id: forecastId, 
                name: student.name,
                photo: typeof student.photo === 'string' ? student.photo : undefined,
                expectedAmount: debt,
                lastLessonDate: subDate.toISOString(),
                paymentDate: sub.paymentDate,
                subscriptionTitle: sub.subscription?.title || 'Unknown',
                type: 'extra'
              });
            }
          }
        }
      });

      const validSubs = subs.filter((s: any) => s.lessons && s.lessons.length > 1);
      if (validSubs.length > 0) {
        let latestSub = validSubs[0];
        let maxDate = new Date(0);
        
        validSubs.forEach((s: any) => {
           const subLastLessonDate = s.lessons.reduce((max: Date, l: any) => {
              const d = new Date(l.scheduledAt);
              return d > max ? d : max;
           }, new Date(0));
           
           if (subLastLessonDate > maxDate) {
             maxDate = subLastLessonDate;
             latestSub = s;
           }
        });

        if (maxDate >= startDate && maxDate <= endDate) {
          const hasFutureSub = subs.some((s: any) => {
            const startStr = s.createdAt || s.lessons?.[0]?.scheduledAt;
            if (!startStr) return false;
            const start = new Date(startStr);
            return start > maxDate;
          });

          const forecastId = `renewal-${student.id}-${latestSub.id}`;

          if (!hasFutureSub) {
            if (!hiddenForecastIds.includes(forecastId)) {
              forecastItems.push({
                id: forecastId, 
                name: student.name,
                photo: typeof student.photo === 'string' ? student.photo : undefined,
                expectedAmount: latestSub.subscription?.price || 0,
                lastLessonDate: maxDate.toISOString(),
                subscriptionTitle: latestSub.subscription?.title || 'Unknown',
                type: 'renewal'
              });
            }
          }
        }
      }
    });

    const totalForecastRevenue = forecastItems.reduce((acc, item) => acc + item.expectedAmount, 0);
    const topStudents = Object.values(studentRevenueMap).sort((a, b) => b.revenue - a.revenue);
    const forecastStudents = forecastItems.sort((a, b) => new Date(a.lastLessonDate).getTime() - new Date(b.lastLessonDate).getTime());
    const subscriptionStats = Object.values(subTypeStatsMap).filter(s => s.count > 0).sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue,
      totalSubCount,
      topStudents,
      subscriptionStats,
      activeStudentsCount: topStudents.length,
      forecastRevenue: totalForecastRevenue,
      forecastStudents,
      hasHiddenItems: hiddenForecastIds.length > 0
    };
  }, [studentsData, subsTypesData, startMonth, startYear, endMonth, endYear, search, hiddenForecastIds, rfT]);

  return {
    stats,
    isLoading: isLoadingStudents || isLoadingSubs
  };
}
