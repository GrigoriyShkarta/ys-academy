'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteLesson, getLesson, updateLesson } from '@/components/Materials/Lesson/action';
import Loader from '@/common/Loader';
import { LessonDocItem } from '@/components/Materials/utils/interfaces';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LessonBlock from '@/components/Materials/Lesson/components/LessonBlock';
import { Block } from '@blocknote/core';
import Cover from '@/components/Materials/Lesson/components/Cover';
import ConfirmModal from '@/common/ConfirmModal';

function normalizeBlocks(blocks: any[]): any[] {
  return blocks.map(block => {
    const b = { ...block };

    // --- Fix youtube ---
    if (b.type === 'youtube') {
      b.props = {
        url: b.props?.url ?? '',
        videoId: b.props?.videoId ?? '',
        width: b.props?.width ?? '50%',
        height: b.props?.height ?? 315,
      };
    }

    // --- Fix columnList ---
    if (b.type === 'columnList') {
      b.props = b.props ?? {};
    }

    // --- Fix column ---
    if (b.type === 'column') {
      b.props = {
        width: b.props?.width ?? 1,
      };
    }

    // --- Fix images ---
    if (b.type === 'image') {
      b.props = {
        url: b.props?.url ?? '',
        caption: b.props?.caption ?? '',
        previewWidth: b.props?.previewWidth ?? '100%',
      };
    }

    // --- Fix audio ---
    if (b.type === 'audio') {
      b.props = {
        url: b.props?.url ?? '',
        name: b.props?.name ?? '',
      };
    }

    // Рекурсивно нормализуем children
    if (b.children?.length) {
      b.children = normalizeBlocks(b.children);
    }

    return b;
  });
}

export default function LessonLayout({ id }: { id: number }) {
  const [isEditPlace, setIsEditPlace] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [cover, setCover] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [lessonDoc, setLessonDoc] = useState<LessonDocItem[]>([]);
  const [open, setOpen] = useState(false);
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
      setCover(lesson.cover);
      const doc = (lesson.content || []).map((item: any) => ({
        blockId: item.blockId,
        content: item.content ?? [],
      }));
      setLessonDoc(doc);
    }
  }, [lesson]);

  const handleUpdateLesson = async () => {
    try {
      setLoading(true);
      await updateLesson(id, lessonDoc, lessonTitle, cover);
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

  const handleDeleteLesson = async () => {
    await deleteLesson(id);
    await queryClient.invalidateQueries({ queryKey: ['lessons'] });
    router.back();
  };

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

  const handleDeleteBlock = (blockId: number) => {
    setLessonDoc(prev => prev.filter(item => item.blockId !== blockId));
  };

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
            <Button className="bg-destructive" onClick={() => setOpen(true)}>
              {t('delete')}
            </Button>
          )}
        </div>
      </div>
      {(cover || isEditPlace) && (
        <Cover updateCover={setCover} cover={cover} isEdit={isEditPlace} />
      )}
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
        {lessonDoc.length > 0 &&
          lessonDoc.map((block: LessonDocItem) => (
            <LessonBlock
              key={block.blockId}
              blockId={block.blockId}
              lesson={block.content ?? []}
              onUpdate={updateBlock}
              editable={isEditPlace}
              deleteSection={handleDeleteBlock}
            />
          ))}
      </div>

      {isEditPlace && (
        <Button variant="outline" className="w-full h-[50px]" onClick={addBlock}>
          {t('add_section')}
        </Button>
      )}

      <ConfirmModal
        open={open}
        setOnClose={() => setOpen(false)}
        confirmAction={handleDeleteLesson}
      />
    </div>
  );
}
