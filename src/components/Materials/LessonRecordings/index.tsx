'use client';

import { useQuery } from '@tanstack/react-query';
import { getStudent } from '@/components/Students/Student/actions';
import { useState } from 'react';
import Loader from '@/common/Loader';
import { Card } from '@/components/ui/card';
import SubscriptionInfo from '@/components/Materials/LessonRecordings/SubscriptionInfo';

export default function LessonRecordingsLayout({ id }: { id: number }) {
  const [showMore, setShowMore] = useState<number[]>([]);

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => getStudent(id),
    enabled: !!id,
  });

  if (isLoading) return <Loader />;

  if (!student) return null;

  const toggleSubscription = (idx: number) => {
    if (idx === 0) return; // Первая карточка всегда открыта

    setShowMore(prev => (prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]));
  };

  return (
    <div className="flex flex-col gap-4 p-4 mt-18 sm:mt-0 w-full max-h-screen overflow-auto">
      <h1 className="text-4xl">{student.name}</h1>
      {student?.subscriptions
        ?.sort((a, b) => b.id - a.id)
        .map((sub, idx) => {
          const isExpanded = idx === 0 || showMore.includes(idx);

          return (
            <Card
              key={sub.id}
              onClick={() => toggleSubscription(idx)}
              className={`transition-all px-0 py-0 ${
                !isExpanded || idx > 0 ? 'cursor-pointer hover:bg-muted/50' : ''
              }`}
            >
              <SubscriptionInfo subscription={sub} isExpanded={isExpanded} />
            </Card>
          );
        })}
    </div>
  );
}
