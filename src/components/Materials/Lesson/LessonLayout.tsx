'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteLesson, getLesson, updateLesson } from '@/components/Materials/Lesson/action';
import Loader from '@/common/Loader';
import { IFile, LessonDocItem } from '@/components/Materials/utils/interfaces';
import { ChevronLeft, ChevronRight, PlayCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Block } from '@blocknote/core';
import Cover from '@/components/Materials/Lesson/components/Cover';
import ConfirmModal from '@/common/ConfirmModal';
import LessonSaveModal from '@/components/Materials/Lesson/components/LessonSaveModal';
import { useUser } from '@/providers/UserContext';
import { uploadPhoto } from '../Photo/action';
import { useMemo } from 'react';
import Link from 'next/link';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  defaultDropAnimationSideEffects,
  MeasuringStrategy,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableLessonBlock } from '@/components/Materials/Lesson/components/SortableLessonBlock';
import LessonBlock from '@/components/Materials/Lesson/components/LessonBlock';
import { getCourse } from '../Course/action';

export default function LessonLayout({ lessonId }: { lessonId: number }) {
  const [isEditPlace, setIsEditPlace] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [cover, setCover] = useState<File | string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [lessonDoc, setLessonDoc] = useState<LessonDocItem[]>([]);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const isEdit = searchParams.get('isEdit') === 'true';
  const t = useTranslations('Materials');
  const courseId = searchParams.get('courseId');

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => getLesson(lessonId),
    enabled: !!lessonId,
  });

  const { data: course, isLoading: courseLoading } = useQuery({
      queryKey: ['course', courseId],
      queryFn: () => getCourse(+courseId!, user?.id ? +user.id : undefined),
      enabled: !!courseId && !!user,
    });

  const { allLessons, currentIndex, prevLesson, nextLesson } = useMemo(() => {
    if (!course) return { allLessons: [], currentIndex: -1, prevLesson: null, nextLesson: null };
    
    const moduleLessons = (course.modules || []).flatMap(m => m.lessons || []);
    // Ensure all have access info if it's a student view, though super_admin overrides
    const standaloneLessons = (course.lessons || []);
    
    const flat = [...moduleLessons, ...standaloneLessons];
    const index = flat.findIndex(l => l.id === lessonId);
    
    return {
      allLessons: flat,
      currentIndex: index,
      prevLesson: index > 0 ? flat[index - 1] : null,
      nextLesson: index < flat.length - 1 ? flat[index + 1] : null,
    };
  }, [course, lessonId]);

  const hasAccess = (lesson: any) => {
    if (user?.role === 'super_admin') return true;
    return !!lesson?.access;
  };

  const isPrevEnabled = !!prevLesson && hasAccess(prevLesson);
  const isNextEnabled = !!nextLesson && hasAccess(nextLesson);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLessonDoc(items => {
        const oldIndex = items.findIndex(item => item.blockId === active.id);
        const newIndex = items.findIndex(item => item.blockId === over.id);

        if (oldIndex === -1 || newIndex === -1) return items;

        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveId(null);
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
        lessonId,
        lessonDoc,
        lessonTitle,
        coverUrl,
        coverPublicId,
        selectedCategories,
        selectedModules
      );
      await queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] });
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
    await deleteLesson([lessonId]);
    await queryClient.invalidateQueries({ queryKey: ['lessons'] });
    router.back();
  };

  const addBlock = () => {
    // @ts-ignore
    setLessonDoc(prev => {
      const maxId = prev.length > 0 ? Math.max(...prev.map(item => item.blockId)) : 0;
      const newBlockId = maxId + 1;

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
    <div className={`space-y-6 pb-4 w-full relative py-10 md:py-0 ${user?.role === 'student' && !isEdit || !isEditPlace ? 'hide-btn' : ''}`}>
      <div className="flex justify-between items-center md:p-4 sm:p-0 z-10 relative max-w-7xl sm:w-2/3 w-full mx-auto">
        <button
          type="button"
          onClick={() => {
            if (courseId) {
              if (user?.role === 'super_admin') {
                router.push(`/main/materials/courses/${courseId}`);
              } else {
                router.push(`/main/course/${courseId}?id=${user?.id}`);
              }
            } else {
              router.back();
            }
          }}
          className="flex items-center"
          aria-label="Назад"
        >
          <ChevronLeft />
          <span>{t('back')}</span>
        </button>

        {courseId && (
          <div className="fixed w-[240px] justify-center flex items-center bg-muted/30 rounded-lg p-1 mr-2 left-1/2">
            <Button
              variant="ghost"
              size="icon"
              disabled={!isPrevEnabled}
              asChild={isPrevEnabled}
              className="h-8 w-8"
            >
              {isPrevEnabled ? (
                <Link href={`/main/courses/lesson/${prevLesson.id}/?courseId=${courseId}`}>
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              ) : (
                <ChevronLeft className="h-4 w-4 opacity-50" />
              )}
            </Button>
            <div className="mx-2 text-xs font-medium text-muted-foreground tabular-nums">
              {currentIndex + 1} / {allLessons.length}
            </div>
            <Button
              variant="ghost"
              size="icon"
              disabled={!isNextEnabled}
              asChild={isNextEnabled}
              className="h-8 w-8"
            >
              {isNextEnabled ? (
                <Link href={`/main/courses/lesson/${nextLesson.id}/?courseId=${courseId}`}>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <ChevronRight className="h-4 w-4 opacity-50" />
              )}
            </Button>
          </div>
        )}

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

        {!isEditPlace && user?.role !== 'super_admin' && (
            <div></div>  
          )}
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
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveId(null)}
            measuring={{
              droppable: {
                strategy: MeasuringStrategy.Always,
              },
            }}
            // autoScroll={{
            //   threshold: 0.3,
            // }}
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
            <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
              {activeId ? (
                 <div className="bg-background border rounded-lg shadow-xl opacity-90 overflow-hidden">
                    <LessonBlock
                      blockId={activeId}
                      lesson={lessonDoc.find(i => i.blockId === activeId)?.content || []}
                      editable={true} // Keep editable true so handle renders, but interaction is effectively disabled by overlay
                      isSelectBlock={false}
                    />
                 </div>
              ) : null}
            </DragOverlay>
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
