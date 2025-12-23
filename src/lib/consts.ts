import { enGB, uk } from 'date-fns/locale';

export const YS_TOKEN = 'ys_token';
export const YS_REFRESH_TOKEN = 'ys_refresh_token';
export type Role = 'admin' | 'super_admin' | 'student';

export const dateLocales = {
  en: enGB,
  uk,
} as const;
