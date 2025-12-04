import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/query-core';
import Loader from '@/common/Loader';
import { Category, IFile } from '@/components/Materials/utils/interfaces';
import { useTranslations } from 'next-intl';
import DataTable from '@/common/Table';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { getAllLessons } from '@/components/Materials/Lesson/action';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import Chip from '@/common/Chip';
import { CircleChevronRight } from 'lucide-react';
import CategoryListModal from '@/common/CategoryListModal';
import { getCategories } from '@/components/Materials/Categories/action';

interface Props {
  open: boolean;
  closeModal: () => void;
  handleAdd: (lesson: { id: number; title: string }[]) => void;
  lessonsArray?: { id: number; title: string }[];
}

export default function ChooseLessonModal({ open, closeModal, handleAdd, lessonsArray }: Props) {
  const [search, setSearch] = useState('');
  const [selectedLessons, setSelectedLessons] = useState<{ id: number; title: string }[]>([]);
  const [categoryList, seCategoryList] = useState<Category[] | undefined>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const t = useTranslations('Materials');

  useEffect(() => {
    if (lessonsArray) {
      setSelectedLessons(lessonsArray);
    }
  }, [lessonsArray, open]);

  const { data: lessons, isLoading } = useQuery({
    queryKey: ['lessons', search, selectedCategories],
    queryFn: () => getAllLessons({ search, page: 'all', categories: selectedCategories }),
    placeholderData: keepPreviousData,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories({ page: 'all' }),
  });

  const categoryOptions = (categories?.data ?? []).map((c: any) => ({
    value: String(c.id),
    label: c.title,
    color: c.color,
  }));

  const items = lessons?.data ?? lessons ?? ([] as { id: number; title: string }[]);
  const allSelected = selectedLessons.length === items.length && items.length > 0;

  const toggleSelect = (item: { id: number; title: string }) => {
    setSelectedLessons(prev =>
      prev.some(i => i.id === item.id) ? prev.filter(i => i.id !== item.id) : [...prev, item]
    );
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedLessons([]);
    } else {
      setSelectedLessons(items.map((a: IFile) => ({ id: a.id, title: a.title })));
    }
  };

  const onMultiSelectChange = (selected: string[]) => {
    setSelectedCategories(selected);
  };

  const columns = [
    {
      key: 'checkbox',
      label: (
        <Checkbox
          checked={selectedLessons.length === lessons?.length && lessons?.length > 0}
          onCheckedChange={toggleSelectAll}
        />
      ),
      render: (item: { id: number; title: string }) => (
        <Checkbox
          checked={selectedLessons.some(selected => selected.id === item.id)}
          onCheckedChange={() => toggleSelect(item)}
        />
      ),
    },
    {
      key: 'title',
      label: t('title'),
      render: (lesson: { id: number; title: string }) => <span>{lesson?.title}</span>,
    },
    {
      key: 'categories',
      label: t('categories'),
      render: (item: IFile) => (
        <div className="flex gap-1">
          {item?.categories &&
            item.categories
              .slice(0, 2)
              .map(category => <Chip key={category.id} category={category} />)}

          {item?.categories?.length > 2 && (
            <CircleChevronRight
              className="cursor-pointer"
              onClick={() => seCategoryList(item.categories)}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[1024px] max-h-[90vh] overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable]">
          <DialogTitle>
            <VisuallyHidden />
          </DialogTitle>
          {isLoading ? (
            <Loader />
          ) : (
            <>
              <DataTable
                data={lessons?.data}
                columns={columns}
                multiSelectOptions={categoryOptions}
                onMultiSelectChange={onMultiSelectChange}
                onSearchChange={newSearch => {
                  setSearch(newSearch);
                }}
              />
              <div className="flex w-full justify-end">
                <Button type="button" variant="ghost" onClick={closeModal}>
                  {t('cancel')}
                </Button>
                <Button
                  type="button"
                  className="bg-accent"
                  onClick={() => handleAdd(selectedLessons)}
                >
                  {t('add')}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <CategoryListModal list={categoryList} close={() => seCategoryList(undefined)} />
    </>
  );
}
