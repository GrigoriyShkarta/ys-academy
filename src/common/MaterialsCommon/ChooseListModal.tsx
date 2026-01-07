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
import { getModules } from '@/components/Materials/Modules/action';
import { useUser } from '@/providers/UserContext';

interface Props {
  open: boolean;
  closeModal: () => void;
  handleAdd: (lesson: { id: number; title: string }[]) => void;
  array?: { id: number; title: string }[];
  isCourse?: boolean;
}

export default function ChooseListModal({ open, closeModal, handleAdd, array, isCourse }: Props) {
  const [search, setSearch] = useState('');
  const [selectedLessons, setSelectedLessons] = useState<{ id: number; title: string }[]>([]);
  const [categoryList, seCategoryList] = useState<Category[] | undefined>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const t = useTranslations('Materials');
  const { user } = useUser();

  useEffect(() => {
    if (array) {
      setSelectedLessons(array);
    }
  }, [array, open]);

  const { data: list, isLoading } = useQuery({
    queryKey: ['lessons', search, selectedCategories, isCourse],
    queryFn: () => {
      if (isCourse) {
        return getModules({
          search,
          page: 'all',
          categories: selectedCategories,
        });
      }

      return getAllLessons({
        search,
        page: 'all',
        categories: selectedCategories,
      });
    },
    placeholderData: keepPreviousData,
    enabled: user?.role === 'super_admin',
  });

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

  const items = list?.data ?? list ?? ([] as { id: number; title: string }[]);
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
          checked={selectedLessons.length === list?.length && list?.length > 0}
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

          {item?.categories && item?.categories?.length > 2 && (
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
              <div className="h-[70vh] overflow-auto">
                <DataTable
                  data={list?.data ? list.data : list}
                  columns={columns}
                  multiSelectOptions={categoryOptions}
                  showAddButton
                  onMultiSelectChange={onMultiSelectChange}
                  onSearchChange={newSearch => {
                    setSearch(newSearch);
                  }}
                />
              </div>

              <div className="flex w-full justify-end gap-2">
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
