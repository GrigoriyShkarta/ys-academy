'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getLesson, updateLesson } from '@/components/Materials/Lesson/action';
import Loader from '@/common/Loader';
import { LessonDocItem } from '@/components/Materials/utils/interfaces';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LessonBlock from '@/components/Materials/Lesson/components/LessonBlock';
import { Block } from '@blocknote/core';

export default function LessonLayout({ id }: { id: number }) {
  const [isEditPlace, setIsEditPlace] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [lessonDoc, setLessonDoc] = useState<LessonDocItem[]>([]);
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations('Materials');

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', id],
    queryFn: () => getLesson(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (lesson) {
      setLessonTitle(lesson.title);
      console.log('lesson', lesson);
      const doc = (lesson.content || []).map((item: any) => ({
        blockId: item.blockId,
        content: item.content ?? [], // ← массив Block[]
      }));
      setLessonDoc(doc);
    }
  }, [lesson]);

  const handleUpdateLesson = async () => {
    try {
      setLoading(true);
      await updateLesson(id, lessonDoc, lessonTitle);
      await queryClient.invalidateQueries({ queryKey: ['lesson', id] });
      await queryClient.invalidateQueries({ queryKey: ['lessons'] });
    } catch (e) {
      console.log('Error updating lesson: ', e);
    } finally {
      setLoading(false);
      setIsEditPlace(false);
    }
  };

  const updateBlock = (blockId: number, content: Block[]) => {
    setLessonDoc(prev =>
      prev.map(item => (item.blockId === blockId ? { ...item, content } : item))
    );
  };

  const handleDeleteLesson = async () => {};

  const addBlock = () => {
    // @ts-ignore
    setLessonDoc(prev => {
      const newBlockId = prev.length > 0 ? prev[prev.length - 1].blockId + 1 : 1;

      return [
        ...prev,
        {
          blockId: newBlockId,
          content: [
            {
              type: 'paragraph',
              content: [],
            },
          ],
        },
      ];
    });
  };

  const handleDeleteBlock = (blockId: number) => {};

  if (isLoading || loading) return <Loader />;
  if (!lesson) return <div>Lesson not found</div>;

  return (
    <div className="space-y-6 p-4 relative">
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center"
          aria-label="Назад"
        >
          <ChevronLeft />
          <span>{t('back')}</span>
        </button>

        <div className="flex gap-2">
          {!isEditPlace && (
            <Button className="bg-accent" onClick={() => setIsEditPlace(prev => !prev)}>
              {t('edit')}
            </Button>
          )}

          {isEditPlace ? (
            <Button className="bg-accent" onClick={handleUpdateLesson}>
              {t('save')}
            </Button>
          ) : (
            <Button className="bg-destructive" onClick={handleDeleteLesson}>
              {t('delete')}
            </Button>
          )}
        </div>
      </div>
      {isEditPlace ? (
        <Input
          placeholder={t('lesson_title')}
          value={lessonTitle}
          onChange={e => setLessonTitle(e.target.value)}
          className="min-w-1/2! text-3xl! h-[58px] mx-auto text-center border-none"
        />
      ) : (
        <h1 className="text-center text-4xl font-bold mb-6">{lesson.title}</h1>
      )}

      <div className="relative">
        {lessonDoc.map((block: LessonDocItem) => (
          <LessonBlock
            key={block.blockId}
            blockId={block.blockId}
            lesson={block.content}
            onUpdate={updateBlock}
            editable={isEditPlace}
          />
        ))}
      </div>

      {isEditPlace && (
        <Button variant="outline" className="w-full h-[50px]" onClick={addBlock}>
          {t('add_section')}
        </Button>
      )}
    </div>
  );
}
