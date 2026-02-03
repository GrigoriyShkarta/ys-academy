'use client';

import { useEffect, useState } from 'react';
import { LessonDocItem } from '@/components/Materials/utils/interfaces';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { assignLesson, getLesson } from '@/components/Materials/Lesson/action';
import Loader from '@/common/Loader';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Cover from '@/components/Materials/Lesson/components/Cover';
import LessonBlock from '@/components/Materials/Lesson/components/LessonBlock';
import { getStudent } from '@/components/Students/Student/actions';

export default function LessonDetail({
  lessonId,
  studentId,
}: {
  lessonId: number;
  studentId: number;
}) {
  const [loading, setLoading] = useState(false);
  const [selectedBlocks, setSelectedBlocks] = useState<number[]>([]);
  const [lessonDoc, setLessonDoc] = useState<LessonDocItem[]>([]);
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations('Materials');

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => getLesson(lessonId, studentId),
    enabled: !!lessonId,
  });

  const { data: student, isLoading: isLoadingStudent } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => getStudent(studentId),
    enabled: !!studentId,
  });

  useEffect(() => {
    if (lesson) {
      const doc = (lesson.content || []).map((item: any) => ({
        blockId: item.blockId,
        content: item.content ?? [],
      }));

      if (lesson.accessBlocks && lesson.accessBlocks.length > 0) {
        setSelectedBlocks(lesson.accessBlocks);
      } else {
        setSelectedBlocks(lesson.content?.map((item: { blockId: number }) => item.blockId) ?? []);
      }
      setLessonDoc(doc);
    }
  }, [lesson]);

  const sendBlocksAccess = async () => {
    try {
      setLoading(true);
      // @ts-ignore
      await assignLesson([+studentId], [{ id: lessonId, blocks: selectedBlocks }], false);
      await queryClient.invalidateQueries({ queryKey: ['student'] });
      router.back();
    } catch (error) {
      console.log('error: ', error);
    } finally {
      setLoading(false);
    }
  };

  const selectBlock = (blockId: number) => {
    setSelectedBlocks(prev =>
      prev.includes(blockId) ? prev.filter(id => id !== blockId) : [...prev, blockId]
    );
  };

  return (
    <div className="space-y-6 p-4 w-full overflow-hidden relative overflow-y-auto h-screen max-w-7xl sm:w-2/3 w-full mx-auto">
      {isLoading || loading || isLoadingStudent ? (
        <Loader />
      ) : (
        <>
          <div className="flex justify-between items-center max-w-7xl w-full">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center"
              aria-label="Назад"
            >
              <ChevronLeft />
              <span>{t('back')}</span>
            </button>

            <Button className="bg-accent" onClick={sendBlocksAccess}>
              {t('save')}
            </Button>
          </div>

          {lesson.cover && <Cover cover={lesson.cover} />}
          <h1 className="text-center text-4xl font-bold mb-6">{lesson.title}</h1>

          <div className="">
            {lessonDoc.length > 0 &&
              lessonDoc.map((block: LessonDocItem) => (
                <LessonBlock
                  key={block.blockId}
                  blockId={block.blockId}
                  lesson={block.content ?? []}
                  editable={false}
                  isLessonDetail
                  selectBlock={selectBlock}
                  isSelectBlock={selectedBlocks.includes(block.blockId)}
                />
              ))}
          </div>
        </>
      )}
    </div>
  );
}
