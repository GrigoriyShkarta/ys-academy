import { Loader, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MultiSelect from '@/common/MultiSelect';
import { useTranslations } from 'next-intl';
import { Dispatch, SetStateAction, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/components/Materials/Categories/action';
import CategoryModal from '@/components/Materials/Categories/CategoryModal';
import { useUser } from '@/providers/UserContext'; // ← твоя модалка

// ... остальные импорты
interface Props {
  fetchingIdx?: number | null;
  uploadedFiles: File[];
  setUploadedFiles: Dispatch<SetStateAction<File[]>>;
}

export default function AudioPreviewList({ fetchingIdx, uploadedFiles, setUploadedFiles }: Props) {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [activeFileIndex, setActiveFileIndex] = useState<number | null>(null);
  const t = useTranslations('Materials');
  const { user } = useUser();

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

  const handleTitleChange = (index: number, value: string) => {
    setUploadedFiles(prev => {
      const copy = [...prev];
      const file = copy[index];
      const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '';
      copy[index] = new File([file], value + ext, { type: file.type });
      (copy[index] as any).title = value;
      return copy;
    });
  };

  const handleCategoryChange = (index: number, next: string[]) => {
    setUploadedFiles(prev => {
      const copy = [...prev];
      (copy[index] as any).categories = next;
      return copy;
    });
  };

  const handleNewCategoriesForFile = (newCategories?: string[]) => {
    if (activeFileIndex === null) return;
    if (!newCategories) return;

    setUploadedFiles(prev => {
      const copy = [...prev];
      const file = copy[activeFileIndex];
      const existing = (file as any).categories || [];
      (copy[activeFileIndex] as any).categories = [...new Set([...existing, ...newCategories])];
      return copy;
    });
    setActiveFileIndex(null);
  };

  const handleDelete = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateNewCategory = (idx: number) => {
    setActiveFileIndex(idx);
    setIsCategoryModalOpen(true);
  };

  if (uploadedFiles.length === 0) return null;

  return (
    <>
      <div className="mt-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            {t('uploaded_audio')}: <span className="font-bold">{uploadedFiles.length}</span>/9
          </p>
        </div>

        {uploadedFiles.map((file, idx) => {
          const customTitle = (file as any).title;
          const displayTitle = customTitle ?? file.name.replace(/\.[^/.]+$/, '');
          const selectedCategories = (file as any).categories ?? [];

          return (
            <div
              key={idx}
              className={`relative rounded-xl border bg-card p-5 shadow-sm transition-all
                ${fetchingIdx === idx ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}
            >
              {/* Загрузка */}
              {fetchingIdx === idx && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                  <Loader className="w-10 h-10 animate-spin text-primary" />
                </div>
              )}

              <div className="space-y-4">
                {/* Название */}
                <div>
                  <Label htmlFor={`title-${idx}`} className="text-xs font-medium">
                    {t('audio_title')}
                  </Label>
                  <Input
                    id={`title-${idx}`}
                    value={displayTitle}
                    onChange={e => handleTitleChange(idx, e.target.value)}
                    placeholder={t('enterTitle')}
                    maxLength={80}
                    className="mt-1.5"
                  />
                </div>

                {/* Категории */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label htmlFor={`categories-${idx}`} className="text-xs font-medium">
                      {t('categories')}
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-primary hover:text-primary"
                      onClick={() => handleCreateNewCategory(idx)}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      {t('create_category')}
                    </Button>
                  </div>
                  <MultiSelect
                    options={categoryOptions}
                    selected={selectedCategories}
                    onChange={next => handleCategoryChange(idx, next)}
                    placeholder={t('select_categories')}
                    className="w-full"
                  />
                </div>

                {/* Плеер + удалить */}
                <div className="flex items-center justify-between gap-4">
                  <audio src={URL.createObjectURL(file)} controls className="flex-1 max-w-md" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(idx)}
                    className="shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Модалка создания категории */}
      <CategoryModal
        openModal={isCategoryModalOpen}
        closeModal={() => setIsCategoryModalOpen(false)}
        selectCategory={handleNewCategoriesForFile}
        hideTrigger
      />
    </>
  );
}
