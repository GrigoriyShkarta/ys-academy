import { IColumn } from '@/components/Tracker/interface';
import { enGB, uk } from 'date-fns/locale';

export const YS_TOKEN = 'ys_token';
export const YS_REFRESH_TOKEN = 'ys_refresh_token';
export type Role = 'admin' | 'super_admin' | 'student';

export const dateLocales = {
  en: enGB,
  uk,
} as const;

export const TASK_COLUMNS: IColumn[] = [
  { id: 'plans', title: 'Плани на наступний урок', color: 'bg-gray-500' },
  { id: 'homework', title: 'ДЗ', color: 'bg-blue-500' },
  { id: 'in_progress', title: 'В процесі', color: 'bg-yellow-500' },
  { id: 'completed', title: 'Виконено', color: 'bg-green-500' },
];

export const SONG_COLUMNS: IColumn[] = [
  { id: 'song_plans', title: 'Плани на наступний урок', color: 'bg-purple-500' },
  { id: 'song_in_progress', title: 'В роботі', color: 'bg-pink-500' },
  { id: 'song_ready', title: 'Готово', color: 'bg-teal-500' },
];

export const COLUMNS = [...TASK_COLUMNS, ...SONG_COLUMNS];
