import { Dispatch, FormEvent, SetStateAction, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Course, ModuleDTO } from '@/components/Materials/utils/interfaces';
import { getCategories } from '@/components/Materials/Categories/action';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PhotoEditor from '@/common/PhotoEditor';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import MultiSelect from '@/common/MultiSelect';
import { Button } from '@/components/ui/button';
import ChooseListModal from '@/common/MaterialsCommon/ChooseListModal';
import SortableModule from '@/components/Materials/Course/CourseModal/SortableModule';
import { createCourse, updateCourse } from '@/components/Materials/Course/action';
import { Plus } from 'lucide-react';
import CategoryModal from '@/components/Materials/Categories/CategoryModal';
import { useUser } from '@/providers/UserContext';
import { uploadPhoto } from '@/components/Materials/Photo/action';
import ModuleModal from '@/components/Materials/Modules/ModuleModal';

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  course?: Course | null;
  selectCourse?: (id: number) => void;
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

export default function CourseModal({ open, setOpen, course, selectCourse }: Props) {
  const t = useTranslations('Materials');
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [name, setName] = useState<string>('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [modules, setModules] = useState<{ id: number; title: string }[]>([]);
  const [lessons, setLessons] = useState<{ id: number; title: string; order?: number }[]>([]);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [openModuleModal, setOpenModuleModal] = useState<boolean>(false);
  const [openLessonModal, setOpenLessonModal] = useState<boolean>(false);
  const [openCreateModuleModal, setOpenCreateModuleModal] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      if (course) {
        setName(course.title ?? '');
        setImageSrc(course.url ?? '');
        setModules(course.modules ?? []);
        setLessons(course.lessons ?? []);
        setCategoryIds((course.categories ?? []).map(c => String(c.id)));
      } else {
        setName('');
        setImageSrc('');
        setModules([]);
      }
    }
  }, [open, course]);

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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Перетаскивание модулей
  const handleModuleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setModules(items => {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);

      // Пересчитываем index
      return newItems.map((item, idx) => ({ ...item, index: idx }));
    });
  };

  // Перетаскивание уроков
  const handleLessonDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLessons(items => {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);

      // Пересчитываем order
      return newItems.map((item, idx) => ({ ...item, order: idx }));
    });
  };

  const mutation = useMutation({
    mutationFn: async (form: ModuleDTO) => {
      if (course) {
        return await updateCourse(form, +course.id);
      } else {
        return await createCourse(form);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      if (course?.id) {
        queryClient.invalidateQueries({ queryKey: ['course', course.id] });
      }
      if (!course && data?.id && selectCourse) {
        selectCourse(data.id);
      }
      setOpen(false);
    },
    onError: error => {
      console.error('Ошибка:', error);
      // alert(t('save_error'));
    },
    onSettled: () => {
      setName('');
      setModules([]);
      setLessons([]);
      setImageSrc('');
    },
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let finalImageSrc = imageSrc;
    let finalImagePublicId = '';

    if (imageSrc && imageSrc.startsWith('data:image')) {
      try {
        const file = dataURLtoFile(imageSrc, 'course_cover.jpg');
        const res = await uploadPhoto({
          content: file,
          title: name || 'Course Cover',
          categories: [],
          isOther: true,
        });
        finalImageSrc = res.url;
        finalImagePublicId = res.publicId;
      } catch (error) {
        console.error('Photo upload failed', error);
      }
    }

    const data = {
      title: name,
      url: finalImageSrc ?? '',
      publicImgId: finalImagePublicId,
      modules: modules.map((l, idx) => ({ id: l.id, index: idx })),
      lessons: lessons.map((l, idx) => ({ id: l.id, order: idx })),
      categories: categoryIds ?? [],
    };

    mutation.mutate(data);
  };

  const addModule = (newModules: { id: number; title: string }[]) => {
    const added = newModules.filter(nl => !modules.some(l => l.id === nl.id));
    setModules([...modules, ...added]);
    setOpenModuleModal(false);
  };

  const removeModule = (id: number) => {
    setModules(modules.filter(l => l.id !== id));
  };

  const addLesson = (newLessons: { id: number; title: string }[]) => {
    const added = newLessons.filter(nl => !lessons.some(l => l.id === nl.id));
    setLessons([...lessons, ...added]);
    setOpenLessonModal(false);
  };

  const removeLesson = (id: number) => {
    setLessons(lessons.filter(l => l.id !== id));
  };

  const handleClose = () => {
    setName('');
    setModules([]);
    setLessons([]);
    setImageSrc('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-full sm:max-w-[850px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(course ? 'edit_course' : 'create_course')}</DialogTitle>
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
              <Label>{t('modules')}</Label>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleModuleDragEnd}
              >
                <SortableContext
                  items={modules.map(l => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {modules.map(module => (
                    <SortableModule key={module.id} module={module} onRemove={removeModule} />
                  ))}
                </SortableContext>
              </DndContext>

              {modules.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">{t('no_modules_yet')}</p>
              )}
            </div>

            <Button
              type="button"
              onClick={() => setOpenModuleModal(true)}
              className="w-[200px] mx-auto bg-accent"
            >
              {t('add_module')}
            </Button>

            <div className="space-y-2">
              <Label>{t('lessons')}</Label>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleLessonDragEnd}
              >
                <SortableContext
                  items={lessons.map(l => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {lessons.map(lesson => (
                    <SortableModule key={lesson.id} module={lesson} onRemove={removeLesson} />
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

      <ChooseListModal
        open={openModuleModal}
        closeModal={() => setOpenModuleModal(false)}
        handleAdd={addModule}
        array={modules}
        isCourse
        showAddButton
        onAddClick={() => setOpenCreateModuleModal(true)}
      />

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

      <ModuleModal
        open={openCreateModuleModal}
        setOpen={setOpenCreateModuleModal}
      />
    </Dialog>
  );
}
