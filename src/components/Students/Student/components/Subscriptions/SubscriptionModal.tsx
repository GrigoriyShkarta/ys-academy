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
import { Checkbox } from '@/components/ui/checkbox';

import { StudentSubscription } from '@/components/Students/interface';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'use-intl';
import { subscribeStudent, updateSubscribeStudent } from '@/components/Students/Student/actions';
import { dateLocales } from '@/lib/consts';
import { useUser } from '@/providers/UserContext';
import { getSubscriptions } from '@/components/Finances/Subscriptions/action';

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
  lastSubscriptionEndDate?: Date;
}

export type SupportedLocale = keyof typeof dateLocales;

export default function SubscriptionModal({
  subscription,
  open,
  close,
  studentId,
  lastSubscriptionEndDate,
}: Props) {
  const t = useTranslations('Materials');

  const [abonements, setAbonements] = useState<Abonement[]>([]);
  const [selectedAbonementId, setSelectedAbonementId] = useState<string>('');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [slots, setSlots] = useState<LessonSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [daySettings, setDaySettings] = useState<Record<string, { selected: boolean; time: string }>>({
    monday: { selected: false, time: '14:00' },
    tuesday: { selected: false, time: '14:00' },
    wednesday: { selected: false, time: '14:00' },
    thursday: { selected: false, time: '14:00' },
    friday: { selected: false, time: '14:00' },
    saturday: { selected: false, time: '14:00' },
    sunday: { selected: false, time: '14:00' },
  });
  const { user } = useUser();
  const client = useQueryClient();
  const st = useTranslations('Students');

  const DAYS = [
    { id: 'monday', value: 1 },
    { id: 'tuesday', value: 2 },
    { id: 'wednesday', value: 3 },
    { id: 'thursday', value: 4 },
    { id: 'friday', value: 5 },
    { id: 'saturday', value: 6 },
    { id: 'sunday', value: 0 },
  ];

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
      setSelectedDates(
        initialSlots.map(slot => {
          const d = new Date(slot.dateTime);
          d.setHours(0, 0, 0, 0);
          return d;
        })
      );

      if (subscription.lessonDays) {
        const newSettings = { ...daySettings };
        subscription.lessonDays.forEach(day => {
          if (newSettings[day]) {
            newSettings[day].selected = true;
            // Пытаемся найти время из первого урока в этот день
            const lessonOnThisDay = subscription.lessons.find(l => {
              const d = new Date(l.scheduledAt);
              const dayName = DAYS.find(dweek => dweek.value === d.getDay())?.id;
              return dayName === day;
            });
            if (lessonOnThisDay) {
              newSettings[day].time = format(new Date(lessonOnThisDay.scheduledAt), 'HH:mm');
            }
          }
        });
        setDaySettings(newSettings);
      }
    } else {
      setSelectedAbonementId('');
      setSelectedDates([]);
      setSlots([]);
      setDaySettings({
        monday: { selected: false, time: '14:00' },
        tuesday: { selected: false, time: '14:00' },
        wednesday: { selected: false, time: '14:00' },
        thursday: { selected: false, time: '14:00' },
        friday: { selected: false, time: '14:00' },
        saturday: { selected: false, time: '14:00' },
        sunday: { selected: false, time: '14:00' },
      });
    }
  }, [open, subscription]);

  // Вспомогательная функция для генерации дат на основе правил
  const generateDates = (settings: typeof daySettings, startFrom?: Date) => {
    const selectedDayValues = Object.entries(settings)
      .filter(([_, s]) => s.selected)
      .map(([day]) => DAYS.find(d => d.id === day)?.value ?? 0);

    if (selectedDayValues.length === 0) return [];

    const newDates: Date[] = [];
    let currentDate = startFrom ? new Date(startFrom) : new Date();
    currentDate.setHours(0, 0, 0, 0);

    let iterations = 0;
    while (newDates.length < maxLessons && iterations < 500) {
      iterations++;
      if (selectedDayValues.includes(currentDate.getDay())) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        // Избегаем дублей, хотя в этом цикле их и так не должно быть
        if (!newDates.some(d => format(d, 'yyyy-MM-dd') === dateStr)) {
          newDates.push(new Date(currentDate));
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return newDates;
  };

  // Основной эффект для синхронизации слотов с выбранными датами
  useEffect(() => {
    if (maxLessons === 0) {
      setSlots([]);
      return;
    }

    // Синхронизируем слоты с выбранными датами
    // Мы НЕ фильтруем и НЕ авто-заполняем здесь автоматически, чтобы уважать ручной выбор в календаре
    const updatedSlots: LessonSlot[] = selectedDates.slice(0, maxLessons).map(date => {
      const normalized = format(date, 'yyyy-MM-dd');
      const existingSlot = slots.find(s => format(s.date, 'yyyy-MM-dd') === normalized);

      const dayName = DAYS.find(d => d.value === date.getDay())?.id;
      const ruleTime = dayName ? daySettings[dayName].time : '14:00';

      // Если в настройках дней выбрано время, используем его как приоритетное для этого дня недели
      const time = (dayName && daySettings[dayName].selected) 
        ? daySettings[dayName].time 
        : (existingSlot?.time || ruleTime);
      
      const [hours, minutes] = time.split(':').map(Number);
      const dateTime = setMinutes(setHours(date, hours), minutes);

      return {
        date,
        time,
        dateTime,
      };
    });

    const newDatesStr = updatedSlots.map(s => s.dateTime.getTime()).join(',');
    const currentDatesStr = slots.map(s => s.dateTime.getTime()).join(',');

    if (newDatesStr !== currentDatesStr) {
      setSlots(updatedSlots);
    }
  }, [selectedDates, maxLessons, daySettings]); // Убрали subscription из зависимостей, так как он обрабатывается в другом useEffect

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

  const handleDayToggle = (day: string, checked: boolean) => {
    setDaySettings(prev => {
      const updated = {
        ...prev,
        [day]: { ...prev[day], selected: checked },
      };

      const hasSelected = Object.values(updated).some(s => s.selected);
      if (hasSelected) {
        // Определяем точку начала: либо уже выбранные даты, либо конец предыдущего абонемента, либо сегодня
        let startFrom = selectedDates[0];
        if (!startFrom && lastSubscriptionEndDate) {
          // Начинаем со следующего дня после окончания предыдущего абонемента
          startFrom = new Date(lastSubscriptionEndDate);
          startFrom.setDate(startFrom.getDate() + 1);
        }
        
        const newDates = generateDates(updated, startFrom);
        setSelectedDates(newDates);
      } else {
        setSelectedDates([]);
      }

      return updated;
    });
  };

  const handleDayTimeChange = (day: string, time: string) => {
    setDaySettings(prev => ({
      ...prev,
      [day]: { ...prev[day], time },
    }));
  };


  const isValid =
    !!selectedAbonementId &&
    slots.length === maxLessons &&
    slots.every(s => s.time && s.time.length === 5);

  const handleSave = async () => {
    if (!studentId) return;

    setIsLoading(true);
    try {
          if (subscription) {
        await updateSubscribeStudent({
          userSubscriptionId: Number(subscription.id),
          subscriptionId: Number(selectedAbonementId),
          slots: slots.map(s => s.dateTime.toISOString()),
          amount: subscription?.amount,
          paymentStatus: subscription.paymentStatus,
          lessonDays: Object.entries(daySettings)
            .filter(([_, s]) => s.selected)
            .map(([day]) => day),
        });
      } else {
        await subscribeStudent({
          userId: studentId,
          subscriptionId: Number(selectedAbonementId),
          slots: slots.map(s => s.dateTime.toISOString()),
          lessonDays: Object.entries(daySettings)
            .filter(([_, s]) => s.selected)
            .map(([day]) => day),
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
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(subscription ? 'edit_subscription' : 'add_subscription')}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto flex flex-col gap-6 py-4">
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

          <div className={`space-y-4 border rounded-md p-4 bg-muted/20 ${!selectedAbonementId ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">{t('select_lesson_days') || 'Виберіть дні занять'}</Label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
              {DAYS.map(day => (
                <div key={day.id} className="flex flex-col gap-2 p-2 border rounded-md bg-background">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={day.id}
                      checked={daySettings[day.id].selected}
                      onCheckedChange={checked => handleDayToggle(day.id, !!checked)}
                      disabled={!selectedAbonementId}
                    />
                    <Label htmlFor={day.id} className="text-xs cursor-pointer truncate">
                      {st(day.id)}
                    </Label>
                  </div>
                  <Input
                    type="time"
                    value={daySettings[day.id].time}
                    onChange={e => handleDayTimeChange(day.id, e.target.value)}
                    className="h-8 text-xs p-1"
                    disabled={!daySettings[day.id].selected}
                  />
                </div>
              ))}
            </div>
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
          <Button onClick={handleSave} disabled={!selectedAbonementId || isLoading} className="bg-accent">
            {t('save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
