import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { format, setHours, setMinutes } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

import { StudentSubscription } from '@/components/Students/interface';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSubscriptions } from '@/components/Materials/Subscriptions/action';
import { useLocale } from 'use-intl';
import { subscribeStudent, updateSubscribeStudent } from '@/components/Students/Student/actions';
import { dateLocales } from '@/lib/consts';
import { useUser } from '@/providers/UserContext';

interface Abonement {
  id: number;
  title: string;
  price: number;
  lessons_count: number;
}

interface LessonSlot {
  date: Date; // дата без времени
  time: string; // "14:30"
  dateTime: Date; // полная дата + время
}

interface Props {
  subscription?: StudentSubscription;
  studentId?: number;
  open: boolean;
  close: () => void;
}

export type SupportedLocale = keyof typeof dateLocales;

export default function SubscriptionModal({ subscription, open, close, studentId }: Props) {
  const t = useTranslations('Materials');

  const [abonements, setAbonements] = useState<Abonement[]>([]);
  const [selectedAbonementId, setSelectedAbonementId] = useState<string>('');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [slots, setSlots] = useState<LessonSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const client = useQueryClient();

  const locale = useLocale();
  const dateLocale = dateLocales[locale as SupportedLocale] || dateLocales.uk;

  const selectedAbonement = abonements.find(a => a.id === Number(selectedAbonementId));
  const maxLessons = selectedAbonement?.lessons_count || 0;

  const { data: subscriptions } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => getSubscriptions({ page: 'all' }),
    enabled: user?.role === 'super_admin',
  });

  useEffect(() => {
    if (subscriptions) {
      setAbonements(subscriptions.data);
    }
  }, [subscriptions]);

  // Сброс при открытии/закрытии или создании новой подписки
  // Инициализация при открытии модалки (создание или редактирование)
  useEffect(() => {
    if (!open) {
      setSelectedAbonementId('');
      setSelectedDates([]);
      setSlots([]);
      return;
    }

    if (subscription) {
      // РЕДАКТИРОВАНИЕ
      setSelectedAbonementId(String(subscription.subscription.id));

      // Создаём слоты напрямую из уроков подписки — с правильным временем!
      const initialSlots: LessonSlot[] = subscription.lessons
        .map(lesson => {
          const fullDateTime = new Date(lesson.scheduledAt);
          return {
            date: new Date(fullDateTime), // копия полной даты
            time: format(fullDateTime, 'HH:mm'),
            dateTime: fullDateTime,
          };
        })
        .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime()); // сортируем по времени

      setSlots(initialSlots);

      // Для календаря — только даты (без времени), чтобы выделялись дни
      setSelectedDates(
        initialSlots.map(slot => {
          const d = new Date(slot.dateTime);
          d.setHours(0, 0, 0, 0);
          return d;
        })
      );
    } else {
      setSelectedAbonementId('');
      setSelectedDates([]);
      setSlots([]);
    }
  }, [open, subscription]);

  useEffect(() => {
    if (maxLessons === 0) {
      setSlots([]);
      return;
    }

    if (!subscription) {
      const newSlots: LessonSlot[] = selectedDates.slice(0, maxLessons).map(date => {
        const normalizedDate = format(date, 'yyyy-MM-dd');
        const existing = slots.find(s => format(s.date, 'yyyy-MM-dd') === normalizedDate);

        const time = existing?.time || '10:00'; // сохраняем время, если дата уже была
        const [hours, minutes] = time.split(':').map(Number);
        const dateTime = setMinutes(setHours(date, hours), minutes);

        return { date, time, dateTime };
      });

      setSlots(newSlots);
      return;
    }

    const updatedSlots: LessonSlot[] = selectedDates.slice(0, maxLessons).map(selectedDate => {
      const normalizedSelected = format(selectedDate, 'yyyy-MM-dd');

      const existingSlot = slots.find(s => format(s.date, 'yyyy-MM-dd') === normalizedSelected);

      if (existingSlot) {
        return {
          ...existingSlot,
          date: selectedDate,
        };
      }

      const fallbackTime = slots[0]?.time || '10:00';
      const [hours, minutes] = fallbackTime.split(':').map(Number);
      const dateTime = setMinutes(setHours(selectedDate, hours), minutes);

      return {
        date: selectedDate,
        time: fallbackTime,
        dateTime,
      };
    });

    setSlots(updatedSlots);
  }, [selectedDates, maxLessons, subscription]);

  // Обновление времени для конкретного слота
  const updateSlotTime = (index: number, time: string) => {
    setSlots(prev => {
      const updated = [...prev];
      if (updated[index]) {
        const [hours, minutes] = time.split(':').map(Number);
        const newDateTime = setMinutes(setHours(updated[index].date, hours), minutes);
        updated[index] = {
          ...updated[index],
          time,
          dateTime: newDateTime,
        };
      }
      return updated;
    });
  };

  const isValid =
    !!selectedAbonementId &&
    slots.length === maxLessons &&
    slots.every(s => s.time && s.time.length === 5);

  const handleSave = async () => {
    if (!isValid || !studentId) return;

    setIsLoading(true);
    try {
      if (subscription) {
        await updateSubscribeStudent({
          userSubscriptionId: Number(subscription.id),
          subscriptionId: Number(selectedAbonementId),
          slots: slots.map(s => s.dateTime.toISOString()),
          amount: subscription?.amount,
          paymentStatus: subscription.paymentStatus,
        });
      } else {
        await subscribeStudent({
          userId: studentId,
          subscriptionId: Number(selectedAbonementId),
          slots: slots.map(s => s.dateTime.toISOString()),
        });
      }

      await client.invalidateQueries({ queryKey: ['student', studentId] });

      close();
    } catch (error) {
      console.error('Ошибка при создании подписки:', error);
      // Можно добавить toast уведомление
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t(subscription ? 'edit_subscription' : 'add_subscription')}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-6 py-4">
          <div className="space-y-2">
            <Label>{t('subscription')}</Label>
            <Select value={selectedAbonementId} onValueChange={setSelectedAbonementId}>
              <SelectTrigger>
                <SelectValue placeholder={t('select_subscription')} />
              </SelectTrigger>
              <SelectContent>
                {abonements.map(a => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.title} ({a.lessons_count} {t('lessons')}, {a.price} грн)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            <div className="flex flex-col space-y-3 h-full">
              <Label>{t('select_dates')}</Label>
              <div className="flex-1 border rounded-md p-3 bg-background min-h-0">
                <Calendar
                  mode="multiple"
                  locale={dateLocale}
                  selected={selectedDates}
                  onSelect={(dates: Date[] | undefined) => {
                    if (!dates) {
                      setSelectedDates([]);
                      return;
                    }
                    const limited = dates.slice(0, maxLessons);
                    setSelectedDates(limited.sort((a, b) => a.getTime() - b.getTime()));
                  }}
                  className="rounded-md h-full"
                />
              </div>
            </div>

            {/* Список слотов */}
            <div className="flex flex-col space-y-3 h-full">
              <Label>{t('set_lesson_times')}</Label>
              <ScrollArea className="flex-1 border rounded-md p-4 min-h-0">
                {slots.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8 h-full flex items-center justify-center">
                    {t('no_dates_selected')}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {slots.map((slot, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex-1 text-sm font-medium">
                          {format(slot.date, 'dd MMMM yyyy', { locale: dateLocale })}
                        </div>
                        <Input
                          type="time"
                          value={slot.time}
                          onChange={e => updateSlotTime(index, e.target.value)}
                          className="w-32"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="text-sm text-muted-foreground text-right">
                {slots.length} / {maxLessons} {t('lessons')}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={close}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!isValid || isLoading} className="bg-accent">
            {t('save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
