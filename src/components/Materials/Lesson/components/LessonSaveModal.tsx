import { Dispatch, SetStateAction, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/components/Materials/Categories/action';
import { getModules } from '@/components/Materials/Modules/action';
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

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  selectedCategories: string[];
  setSelectedCategories: Dispatch<SetStateAction<string[]>>;
  selectedModules: string[];
  setSelectedModules: Dispatch<SetStateAction<string[]>>;
  isLoading: boolean;
}

export default function LessonSaveModal({
  onClose,
  onSave,
  open,
  selectedCategories,
  selectedModules,
  setSelectedCategories,
  setSelectedModules,
  isLoading,
}: Props) {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const t = useTranslations('Materials');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories({ page: 'all' }),
  });

  const { data: modules } = useQuery({
    queryKey: ['modules'],
    queryFn: () => getModules({ search: '' }),
  });

  const categoryOptions = (categories?.data ?? []).map((c: IFile) => ({
    value: String(c.id),
    label: c.title,
    color: c.color,
  }));

  const moduleOptions = (modules ?? []).map((c: IFile) => ({
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
        <div>
          <div className="mb-6">
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
              onChange={next =>
                setSelectedCategories(prev => Array.from(new Set([...prev, ...next])))
              }
              placeholder={t('select_categories')}
              className="w-full"
            />
          </div>

          <div>
            <Label className="mb-3">{t('add_to_module')}</Label>
            <MultiSelect
              options={moduleOptions}
              selected={selectedModules}
              onChange={next => setSelectedModules(prev => Array.from(new Set([...prev, ...next])))}
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
    </Dialog>
  );
}
