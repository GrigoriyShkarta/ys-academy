import { Dispatch, SetStateAction, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/components/Materials/Categories/action';
import { getModules } from '@/components/Materials/Modules/action';
import { getCourses } from '@/components/Materials/Course/action';
import { IFile } from '@/components/Materials/utils/interfaces';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import MultiSelect from '@/common/MultiSelect';
import CategoryModal from '@/components/Materials/Categories/CategoryModal';
import { FormFooter } from '@/common/ModalFooter';
import { useUser } from '@/providers/UserContext';
import ModuleModal from '../../Modules/ModuleModal';
import CourseModal from '../../Course/CourseModal';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  selectedCategories: string[];
  setSelectedCategories: Dispatch<SetStateAction<string[]>>;
  selectedModules: string[];
  setSelectedModules: Dispatch<SetStateAction<string[]>>;
  selectedCourses: string[];
  setSelectedCourses: Dispatch<SetStateAction<string[]>>;
  isLoading: boolean;
}

export default function LessonSaveModal({
  onClose,
  onSave,
  open,
  selectedCategories,
  selectedModules,
  selectedCourses,
  setSelectedCategories,
  setSelectedModules,
  setSelectedCourses,
  isLoading,
}: Props) {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const { user } = useUser();

  const t = useTranslations('Materials');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories({ page: 'all' }),
    enabled: user?.role === 'super_admin',
  });

  const { data: modules } = useQuery({
    queryKey: ['modules'],
    queryFn: () => getModules({ search: '' }),
  });

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => getCourses({ search: '' }),
  });

  console.log('courses', courses)

  const categoryOptions = (categories?.data ?? []).map((c: IFile) => ({
    value: String(c.id),
    label: c.title,
    color: c.color,
  }));

  const moduleOptions = (modules ?? []).map((c: IFile) => ({
    value: String(c.id),
    label: c.title,
  }));

  const courseOptions = (courses ?? []).map((c: any) => ({
    value: String(c.id),
    label: c.title,
  }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] min-h-[400px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('save_lesson')}</DialogTitle>
        </DialogHeader>

        {/*<div className="flex flex-col justify-between h-full"></div>*/}
        <div className="space-y-6">
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
              selected={selectedCategories}
              onChange={next => setSelectedCategories(next)}
              placeholder={t('select_categories')}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-xs font-medium">{t('add_to_module')}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-primary hover:text-primary"
                onClick={() => setIsModuleModalOpen(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                {t('create_module')}
              </Button>
            </div>
            
            <MultiSelect
              options={moduleOptions}
              selected={selectedModules}
              onChange={next => setSelectedModules(next)}
              placeholder={t('select_categories')}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-xs font-medium">{t('add_to_course') || 'Add to course'}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-primary hover:text-primary"
                onClick={() => setIsCourseModalOpen(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                {t('create_course') || 'Create course'}
              </Button>
            </div>
            
            <MultiSelect
              options={courseOptions}
              selected={selectedCourses}
              onChange={next => setSelectedCourses(next)}
              placeholder={t('select_categories')}
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-end space-x-2">
          <FormFooter
            isLoading={isLoading}
            onCancel={onClose}
            onSave={onSave}
            onSubmitText={t('save')}
            onCancelText={t('cancel')}
            loadingText={t('uploading')}
          />
        </DialogFooter>
      </DialogContent>

      <CategoryModal
        openModal={isCategoryModalOpen}
        closeModal={() => {
          setIsCategoryModalOpen(false);
        }}
        selectCategory={next =>
          setSelectedCategories(prev => Array.from(new Set([...prev, ...next])))
        }
        hideTrigger
      />

      <ModuleModal
        open={isModuleModalOpen}
        setOpen={() => {
          setIsModuleModalOpen(false);
        }}
        selectModule={next => setSelectedModules(prev => [...prev, String(next)])}
      />

      <CourseModal
        open={isCourseModalOpen}
        setOpen={setIsCourseModalOpen}
        selectCourse={next => setSelectedCourses(prev => [...prev, String(next)])}
      />
    </Dialog>
  );
}
