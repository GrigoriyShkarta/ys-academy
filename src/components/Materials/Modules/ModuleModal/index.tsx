import { Dispatch, FormEvent, SetStateAction, useEffect, useState } from 'react';
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
import { Module } from '@/components/Materials/utils/interfaces';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import PhotoEditor from '@/common/PhotoEditor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ChooseListModal from '@/common/MaterialsCommon/ChooseListModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createModule, updateModule } from '@/components/Materials/Modules/action';
import SortableLesson from '@/components/Materials/Modules/ModuleModal/SortableLesson';
import MultiSelect from '@/common/MultiSelect';
import { getCategories } from '@/components/Materials/Categories/action';
import { Plus } from 'lucide-react';
import CategoryModal from '@/components/Materials/Categories/CategoryModal';
import { useUser } from '@/providers/UserContext';
import { uploadPhoto } from '@/components/Materials/Photo/action';

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  module?: Module | null;
  selectModule?: (modules: string[]) => void;
}

function dataURLtoFile(dataurl: string, filename: string) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export default function ModuleModal({ open, setOpen, selectModule, module }: Props) {
  const t = useTranslations('Materials');
  const queryClient = useQueryClient();

  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState<string>('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [lessons, setLessons] = useState<{ id: number; title: string; index: number }[]>([]);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [openLessonModal, setOpenLessonModal] = useState<boolean>(false);
  const { user } = useUser();

  // Сброс при открытии
  useEffect(() => {
    if (open) {
      if (module) {
        setName(module.title ?? '');
        setImageSrc(module.url ?? '');
        setLessons((module.lessons ?? []).map((l, i) => ({ ...l, index: l.order ?? i })));
        setCategoryIds((module.categories ?? []).map(c => String(c.id)));
      } else {
        setName('');
        setImageSrc('');
        setLessons([]);
      }
    }
  }, [open, module]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories({ page: 'all' }),
    enabled: user?.role === 'super_admin',
  });

  const categoryOptions = (categories?.data ?? []).map((c: any) => ({
    value: String(c.id),
    label: c.title,
    color: c.color,
  }));

  const handleNewCategoriesForFile = (newCategories?: string[]) => {
    if (!newCategories) return;
    setCategoryIds(prev => Array.from(new Set([...prev, ...newCategories])));
    setIsCategoryModalOpen(false);
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    let finalImageSrc = imageSrc;
    let publicImgId = '';

    if (imageSrc && imageSrc.startsWith('data:image')) {
      try {
        const file = dataURLtoFile(imageSrc, 'module_cover.jpg');
        const res = await uploadPhoto({
          content: file,
          title: name || 'Module Cover',
          categories: [],
          isOther: true,
        });
        finalImageSrc = res.url;
        publicImgId = res.publicId;
      } catch (error) {
        console.error('Photo upload failed', error);
      }
    }

    const data = {
      title: name,
      url: finalImageSrc ?? '',
      publicImgId: publicImgId ?? '',
      lessons: lessons.map(l => ({ id: l.id, order: l.index })),
      categories: categoryIds ?? [],
    };

    try {
      if (module) {
        await updateModule(data, module.id);
        queryClient.invalidateQueries({ queryKey: ['module', module.id] });
      } else {
        const newModule = await createModule(data);
        console.log('newModule', newModule);
        if (newModule && selectModule) {
          selectModule(newModule.id);
        }
        queryClient.invalidateQueries({ queryKey: ['modules'] });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setOpen(false);
      setIsLoading(false);
    }
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
      <DialogContent className="max-w-full sm:max-w-[850px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(module ? 'edit_module' : 'create_module')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 p-2">
            <PhotoEditor setImage={setImageSrc} externalImage={imageSrc} />

            <Label>{t('name')}</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('enter_name')}
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs font-medium">{t('categories')}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-primary hover:text-primary"
                  onClick={() => setIsCategoryModalOpen(true)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  {t('create_category')}
                </Button>
              </div>
              <MultiSelect
                options={categoryOptions}
                selected={categoryIds}
                onChange={next => setCategoryIds(prev => (prev ? next : ['']))}
                placeholder={t('select_categories')}
                className="w-full"
              />
            </div>

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
              <Button type="submit" disabled={isLoading} className="bg-accent">
                {isLoading ? t('submeeting') : t('save')}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>

      <ChooseListModal
        open={openLessonModal}
        closeModal={() => setOpenLessonModal(false)}
        handleAdd={addLesson}
        array={lessons}
      />
      <CategoryModal
        openModal={isCategoryModalOpen}
        closeModal={() => setIsCategoryModalOpen(false)}
        selectCategory={handleNewCategoriesForFile}
        hideTrigger
      />
    </Dialog>
  );
}
