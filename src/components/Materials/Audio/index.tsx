'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { keepPreviousData } from '@tanstack/query-core';
import { IFile } from '@/components/Materials/utils/interfaces';
import { deleteAudios, getAudios } from '@/components/Materials/Audio/action';
import { Checkbox } from '@/components/ui/checkbox';
import AudioModal from '@/components/Materials/Audio/AudioModal';
import DataTable from '@/common/Table';
import Loader from '@/common/Loader';
import TableActionMenu from '@/common/TableActioMenu';
import ConfirmModal from '@/common/ConfirmModal';

export default function AudioLayout() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<IFile | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState<number>();
  const [openConfirm, setOpenConfirm] = useState(false);
  const t = useTranslations('Materials');
  const queryClient = useQueryClient();

  const deleteAudio = useMutation({
    mutationFn: () => deleteAudios(selectedId ? [selectedId] : selectedIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['audios'] });
      setSelectedId(undefined);
      setSelectedIds([]);
      setOpenConfirm(false);
    },
  });

  const handleConfirmDelete = () => {
    deleteAudio.mutate();
  };

  const { data: audios, isLoading } = useQuery({
    queryKey: ['audios', page, search],
    queryFn: () => getAudios({ page, search }),
    placeholderData: keepPreviousData,
  });

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === audios.data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(audios.data.map((a: IFile) => a.id));
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  const columns = [
    {
      key: 'checkbox',
      label: (
        <Checkbox
          checked={selectedIds.length === audios?.data?.length && audios?.data?.length > 0}
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
      label: t('title'),
      render: (student: IFile) => <span>{student.title}</span>,
    },
    {
      key: 'audio',
      label: t('audio'),
      render: (item: IFile) => (
        <div className="flex items-center gap-2">
          <audio controls src={item.url} className="h-6 w-[400px]" />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <AudioModal audio={selectedFile} setSelectedFile={setSelectedFile} />

      {audios && (
        <DataTable
          data={audios.data}
          columns={columns}
          totalPages={audios.meta.totalPages}
          currentPage={page}
          onPageChange={newPage => setPage(newPage)}
          showDeleteIcon={selectedIds.length > 0}
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
          isLoading={deleteAudio.isPending}
        />
      )}
    </div>
  );
}
