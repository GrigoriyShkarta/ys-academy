import { Student, StudentSubscription } from '@/components/Students/interface';
import SubscriptionModal, {
  SupportedLocale,
} from '@/components/Students/Student/components/Subscriptions/SubscriptionModal';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { useLocale } from 'use-intl';
import { dateLocales } from '@/lib/consts';
import { format } from 'date-fns';
import { useUser } from '@/providers/UserContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  deleteSubscription,
  subscribeStudent,
  updateLessonStatusInSubscription,
  updateSubscriptionPaymentStatus,
} from '@/components/Students/Student/actions';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { ArrowUpIcon, Edit3Icon, Loader, Save, Send, Trash } from 'lucide-react';
import ConfirmModal from '@/common/ConfirmModal';
import { generateRenewalMessage } from '@/lib/utils';

export default function Subscriptions({ student }: { student: Student }) {
  const [open, setOpen] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [partialAmount, setPartialAmount] = useState<number>();
  const [editingDateTime, setEditingDateTime] = useState<Date | null>(null);
  const [subscriptions, setSubscriptions] = useState<StudentSubscription[] | undefined>();
  const [editSubscription, setEditSubscription] = useState<StudentSubscription | undefined>();
  const [editingId, setEditingId] = useState<number>();
  const [editingLessonId, setEditingLessonId] = useState<number>();
  const [isLoadingChangeAmount, setIsLoadingChangeAmount] = useState(false);
  const [isLoadingChangeLessonDate, setIsLoadingChangeLessonDate] = useState(false);
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);
  const t = useTranslations('Students');
  const locale = useLocale();
  const client = useQueryClient();
  const { user } = useUser();

  useEffect(() => {
    setSubscriptions(student.subscriptions?.sort((a, b) => b.id - a.id));
  }, [student]);

  const currentLocale = dateLocales[locale as SupportedLocale] || dateLocales.uk;

  const paymentStatuses = ['paid', 'unpaid', 'partially_paid'];
  const lessonStatuses = ['pending', 'completed', 'expired', 'transfer'];

  const changeLocalStatus = (subscriptionId: number, status: string) => {
    setSubscriptions(prevState =>
      prevState?.map(sub => (sub.id === subscriptionId ? { ...sub, paymentStatus: status } : sub))
    );
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

  return (
    <div className="w-full mx-auto space-y-8">
      {user?.role === 'super_admin' && (
        <Button className="bg-accent mx-auto block" onClick={() => setOpen(true)}>
          {t('add_subscription')}
        </Button>
      )}

      <div className="w-full flex flex-col gap-2">
        {subscriptions &&
          subscriptions.map(subscription => (
            <Card key={subscription.id} className="p-2 gap-2">
              <div className="flex justify-between items-center w-full">
                <h1 className="text-2xl">{subscription.subscription.title}</h1>

                {user?.role === 'super_admin' && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleCopyMessage(subscription)}>
                      <Send />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => createNewSubscription(subscription.id)}
                    >
                      <ArrowUpIcon />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleClickEditSubscription(subscription.id)}
                    >
                      <Edit3Icon />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingId(subscription.id);
                        setOpenConfirm(true);
                      }}
                      className="bg-red-200!"
                    >
                      <Trash color="red" />
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {format(new Date(subscription.lessons[0].scheduledAt), 'd MMMM yyyy', {
                  locale: currentLocale,
                })}{' '}
                —{' '}
                {format(new Date(subscription.lessons.at(-1)?.scheduledAt || ''), 'd MMMM yyyy', {
                  locale: currentLocale,
                })}{' '}
              </p>
              {user?.role !== 'super_admin' ? (
                <p
                  className={`text-sm ${subscription.paymentStatus === 'unpaid' && 'text-red-700'}
                  ${subscription.paymentStatus === 'partially_paid' && 'text-orange-400'} ${
                    subscription.paymentStatus === 'paid' && 'text-green-500'
                  }`}
                >
                  {t(subscription.paymentStatus)}{' '}
                  {subscription.amount > 0 &&
                    `${subscription.amount}/${subscription.subscription.price}`}
                </p>
              ) : (
                <div className="flex gap-2 ">
                  <div className="w-[200px]">
                    <Select
                      value={subscription.paymentStatus}
                      onValueChange={value => changePaymentStatus(subscription.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('select_subscription')} />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentStatuses.map(status => (
                          <SelectItem key={status} value={String(status)}>
                            {t(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {subscription.paymentStatus === 'partially_paid' &&
                    (editingId === subscription.id ? (
                      <div className="flex gap-2 items-center">
                        <Input
                          value={partialAmount || subscription?.amount}
                          placeholder={t('amount')}
                          onChange={e => setPartialAmount(+e.target.value)}
                        />
                        {isLoadingChangeAmount ? (
                          <Loader className="animate-spin" />
                        ) : (
                          <Save
                            className="cursor-pointer"
                            onClick={() => saveAmount(subscription.id)}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <p className="text-orange-400">
                          {subscription.amount}/{subscription.subscription.price}
                        </p>
                      </div>
                    ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {subscription.lessons.map(lesson => (
                  <div
                    key={lesson.id}
                    className={`flex flex-col gap-1 p-2 rounded-[8px] border border-gray-200
                      ${lesson.status === 'completed' && 'bg-green-500 text-white'}
                      ${lesson.status === 'expired' && 'bg-red-500 text-white'}
                      ${lesson.status === 'transfer' && 'bg-orange-500 text-white'}
                    `}
                  >
                    {editingLessonId === lesson.id ? (
                      <>
                        <Input
                          type="date"
                          value={format(editingDateTime! || lesson.scheduledAt, 'yyyy-MM-dd')}
                          onChange={e => {
                            const date = e.target.value;
                            const time = format(editingDateTime!, 'HH:mm');
                            setEditingDateTime(new Date(`${date}T${time}`));
                          }}
                        />

                        <Input
                          type="time"
                          value={format(editingDateTime! || lesson.scheduledAt, 'HH:mm')}
                          onChange={e => {
                            const time = e.target.value;
                            const date = format(editingDateTime!, 'yyyy-MM-dd');
                            setEditingDateTime(new Date(`${date}T${time}`));
                          }}
                        />

                        <Button
                          disabled={!editingDateTime}
                          variant="outline"
                          onClick={() => saveLessonDate(lesson.id)}
                        >
                          {isLoadingChangeLessonDate ? (
                            <Loader className="animate-spin" />
                          ) : (
                            t('save')
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        {/* День недели + полная дата */}
                        <p className="text-sm font-medium">
                          {format(new Date(lesson.scheduledAt), 'd MMMM yyyy', {
                            locale: currentLocale,
                          })}
                        </p>

                        <p className="text-sm">
                          {format(new Date(lesson.scheduledAt), 'EEEE HH:mm', {
                            locale: currentLocale,
                          })}
                        </p>
                      </>
                    )}

                    {user?.role === 'super_admin' ? (
                      <Select
                        value={lesson.status}
                        onValueChange={value =>
                          changeLessonStatus(subscription.id, lesson.id, value)
                        }
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder={t('select_status')} />
                        </SelectTrigger>
                        <SelectContent>
                          {lessonStatuses.map(status => (
                            <SelectItem key={status} value={String(status)}>
                              {t(status)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-xs font-medium">{t(lesson.status)}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
      </div>

      <SubscriptionModal
        open={open}
        close={() => {
          setOpen(false);
          setEditSubscription(undefined);
        }}
        studentId={student.id}
        subscription={editSubscription}
      />

      <ConfirmModal
        open={openConfirm}
        isLoading={isLoadingDelete}
        setOnClose={() => setOpenConfirm(false)}
        confirmAction={() => {
          handleDeleteSubscription(editingId!).then(() => setOpenConfirm(false));
        }}
      />
    </div>
  );
}
