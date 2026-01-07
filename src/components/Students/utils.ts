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

// Проверка находится ли дата в пределах 2 дней от сегодня или уже прошла
export const isWithinTwoDaysOrPast = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const twoDaysFromNow = new Date(today);
  twoDaysFromNow.setDate(today.getDate() + 2);

  const lessonDate = new Date(date);
  lessonDate.setHours(0, 0, 0, 0);

  return lessonDate <= twoDaysFromNow;
};

// Проверка нужно ли выделять красным
export const shouldHighlightLesson = (student: Student, lessonDate: Date | null): boolean => {
  if (!lessonDate || !student.isActive) return false;

  return isWithinTwoDaysOrPast(lessonDate);
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
