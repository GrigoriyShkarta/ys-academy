import { useEffect, useState } from 'react';
import { Student, StudentSubscription } from '@/components/Students/interface';
import {
  deleteSubscription,
  subscribeStudent,
  updateLessonStatusInSubscription,
  updateSubscriptionPaymentStatus,
} from '@/components/Students/Student/actions';
import { toast } from 'sonner';
import { generateRenewalMessage } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { dateLocales } from '@/lib/consts';
import { SupportedLocale } from '@/components/Students/Student/components/Subscriptions/SubscriptionModal';
import { useLocale } from 'use-intl';

interface Props {
  student: Student;
  setOpen: (open: boolean) => void;
}

export default function useSubscription({ student, setOpen }: Props) {
  const [subscriptions, setSubscriptions] = useState<StudentSubscription[] | undefined>();
  const [editingId, setEditingId] = useState<number>();
  const [partialAmount, setPartialAmount] = useState<number>();
  const [editingDateTime, setEditingDateTime] = useState<Date | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<number>();
  const [isLoadingChangeAmount, setIsLoadingChangeAmount] = useState(false);
  const [isLoadingChangeLessonDate, setIsLoadingChangeLessonDate] = useState(false);
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);
  const [editSubscription, setEditSubscription] = useState<StudentSubscription | undefined>();

  const t = useTranslations('Students');
  const client = useQueryClient();
  const locale = useLocale();
  const currentLocale = dateLocales[locale as SupportedLocale] || dateLocales.uk;

  useEffect(() => {
    setSubscriptions(student.subscriptions?.sort((a, b) => b.id - a.id));
  }, [student]);

  const changeLocalStatus = (subscriptionId: number, status: string) => {
    setSubscriptions(prevState =>
      prevState?.map(sub => (sub.id === subscriptionId ? { ...sub, paymentStatus: status } : sub))
    );
  };

  const saveAmount = async (subscriptionId: number) => {
    try {
      setIsLoadingChangeAmount(true);
      await updateSubscriptionPaymentStatus(subscriptionId, 'partially_paid', partialAmount);
      await client.invalidateQueries({ queryKey: ['student', student.id] });
    } catch (e) {
      console.log('error', e);
    } finally {
      setIsLoadingChangeAmount(false);
      setEditingId(undefined);
    }
  };

  const saveLessonDate = async (lessonId: number) => {
    if (!editingDateTime) return;

    try {
      setIsLoadingChangeLessonDate(true);
      await updateLessonStatusInSubscription(lessonId, 'transfer', editingDateTime.toISOString());

      toast.success(t('data_saved'));
      await client.invalidateQueries({ queryKey: ['student', student.id] });
    } catch (e) {
      console.log('error', e);
    } finally {
      setIsLoadingChangeLessonDate(false);
      setEditingLessonId(undefined);
      setEditingDateTime(null);
    }
  };

  const changePaymentStatus = async (subscriptionId: number, status: string) => {
    changeLocalStatus(subscriptionId, status);
    try {
      if (status === 'partially_paid') {
        setEditingId(subscriptionId);
      } else {
        await updateSubscriptionPaymentStatus(subscriptionId, status);
        toast.success(t('data_saved'));
        await client.invalidateQueries({ queryKey: ['student', student.id] });
      }
    } catch (error) {
      console.log('error', error);
    }
  };

  const changeLessonStatus = async (subscriptionId: number, lessonId: number, status: string) => {
    changeLocalLessonStatus(subscriptionId, lessonId, status);
    try {
      if (status === 'transfer') {
        console.log('hi');
        setEditingLessonId(lessonId);
      } else {
        await updateLessonStatusInSubscription(lessonId, status);
        toast.success(t('data_saved'));
        await client.invalidateQueries({ queryKey: ['student', student.id] });
      }
    } catch (error) {}
  };

  const handleClickEditSubscription = (subscriptionId: number) => {
    const sub = subscriptions?.find(s => s.id === subscriptionId);
    setEditSubscription(sub);
    setOpen(true);
  };

  const handleDeleteSubscription = async (subscriptionId: number) => {
    try {
      setIsLoadingDelete(true);
      await deleteSubscription(subscriptionId);
      await client.invalidateQueries({ queryKey: ['student', student.id] });
      toast.success(t('subscription_deleted'));
    } catch (e) {
    } finally {
      setIsLoadingDelete(false);
    }
  };

  const createNewSubscription = async (subscriptionId: number) => {
    try {
      const sub = subscriptions?.find(s => s.id === subscriptionId);
      if (!sub || sub.lessons.length === 0) return;

      // Группируем уроки по шаблону: день недели (UTC) + точное время
      const groups: Record<string, Date[]> = {};

      for (const lesson of sub.lessons) {
        const dt = new Date(lesson.scheduledAt);

        const weekday = dt.getUTCDay(); // 0=Вс, 3=Ср, 5=Пт и т.д.
        const hours = dt.getUTCHours().toString().padStart(2, '0');
        const minutes = dt.getUTCMinutes().toString().padStart(2, '0');
        const seconds = dt.getUTCSeconds().toString().padStart(2, '0');

        const key = `${weekday}-${hours}:${minutes}:${seconds}`;

        if (!groups[key]) groups[key] = [];
        groups[key].push(dt);
      }

      // Генерируем новые даты
      const newSlots: string[] = [];

      for (const key in groups) {
        const dates = groups[key].sort((a, b) => a.getTime() - b.getTime());
        const count = dates.length;
        if (count === 0) continue;

        let last = dates[dates.length - 1];

        for (let i = 0; i < count; i++) {
          // Копируем дату и добавляем 7 дней (по UTC)
          const next = new Date(last.getTime());
          next.setUTCDate(next.getUTCDate() + 7);

          newSlots.push(next.toISOString());

          last = next; // для следующей итерации
        }
      }

      // Сортируем новые слоты по дате (по возрастанию) — опционально, но удобно
      newSlots.sort((a, b) => a.localeCompare(b));

      // Создаём новую подписку с новыми слотами
      await subscribeStudent({
        userId: student.id,
        subscriptionId: sub.subscription.id,
        slots: newSlots,
      });
      await client.invalidateQueries({ queryKey: ['student', student.id] });
    } catch (e) {
      console.error(e); // лучше логировать ошибку, пустой catch — плохая практика
    }
  };

  const handleCopyMessage = (subscription: StudentSubscription) => {
    const message = generateRenewalMessage(subscription);
    navigator.clipboard.writeText(message).then(() => {
      toast.success('Повідомлення про поновлення абонемента скопійовано в буфер обміну');
    });
  };

  const changeLocalLessonStatus = (subscriptionId: number, lessonId: number, status: string) => {
    setSubscriptions(prevState =>
      prevState?.map(sub =>
        sub.id === subscriptionId
          ? {
              ...sub,
              lessons: sub.lessons.map(lesson =>
                lesson.id === lessonId ? { ...lesson, status } : lesson
              ),
            }
          : sub
      )
    );
  };

  return {
    subscriptions,
    editingId,
    partialAmount,
    editingDateTime,
    editingLessonId,
    isLoadingChangeAmount,
    isLoadingChangeLessonDate,
    isLoadingDelete,
    editSubscription,
    currentLocale,
    changePaymentStatus,
    setSubscriptions,
    setEditingId,
    setPartialAmount,
    handleCopyMessage,
    setEditingDateTime,
    setEditingLessonId,
    createNewSubscription,
    handleDeleteSubscription,
    changeLessonStatus,
    handleClickEditSubscription,
    saveLessonDate,
    saveAmount,
    setEditSubscription,
  };
}
