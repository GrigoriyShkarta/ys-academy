import { format, Locale } from 'date-fns';
import { Dispatch, SetStateAction } from 'react';

interface Props {
  tile: string;
  currentLocale: Locale;
  startTime: string;
  endTime: string;
  setShowMore: Dispatch<SetStateAction<number[]>>;
  idx: number;
}

export default function AccordingCard({
  tile,
  idx,
  currentLocale,
  startTime,
  endTime,
  setShowMore,
}: Props) {
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
    </div>
  );
}
