import { IColumn } from '@/components/Tracker/interface';
import { enGB, uk } from 'date-fns/locale';

export const YS_TOKEN = 'ys_token';
export const YS_REFRESH_TOKEN = 'ys_refresh_token';
export type Role = 'admin' | 'super_admin' | 'student';

export const dateLocales = {
  en: enGB,
  uk,
} as const;

export const COLUMNS: IColumn[] = [
  { id: 'plans', title: 'В планах', color: 'bg-gray-500' },
  { id: 'homework', title: 'ДЗ', color: 'bg-blue-500' },
  { id: 'songs', title: 'Пісні', color: 'bg-purple-500' },
  { id: 'in-progress', title: 'В процесі', color: 'bg-yellow-500' },
  { id: 'completed', title: 'Виконено', color: 'bg-green-500' },
];
