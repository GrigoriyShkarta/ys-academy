export interface StudentRevenue {
  photo?: string;
  id: number;
  name: string;
  revenue: number;
  subscriptionsCount: number;
  isPartial?: boolean;
}

export interface SubscriptionStats {
  id: number;
  title: string;
  revenue: number;
  count: number;
  color: string;
}

export interface ForecastStudent {
  id: string;
  name: string;
  photo?: string;
  expectedAmount: number;
  lastLessonDate: string;
  subscriptionTitle: string;
  type: 'extra' | 'renewal';
}

export const MONTHS_UA = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
];

export const COLORS = ['emerald', 'blue', 'amber', 'rose', 'indigo', 'orange', 'cyan'];
