import { UseFormReturn } from 'react-hook-form';
import { Student } from '@/components/Students/interface';

export const generatePassword = (length: number, form: UseFormReturn<any>) => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
  let pass = '';
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  form.setValue('password', pass, { shouldValidate: true });
};

export const getLastLessonDate = (student: Student): Date | null => {
  if (!student.subscriptions || student.subscriptions.length === 0) {
    return null;
  }

  const allLessons = student.subscriptions.flatMap(sub => sub.lessons || []);

  if (allLessons.length === 0) return null;

  // Сортируем по дате и берем последний
  const sortedLessons = allLessons.sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
  );

  if (!sortedLessons[0].scheduledAt) return null;

  return new Date(sortedLessons[0].scheduledAt);
};

// Функция для проверки, является ли дата сегодняшней
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const isPastDate = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lessonDate = new Date(date);
  lessonDate.setHours(0, 0, 0, 0);
  return lessonDate < today;
};

// Проверка находится ли дата в пределах недели от сегодня или уже прошла
export const isWithinWeekOrPast = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekFromNow = new Date(today);
  weekFromNow.setDate(today.getDate() + 7);

  const lessonDate = new Date(date);
  lessonDate.setHours(0, 0, 0, 0);

  return lessonDate <= weekFromNow;
};

// Проверка нужно ли выделять красным
export const shouldHighlightLesson = (student: Student, lessonDate: Date | null): boolean => {
  if (!lessonDate || !student.isActive) return false;

  return isWithinWeekOrPast(lessonDate);
};

// Получить последний абонемент студента
export const getLastSubscription = (student: Student) => {
  if (!student.subscriptions || student.subscriptions.length === 0) {
    return null;
  }

  // Сортируем по id (чем больше id, тем новее абонемент)
  const sortedSubscriptions = [...student.subscriptions].sort((a, b) => b.id - a.id);

  return sortedSubscriptions[0];
};
