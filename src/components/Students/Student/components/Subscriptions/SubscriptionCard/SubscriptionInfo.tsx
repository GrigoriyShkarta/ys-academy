import { Dispatch, SetStateAction } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader, Save } from 'lucide-react';
import { useUser } from '@/providers/UserContext';
import { useTranslations } from 'next-intl';
import { StudentSubscription } from '@/components/Students/interface';
import { format, Locale } from 'date-fns';

interface Props {
  subscription: StudentSubscription;
  changePaymentStatus: (subscriptionId: number, status: string) => void;
  saveAmount: (subscriptionId: number) => void;
  partialAmount: number;
  isLoadingChangeAmount?: boolean;
  editingId?: number;
  setEditingId: Dispatch<SetStateAction<number | undefined>>;
  setPartialAmount: Dispatch<SetStateAction<number | undefined>>;
  currentLocale: Locale;
}

export default function SubscriptionInfo({
  changePaymentStatus,
  editingId,
  isLoadingChangeAmount,
  partialAmount,
  saveAmount,
  subscription,
  setPartialAmount,
  currentLocale,
}: Props) {
  const { user } = useUser();
  const t = useTranslations('Students');

  const paymentStatuses = ['unpaid', 'partially_paid', 'paid'];

  return (
    <>
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
          {subscription.amount > 0 && `${subscription.amount}/${subscription.subscription.price}`}
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
                  <Save className="cursor-pointer" onClick={() => saveAmount(subscription.id)} />
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
    </>
  );
}
