'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/query-core';
import { Button } from '@/components/ui/button';
import EditPlace from '@/components/Materials/Lesson/EditPlace';
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDownIcon,
  CircleChevronRight,
  ClipboardList,
} from 'lucide-react';
import { deleteLesson, getAllLessons } from '@/components/Materials/Lesson/action';
import { Checkbox } from '@/components/ui/checkbox';
import { Category, IFile } from '@/components/Materials/utils/interfaces';
import TableActionMenu from '@/common/TableActioMenu';
import { formatDateTime } from '@/lib/utils';
import DataTable from '@/common/Table';
import ConfirmModal from '@/common/ConfirmModal';
import Chip from '@/common/Chip';
import LessonsListModal from '@/common/LessonsListModal';
import CategoryListModal from '@/common/CategoryListModal';
import { getCategories } from '@/components/Materials/Categories/action';
import { useUser } from '@/providers/UserContext';
import Loader from '@/common/Loader';

export default function LessonsLayout() {
  const [page, setPage] = useState(1);
  const [isEditPlace, setIsEditPlace] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState<number>();
  const [openConfirm, setOpenConfirm] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'title' | 'createdAt' | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>(undefined);
  const [categoryList, seCategoryList] = useState<Category[] | undefined>([]);
  const [moduleList, setModuleList] = useState<Category[] | undefined>([]);
  const [search, setSearch] = useState('');
  const t = useTranslations('Materials');
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = useUser();

  const { data: lessons, isLoading } = useQuery({
    queryKey: ['lessons', page, search, sortBy, sortOrder, selectedCategories],
    queryFn: () =>
      getAllLessons({
        page,
        search,
        sortBy: sortBy ?? undefined,
        sortOrder,
        categories: selectedCategories,
      }),
    placeholderData: keepPreviousData,
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

  const onMultiSelectChange = (selected: string[]) => {
    setSelectedCategories(selected);
  };

  const deleteLessonMutation = useMutation({
    mutationFn: () => deleteLesson(selectedId ? [selectedId] : selectedIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['lessons'] });
      setSelectedId(undefined);
      setSelectedIds([]);
      setOpenConfirm(false);
    },
  });

  const handleConfirmDelete = () => {
    deleteLessonMutation.mutate();
  };

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (!lessons) return;
    setSelectedIds(prev =>
      prev.length === lessons.data.length ? [] : lessons.data.map((a: IFile) => a.id)
    );
  }, [lessons]);

  const toggleSort = useCallback(
    (field: 'title' | 'createdAt') => {
      setSortBy(prev => (prev === field ? prev : field));
      setSortOrder(prev => (sortBy === field ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'));
    },
    [sortBy]
  );

  const columns = useMemo(
    () => [
      {
        key: 'checkbox',
        label: (
          <Checkbox
            checked={selectedIds.length === lessons?.data?.length && lessons?.data?.length > 0}
            onCheckedChange={toggleSelectAll}
          />
        ),
        render: (item: IFile) => (
          <Checkbox
            checked={selectedIds.includes(item.id)}
            onCheckedChange={() => toggleSelect(item.id)}
          />
        ),
      },
      {
        key: 'actions',
        label: '',
        render: (item: IFile) => (
          <TableActionMenu
            handleDelete={() => {
              setSelectedId(item.id);
              setOpenConfirm(true);
            }}
            handleEdit={() => router.push(`/main/materials/lessons/${item.id}?isEdit=true`)}
          />
        ),
      },
      {
        key: 'title',
        label: (
          <button
            type="button"
            onClick={() => toggleSort('title')}
            className="flex items-center gap-2"
          >
            {t('title')}
            {sortBy === 'title' ? (
              sortOrder === 'asc' ? (
                <ArrowUp size={14} />
              ) : (
                <ArrowDown size={14} />
              )
            ) : (
              <ChevronsUpDownIcon size={14} />
            )}
          </button>
        ),
        render: (lesson: IFile) => (
          <Link href={`/main/materials/lessons/${lesson.id}`}>{lesson.title}</Link>
        ),
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
      {
        key: 'modules',
        label: t('modules'),
        render: (item: IFile) =>
          item?.modules &&
          item?.modules?.length > 0 && (
            <ClipboardList onClick={() => setModuleList(item.modules)} className="cursor-pointer" />
          ),
      },
      {
        key: 'created_at',
        label: (
          <button
            type="button"
            onClick={() => toggleSort('createdAt')}
            className="flex items-center gap-2"
          >
            {t('created')}
            {sortBy === 'createdAt' ? (
              sortOrder === 'asc' ? (
                <ArrowUp size={14} />
              ) : (
                <ArrowDown size={14} />
              )
            ) : (
              <ChevronsUpDownIcon size={14} />
            )}
          </button>
        ),
        render: (item: IFile) => <span>{formatDateTime(item.createdAt)}</span>,
      },
    ],
    [selectedIds, lessons, toggleSelectAll, toggleSelect, sortBy, sortOrder, t, toggleSort]
  );

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col gap-4 p-4 mt-18 sm:mt-0">
      {!isEditPlace && (
        <Button className="bg-accent w-[240px] mx-auto" onClick={() => setIsEditPlace(true)}>
          {t('createLesson')}
        </Button>
      )}

      {isEditPlace && <EditPlace setIsEditPlace={setIsEditPlace} />}
      {!isEditPlace && lessons?.data?.length > 0 && (
        <DataTable
          data={lessons.data}
          columns={columns}
          totalPages={lessons?.meta?.totalPages}
          currentPage={page}
          onPageChange={newPage => setPage(newPage)}
          multiSelectOptions={categoryOptions}
          onMultiSelectChange={onMultiSelectChange}
          showDeleteIcon={selectedIds.length > 0}
          selectedIds={selectedIds}
          handleDelete={() => setOpenConfirm(true)}
          onSearchChange={newSearch => {
            setPage(1);
            setSearch(newSearch);
          }}
        />
      )}
      {openConfirm && (
        <ConfirmModal
          open={openConfirm}
          confirmAction={handleConfirmDelete}
          setOnClose={() => setOpenConfirm(false)}
          isLoading={deleteLessonMutation.isPending}
        />
      )}

      <LessonsListModal list={moduleList} close={() => setModuleList(undefined)} />
      <CategoryListModal list={categoryList} close={() => seCategoryList(undefined)} />
    </div>
  );
}
