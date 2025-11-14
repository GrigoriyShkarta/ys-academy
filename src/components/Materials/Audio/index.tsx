'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { keepPreviousData } from '@tanstack/query-core';
import { IFile } from '@/components/Materials/utils/interfaces';
import { deleteAudios, getAudios } from '@/components/Materials/Audio/action';
import { Checkbox } from '@/components/ui/checkbox';
import useDragAndDropMaterial from '@/hooks/useDragAndDropMaterial';
import DrugOverflow from '@/common/DrugOverflow';
import DataTable from '@/common/Table';
import Loader from '@/common/Loader';
import TableActionMenu from '@/common/TableActioMenu';
import ConfirmModal from '@/common/ConfirmModal';
import { ArrowDown, ArrowUp, ChevronsUpDownIcon } from 'lucide-react';
import AudioModal from '@/components/Materials/Audio/AudioModal';

export default function AudioLayout() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<IFile | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState<number>();
  const [openConfirm, setOpenConfirm] = useState(false);
  const [sortBy, setSortBy] = useState<'title' | 'createdAt' | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>(undefined);
  const [addFiles, setAddFiles] = useState<File[] | null>(null);
  const t = useTranslations('Materials');
  const queryClient = useQueryClient();

  const { dragActive, onDragOver, onDragLeave, onDrop } = useDragAndDropMaterial({
    accept: ['audio/*'],
    onFiles: files => setAddFiles(files),
  });

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
    queryKey: ['audios', page, search, sortBy, sortOrder],
    queryFn: () => getAudios({ page, search, sortBy: sortBy ?? undefined, sortOrder }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (audios && audios.meta.totalPages < audios.meta.currentPage) {
      setPage(audios.meta.totalPages);
    }
  }, [audios]);

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (!audios) return;
    setSelectedIds(prev =>
      prev.length === audios.data.length ? [] : audios.data.map((a: IFile) => a.id)
    );
  }, [audios]);

  const toggleSort = useCallback(
    (field: 'title' | 'createdAt') => {
      setSortBy(prev => (prev === field ? prev : field));
      setSortOrder(prev => (sortBy === field ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'));
    },
    [sortBy]
  );

  const formatDateTime = useCallback((value?: string | Date | null) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }, []);

  const columns = useMemo(
    () => [
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
    [
      selectedIds,
      audios,
      toggleSelectAll,
      toggleSelect,
      formatDateTime,
      sortBy,
      sortOrder,
      t,
      toggleSort,
    ]
  );

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col gap-4">
      <AudioModal
        audio={selectedFile}
        setSelectedFile={setSelectedFile}
        uploadedFiles={addFiles}
        setUploadedFiles={setAddFiles}
      />

      {audios && (
        <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
          <DrugOverflow dragActive={dragActive} />

          <DataTable
            data={audios.data}
            columns={columns}
            totalPages={audios.meta.totalPages}
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
        </div>
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
