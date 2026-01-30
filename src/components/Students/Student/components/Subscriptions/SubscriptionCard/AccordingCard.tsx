import { format, Locale } from 'date-fns';
import { useTranslations } from 'next-intl';
import { Dispatch, SetStateAction } from 'react';

interface Props {
  tile: string;
  currentLocale: Locale;
  startTime: string;
  endTime: string;
  setShowMore: Dispatch<SetStateAction<number[]>>;
  idx: number;
  paymentStatus?: string;
  paymentDate?: string;
  amount?: number;
  price?: number;
}

export default function AccordingCard({
  tile,
  idx,
  currentLocale,
  startTime,
  endTime,
  setShowMore,
  paymentStatus,
  paymentDate,
  amount,
  price,
}: Props) {
  const t = useTranslations('Students');
  return (
    <div
      className="flex items-center gap-2 cursor-pointer"
      onClick={() => setShowMore(prev => [...prev, idx])}
    >
      <h1>{tile}</h1>

      <p className="text-sm text-muted-foreground">
        {format(new Date(startTime), 'd MMMM yyyy', {
          locale: currentLocale,
        })}{' '}
        —{' '}
        {format(new Date(endTime), 'd MMMM yyyy', {
          locale: currentLocale,
        })}{' '}
      </p>

      {paymentStatus === 'partially_paid' && (
        <p className="text-sm text-orange-400">
          ({t('partially_paid')}: {amount}/{price}
          {paymentDate && ` — ${t('payment_date')}: ${format(new Date(paymentDate), 'd.MM.yy')}`})
        </p>
      )}
    </div>
  );
}
