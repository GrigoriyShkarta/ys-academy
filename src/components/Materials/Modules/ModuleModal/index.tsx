import { Dispatch, FormEvent, SetStateAction, useEffect, useRef, useState } from 'react';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import AvatarEditor from 'react-avatar-editor';
import { LessonItemType, Module, ModuleDTO } from '@/components/Materials/utils/interfaces';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import ChoosePhotoModal from '@/common/MaterialsCommon/ChoosePhotoModal';
import PhotoEditor from '@/components/Materials/Modules/ModuleModal/PhotoEditor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ChooseLessonModal from '@/common/MaterialsCommon/ChooseLessonModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createModule, updateModule } from '@/components/Materials/Modules/action';
import SortableLesson from '@/components/Materials/Modules/ModuleModal/SortableLesson';

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  module?: Module | null;
}

export default function ModuleModal({ open, setOpen, module }: Props) {
  const t = useTranslations('Materials');
  const queryClient = useQueryClient();
  const editorRef = useRef<AvatarEditor | null>(null);

  const [name, setName] = useState<string>('');
  const [lessons, setLessons] = useState<{ id: number; title: string; index: number }[]>([]);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [openLessonModal, setOpenLessonModal] = useState<boolean>(false);
  const [openPhotoBank, setOpenPhotoBank] = useState<boolean>(false);

  // Сброс при открытии
  useEffect(() => {
    if (open) {
      if (module) {
        setName(module.title ?? '');
        setImageSrc(module.url ?? '');
        setLessons((module.lessons ?? []).map((l, i) => ({ ...l, index: l.index ?? i })));
      } else {
        setName('');
        setImageSrc('');
        setLessons([]);
      }
    }
  }, [open, module]);

  const handleAddImage = async (type: LessonItemType, content: string | File, bankId?: number) => {
    setImageSrc(content as string);
  };

  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Перетаскивание
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLessons(items => {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);

      // Пересчитываем index
      return newItems.map((item, idx) => ({ ...item, index: idx }));
    });
  };

  const mutation = useMutation({
    mutationFn: async (form: ModuleDTO) => {
      if (module) {
        await updateModule(form, module.id);
      } else {
        await createModule(form);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      if (module?.id) {
        queryClient.invalidateQueries({ queryKey: ['module'] });
      }
      setOpen(false);
    },
    onError: error => {
      console.error('Ошибка:', error);
      alert(t('save_error'));
    },
    onSettled: () => {
      setName('');
      setLessons([]);
      setImageSrc('');
    },
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const data = {
      title: name,
      url: imageSrc ?? '',
      lessons: lessons.map(l => ({ id: l.id, index: l.index })),
    };

    mutation.mutate(data);
  };

  const addLesson = (newLessons: { id: number; title: string }[]) => {
    const maxIndex = Math.max(...lessons.map(l => l.index ?? 0), -1);
    const added = newLessons
      .filter(nl => !lessons.some(l => l.id === nl.id))
      .map((nl, i) => ({ ...nl, index: maxIndex + 1 + i }));
    setLessons([...lessons, ...added]);
    setOpenLessonModal(false);
  };

  const removeLesson = (id: number) => {
    setLessons(lessons.filter(l => l.id !== id));
  };

  const handleClose = () => {
    setName('');
    setLessons([]);
    setImageSrc('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(module ? 'edit_module' : 'create_module')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 p-2">
            <PhotoEditor
              setImage={setImageSrc}
              externalImage={imageSrc}
              onOpenPhotoBank={() => setOpenPhotoBank(true)}
              editorRef={editorRef}
            />

            <Label>{t('name')}</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('enter_name')}
            />

            <div className="space-y-2">
              <Label>{t('lessons')}</Label>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={lessons.map(l => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {lessons.map(lesson => (
                    <SortableLesson key={lesson.id} lesson={lesson} onRemove={removeLesson} />
                  ))}
                </SortableContext>
              </DndContext>

              {lessons.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">{t('no_lessons_yet')}</p>
              )}
            </div>

            <Button
              type="button"
              onClick={() => setOpenLessonModal(true)}
              className="w-[200px] mx-auto bg-accent"
            >
              {t('add_lesson')}
            </Button>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose} type="button">
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={mutation.isPending} className="bg-accent">
                {mutation.isPending ? t('submeeting') : t('save')}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>

      <ChoosePhotoModal
        open={openPhotoBank}
        closeModal={() => setOpenPhotoBank(false)}
        handleAdd={handleAddImage}
      />
      <ChooseLessonModal
        open={openLessonModal}
        closeModal={() => setOpenLessonModal(false)}
        handleAdd={addLesson}
        lessonsArray={lessons}
      />
    </Dialog>
  );
}
