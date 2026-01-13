'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteLesson, getLesson, updateLesson } from '@/components/Materials/Lesson/action';
import Loader from '@/common/Loader';
import { IFile, LessonDocItem } from '@/components/Materials/utils/interfaces';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Block } from '@blocknote/core';
import Cover from '@/components/Materials/Lesson/components/Cover';
import ConfirmModal from '@/common/ConfirmModal';
import LessonSaveModal from '@/components/Materials/Lesson/components/LessonSaveModal';
import { useUser } from '@/providers/UserContext';
import { uploadPhoto } from '../Photo/action';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableLessonBlock } from '@/components/Materials/Lesson/components/SortableLessonBlock';

export default function LessonLayout({ id }: { id: number }) {
  const [isEditPlace, setIsEditPlace] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [cover, setCover] = useState<File | string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [lessonDoc, setLessonDoc] = useState<LessonDocItem[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const isEdit = searchParams.get('isEdit') === 'true';
  const t = useTranslations('Materials');

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', id],
    queryFn: () => getLesson(id),
    enabled: !!id,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLessonDoc(items => {
        const oldIndex = items.findIndex(item => item.blockId === active.id);
        const newIndex = items.findIndex(item => item.blockId === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  useEffect(() => {
    if (lesson) {
      setLessonTitle(lesson.title);
      setCover(lesson.cover);
      setSelectedCategories(lesson?.categories?.map((c: IFile) => String(c.id)) ?? []);
      setSelectedModules(lesson?.modules?.map((c: IFile) => String(c.id)) ?? []);
      const doc = (lesson.content || []).map((item: any) => ({
        blockId: item.blockId,
        content: item.content ?? [],
      }));
      setLessonDoc(doc);
    }
  }, [lesson]);

  useEffect(() => {
    if (isEdit) setIsEditPlace(true);
  }, [isEdit]);

  const handleUpdateLesson = async () => {
    try {
      setLoading(true);
      let coverUrl = typeof cover === 'string' ? cover : undefined;
      let coverPublicId = '';

      if (cover instanceof File) {
        const res = await uploadPhoto({
          content: cover,
          title: 'Lesson Cover',
          categories: [],
          isOther: true,
        });
        coverUrl = res.url;
        coverPublicId = res.publicId;
      }
      await updateLesson(
        id,
        lessonDoc,
        lessonTitle,
        coverUrl,
        coverPublicId,
        selectedCategories,
        selectedModules
      );
      await queryClient.invalidateQueries({ queryKey: ['lesson', id] });
      await queryClient.invalidateQueries({ queryKey: ['lessons'] });
    } catch (e) {
      console.log('Error updating lesson: ', e);
    } finally {
      setLoading(false);
      setIsEditPlace(false);
      setOpenSaveModal(false);
    }
  };

  const updateBlock = (blockId: number, content: Block[]) => {
    setLessonDoc(prev =>
      prev.map(item => (item.blockId === blockId ? { ...item, content } : item))
    );
  };

  const handleDeleteLesson = async () => {
    await deleteLesson([id]);
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
    <div className="space-y-6 pb-4 relative py-10 md:py-0">
      <div className="flex justify-between items-center md:p-4 sm:p-0">
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
          {!isEditPlace && user?.role === 'super_admin' && (
            <Button className="bg-accent" onClick={() => setIsEditPlace(prev => !prev)}>
              {t('edit')}
            </Button>
          )}

          {isEditPlace ? (
            <Button className="bg-accent" onClick={() => setOpenSaveModal(prev => !prev)}>
              {t('save')}
            </Button>
          ) : (
            user?.role === 'super_admin' && (
              <Button className="bg-destructive" onClick={() => setOpen(true)}>
                {t('delete')}
              </Button>
            )
          )}
        </div>
      </div>
      {(cover || isEditPlace) && (
        <Cover updateCover={setCover} cover={cover} isEdit={isEditPlace} />
      )}
      <div className="relative p-2 sm:p-0 max-w-7xl sm:w-2/3 w-full mx-auto">
        {isEditPlace ? (
          <Input
            placeholder={t('lesson_title')}
            value={lessonTitle}
            onChange={e => setLessonTitle(e.target.value)}
            className="min-w-1/2! text-[50px]! h-[58px] mb-6 mx-auto text-center border-none mb-2"
          />
        ) : (
          <h1 className="text-center text-[50px]! font-bold mb-6">{lesson.title}</h1>
        )}

        {lessonDoc.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={lessonDoc.map(item => item.blockId)}
              strategy={verticalListSortingStrategy}
            >
              {lessonDoc.map((block: LessonDocItem) => (
                <SortableLessonBlock
                  key={block.blockId}
                  id={block.blockId}
                  blockId={block.blockId}
                  lesson={block.content ?? []}
                  onUpdate={updateBlock}
                  editable={isEditPlace}
                  deleteSection={handleDeleteBlock}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}

        {isEditPlace && (
          <div className="w-full px-8 mt-6">
            <Button variant="outline" className="w-full h-[50px]" onClick={addBlock}>
              {t('add_section')}
            </Button>
          </div>
        )}
      </div>

      <ConfirmModal
        open={open}
        setOnClose={() => setOpen(false)}
        confirmAction={handleDeleteLesson}
      />

      <LessonSaveModal
        open={openSaveModal}
        onClose={() => setOpenSaveModal(false)}
        onSave={handleUpdateLesson}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        selectedModules={selectedModules}
        setSelectedModules={setSelectedModules}
        isLoading={loading}
      />
    </div>
  );
}
