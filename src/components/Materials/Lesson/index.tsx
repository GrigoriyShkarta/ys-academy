'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { keepPreviousData } from '@tanstack/query-core';
import { Button } from '@/components/ui/button';
import EditPlace from '@/components/Materials/Lesson/EditPlace';
import { useQuery } from '@tanstack/react-query';
import { getUnassignedLessons } from '@/components/Materials/Lesson/action';
import LessonList from '@/components/Materials/Lesson/components/LessonList';
import Loader from '@/common/Loader';

export default function LessonsLayout() {
  const [isEditPlace, setIsEditPlace] = useState(false);
  const [search, setSearch] = useState('');
  const t = useTranslations('Materials');

  const { data: lessons, isLoading } = useQuery({
    queryKey: ['lessons', search],
    queryFn: () => getUnassignedLessons({ search }),
    placeholderData: keepPreviousData,
  });

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col gap-4">
      {!isEditPlace && (
        <>
          <h1 className="text-5xl text-center mb-2">{t('my_lessons')}</h1>
          <Button className="bg-accent w-[240px] mx-auto" onClick={() => setIsEditPlace(true)}>
            {t('createLesson')}
          </Button>
        </>
      )}

      {isEditPlace && <EditPlace setIsEditPlace={setIsEditPlace} />}
      {!isEditPlace && lessons.length > 0 && (
        <LessonList lessons={lessons} search={search} setSearch={setSearch} />
      )}
    </div>
  );
}
