'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { keepPreviousData } from '@tanstack/query-core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import ModuleModal from '@/components/Materials/Modules/ModuleModal';
import { deleteModule, getModules } from '@/components/Materials/Modules/action';
import { Category, Lesson, Module } from '@/components/Materials/utils/interfaces';
import Loader from '@/common/Loader';
import { getCategories } from '@/components/Materials/Categories/action';
import { useUser } from '@/providers/UserContext';
import DataTable from '@/common/Table';
import TableActionMenu from '@/common/TableActioMenu';
import ConfirmModal from '@/common/ConfirmModal';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDownIcon,
  CircleChevronRight,
  ClipboardList,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import Chip from '@/common/Chip';
import LessonsListModal from '@/common/LessonsListModal';
import CategoryListModal from '@/common/CategoryListModal';
import ConfirmTextChild from '@/common/ConfirmTextChild';
import Link from 'next/link';

export default function ModulesLayout() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<Module | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState<number>();
  const [isCreateModule, setIsCreateModule] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [sortBy, setSortBy] = useState<'title' | 'createdAt' | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>(undefined);
  const [lessonsList, setLessonsList] = useState<Lesson[] | undefined>([]);
  const [categoryList, setCategoryList] = useState<Category[] | undefined>([]);

  const t = useTranslations('Materials');
  const { user } = useUser();
  const queryClient = useQueryClient();

  const { data: modules, isLoading } = useQuery({
    queryKey: ['modules', page, search, sortBy, sortOrder, selectedCategories],
    queryFn: () => getModules({ page, search, categories: selectedCategories, sortBy, sortOrder }),
    placeholderData: keepPreviousData,
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (id: number) => deleteModule(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['modules'] });
      setSelectedId(undefined);
      setSelectedIds([]);
      setOpenConfirm(false);
    },
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

  useEffect(() => {
    if (modules && modules.meta && modules.meta.totalPages < modules.meta.currentPage) {
      setPage(modules.meta.totalPages);
    }
  }, [modules]);

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (!modules) return;
    const data = Array.isArray(modules) ? modules : modules.data;
    if (!data) return;
    setSelectedIds(prev => (prev.length === data.length ? [] : data.map((a: any) => a.id)));
  }, [modules]);

  const toggleSort = useCallback(
    (field: 'title' | 'createdAt') => {
      setSortBy(prev => (prev === field ? prev : field));
      setSortOrder(prev => (sortBy === field ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'));
    },
    [sortBy]
  );

  const columns = useMemo(() => {
    const data = Array.isArray(modules) ? modules : modules?.data;
    return [
      {
        key: 'checkbox',
        label: (
          <Checkbox
            checked={selectedIds.length === data?.length && data?.length > 0}
            onCheckedChange={toggleSelectAll}
          />
        ),
        render: (item: any) => (
          <Checkbox
            checked={selectedIds.includes(item.id)}
            onCheckedChange={() => toggleSelect(item.id)}
          />
        ),
      },
      {
        key: 'actions',
        label: '',
        render: (item: any) => (
          <TableActionMenu
            handleDelete={() => {
              setSelectedId(item.id);
              setOpenConfirm(true);
            }}
            handleEdit={() => {
              setSelectedFile(item);
              setIsCreateModule(true);
            }}
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
        render: (item: any) => <Link href={`/main/materials/modules/${item.id}`}>{item.title}</Link>,
      },
      {
        key: 'categories',
        label: t('categories'),
        render: (item: any) => (
          <div className="flex gap-1">
            {item?.categories &&
              item.categories
                .slice(0, 2)
                .map((category: any) => <Chip key={category.id} category={category} />)}

            {item?.categories && item?.categories?.length > 2 && (
              <CircleChevronRight
                className="cursor-pointer"
                onClick={() => setCategoryList(item.categories)}
              />
            )}
          </div>
        ),
      },
      {
        key: 'lessons',
        label: t('lessons'),
        render: (item: any) =>
          item?.lessons &&
          item?.lessons?.length > 0 && (
            <ClipboardList
              onClick={() => setLessonsList(item.lessons)}
              className="cursor-pointer"
            />
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
            {t('downloaded')}
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
        render: (item: any) => <span>{item.createdAt ? formatDateTime(item.createdAt) : '-'}</span>,
      },
    ];
  }, [selectedIds, modules, toggleSelectAll, toggleSelect, sortBy, sortOrder, t, toggleSort]);

  const handleConfirmDelete = () => {
    if (selectedId) {
      deleteModuleMutation.mutate(selectedId);
    } else if (selectedIds.length > 0) {
      // Note: deleteModule currently only supports single ID
      // If plural delete is needed, it should be added to action.ts
      selectedIds.forEach(id => deleteModuleMutation.mutate(id));
    }
  };

  if (isLoading) return <Loader />;

  const tableData = Array.isArray(modules) ? modules : modules?.data || [];
  const totalPages = Array.isArray(modules) ? 1 : modules?.meta?.totalPages || 1;

  return (
    <div className="flex flex-col gap-4 p-4 mt-18 md:mt-0">
      <Button
        className="bg-accent w-[240px] mx-auto"
        onClick={() => {
          setSelectedFile(null);
          setIsCreateModule(true);
        }}
      >
        {t('create_module')}
      </Button>

      {tableData && (
        <DataTable
          data={tableData}
          columns={columns}
          totalPages={totalPages}
          currentPage={page}
          multiSelectOptions={categoryOptions}
          onPageChange={newPage => setPage(newPage)}
          showDeleteIcon={selectedIds.length > 0}
          selectedIds={selectedIds}
          handleDelete={() => setOpenConfirm(true)}
          onMultiSelectChange={onMultiSelectChange}
          onSearchChange={newSearch => {
            setPage(1);
            setSearch(newSearch);
          }}
        />
      )}

      <ModuleModal open={isCreateModule} setOpen={setIsCreateModule} module={selectedFile} />

      {openConfirm && (
        <ConfirmModal
          open={openConfirm}
          confirmAction={handleConfirmDelete}
          setOnClose={() => setOpenConfirm(false)}
          isLoading={deleteModuleMutation.isPending}
        >
          <ConfirmTextChild />
        </ConfirmModal>
      )}

      <LessonsListModal list={lessonsList} close={() => setLessonsList(undefined)} />
      <CategoryListModal list={categoryList} close={() => setCategoryList(undefined)} />
    </div>
  );
}
