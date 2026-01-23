'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/query-core';
import { IFile, Subscription } from '@/components/Materials/utils/interfaces';
import { Checkbox } from '@/components/ui/checkbox';
import TableActionMenu from '@/common/TableActioMenu';
import { ArrowDown, ArrowUp, ChevronsUpDownIcon } from 'lucide-react';
import DataTable from '@/common/Table';
import ConfirmModal from '@/common/ConfirmModal';
import { deleteSubscriptions, getSubscriptions } from '@/components/Materials/Subscriptions/action';
import Loader from '@/common/Loader';
import SubscriptionModal from '@/components/Materials/Subscriptions/SubscriptionModal';

export default function SubscriptionsLayout() {
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

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['subscriptions', page, search, sortBy, sortOrder],
    queryFn: () => getSubscriptions({ page, search, sortBy: sortBy ?? undefined, sortOrder }),
    placeholderData: keepPreviousData,
  });

  const deleteSubscriptionsMutation = useMutation({
    mutationFn: () => deleteSubscriptions(selectedId ? [selectedId] : selectedIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setSelectedId(undefined);
      setSelectedIds([]);
      setOpenConfirm(false);
    },
  });

  const handleConfirmDelete = () => {
    deleteSubscriptionsMutation.mutate();
  };

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (!subscriptions) return;
    setSelectedIds(prev =>
      prev.length === subscriptions.data.length ? [] : subscriptions.data.map((a: IFile) => a.id)
    );
  }, [subscriptions]);

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
              selectedIds.length === subscriptions?.data?.length && subscriptions?.data?.length > 0
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
        render: (item: IFile) => item.title,
      },
      {
        key: 'price',
        label: t('price'),
        render: (item: IFile) => item?.price,
      },
      {
        key: 'lessons_count',
        label: t('lessons_count'),
        render: (item: IFile) => item?.lessons_count,
      },
    ],
    [selectedIds, subscriptions, toggleSelectAll, toggleSelect, sortBy, sortOrder, t, toggleSort]
  );

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col gap-4 p-4 mt-18 md:mt-0">
      <SubscriptionModal subscription={selectedFile as Subscription} />
      {subscriptions && subscriptions.data.length > 0 && (
        <DataTable
          data={subscriptions.data}
          columns={columns}
          totalPages={subscriptions.meta.totalPages}
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
          isLoading={deleteSubscriptionsMutation.isPending}
        />
      )}
    </div>
  );
}
