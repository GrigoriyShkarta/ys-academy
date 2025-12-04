import { FormEvent, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { IFile } from '@/components/Materials/utils/interfaces';
import { createCategory } from '@/components/Materials/Categories/action';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormFooter } from '@/common/ModalFooter';
import { Trash2 } from 'lucide-react';

interface Props {
  hideTrigger?: boolean;
  openModal?: boolean;
  closeModal?: () => void;
  selectCategory?: (ids: []) => void;
  category?: IFile | null;
}

export default function CategoryModal({
  category,
  closeModal,
  openModal,
  selectCategory,
  hideTrigger = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const t = useTranslations('Materials');
  const [categories, setCategories] = useState<{ title: string; color?: string }[]>([
    { title: '', color: '' },
  ]);
  const [oneTitleMod, setOneTitleMod] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const valid =
      categories.length > 0 && categories.every(cat => (cat.title ?? '').trim().length > 0);
    setIsValid(valid);
  }, [categories]);

  useEffect(() => {
    if (category) {
      setCategories([{ title: category.title, color: category?.color }]);
      setOneTitleMod(true);
      setOpen(true);
    } else {
      setOneTitleMod(false);
      setCategories([{ title: '', color: '' }]);
    }
  }, [category, open]);

  useEffect(() => {
    if (openModal) {
      setOpen(true);
    }
  }, [openModal]);

  const handleClose = (value: boolean) => {
    setOpen(value);
    closeModal && closeModal();
    setCategories([]);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    if (oneTitleMod) {
    } else {
      const newCategories = await createCategory(categories);
      if (selectCategory) {
        const categoryIds = newCategories.map((cat: IFile) => String(cat.id));
        selectCategory(categoryIds);
      }
    }
    await queryClient.invalidateQueries({ queryKey: ['categories'] });

    setIsLoading(false);
    handleClose(false);
  };

  const handleAdd = () => {
    setCategories(prevTitles => [...prevTitles, { title: '', color: '' }]);
  };

  const deleteTag = (idx: number) => {
    setCategories(prevState => prevState.filter((_, i) => i !== idx));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button className="bg-accent w-[240px] mx-auto">{t('creat_category')}</Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(oneTitleMod ? 'edit_category' : 'creat_category')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={e => onSubmit(e)} className="space-y-4 flex flex-col">
          {categories.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-center mt-2">
              <Input
                value={item.title}
                placeholder={t('enterTitle')}
                onChange={e => {
                  const newValue = e.target.value;
                  setCategories(prev =>
                    prev.map((cat, i) => (i === idx ? { ...cat, title: newValue } : cat))
                  );
                }}
              />
              <div className="relative">
                <input
                  type="color"
                  value={item.color} // твой primary цвет по умолчанию
                  onChange={e => {
                    setCategories(prev =>
                      prev.map((cat, i) => (i === idx ? { ...cat, color: e.target.value } : cat))
                    );
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className={`w-10 h-10 rounded-lg ring-transparent border
                  hover:ring-primary transition-all cursor-pointer flex items-center justify-center`}
                  style={{ backgroundColor: item.color ?? 'transparent' }}
                >
                  {/* Маленький белый кружок в центре, если цвет светлый */}
                  <div className="w-full h-full rounded-lg ring-1 ring-inset ring-black/10" />
                </div>
              </div>
              <Button
                type="button"
                className="bg-accent"
                disabled={!item.color}
                onClick={() =>
                  setCategories(prev =>
                    prev.map((cat, i) => (i === idx ? { ...cat, color: '' } : cat))
                  )
                }
              >
                {t('remove_color')}
              </Button>
              <Button type="button" variant="destructive" onClick={() => deleteTag(idx)}>
                <Trash2 />
              </Button>
            </div>
          ))}
          {!oneTitleMod && (
            <Button className="w-fit mx-auto bg-accent" type="button" onClick={handleAdd}>
              {t('add_category')}
            </Button>
          )}

          <DialogFooter className="flex justify-end space-x-2">
            <FormFooter
              isLoading={isLoading}
              isValid={isValid}
              onCancel={() => handleClose(false)}
              onSubmitText={oneTitleMod ? t('edit') : t('add')}
              onCancelText={t('cancel')}
              loadingText={t('uploading')}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
