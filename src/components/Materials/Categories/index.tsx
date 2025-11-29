'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteCategory, getCategories } from '@/components/Materials/Categories/action';
import { keepPreviousData } from '@tanstack/query-core';
import { IFile } from '@/components/Materials/utils/interfaces';
import { Checkbox } from '@/components/ui/checkbox';
import TableActionMenu from '@/common/TableActioMenu';
import { ArrowDown, ArrowUp, ChevronsUpDownIcon } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import DataTable from '@/common/Table';
import ConfirmModal from '@/common/ConfirmModal';
import CategoryModal from '@/components/Materials/Categories/CategoryModal';

export default function CategoriesLayout() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<IFile>();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState<number>();
  const [openConfirm, setOpenConfirm] = useState(false);
  const [sortBy, setSortBy] = useState<'title' | 'createdAt' | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>(undefined);

  const t = useTranslations('Materials');
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', page, search, sortBy, sortOrder],
    queryFn: () => getCategories({ page, search, sortBy: sortBy ?? undefined, sortOrder }),
    placeholderData: keepPreviousData,
  });

  const deleteCategoriesMutation = useMutation({
    mutationFn: () => deleteCategory(selectedId ? [selectedId] : selectedIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      setSelectedId(undefined);
      setSelectedIds([]);
      setOpenConfirm(false);
    },
  });

  const handleConfirmDelete = () => {
    deleteCategoriesMutation.mutate();
  };

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (!categories) return;
    setSelectedIds(prev =>
      prev.length === categories.data.length ? [] : categories.data.map((a: IFile) => a.id)
    );
  }, [categories]);

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
            checked={
              selectedIds.length === categories?.data?.length && categories?.data?.length > 0
            }
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
            handleEdit={() => setSelectedFile(item)}
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
        render: (category: IFile) => (
          <div
            className="p-1 rounded-xl w-fit leading-3.5"
            style={{ backgroundColor: category?.color ?? '' }}
          >
            {category.title}
          </div>
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
        render: (item: IFile) => <span>{formatDateTime(item.createdAt)}</span>,
      },
    ],
    [selectedIds, categories, toggleSelectAll, toggleSelect, sortBy, sortOrder, t, toggleSort]
  );

  return (
    <div className="flex flex-col gap-4 p-4 mt-18 sm:mt-0">
      <CategoryModal category={selectedFile} />
      {categories && (
        <DataTable
          data={categories.data}
          columns={columns}
          totalPages={categories.meta.totalPages}
          currentPage={page}
          onPageChange={newPage => setPage(newPage)}
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
          isLoading={deleteCategoriesMutation.isPending}
        />
      )}
    </div>
  );
}
