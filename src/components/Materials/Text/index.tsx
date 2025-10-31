'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { keepPreviousData } from '@tanstack/query-core';
import TextModal from '@/components/Materials/Text/TextModal';
import Loader from '@/common/Loader';
import { IFile, IText } from '@/components/Materials/utils/interfaces';
import { deleteTexts, getTexts } from '@/components/Materials/Text/action';
import { Checkbox } from '@/components/ui/checkbox';
import TableActionMenu from '@/common/TableActioMenu';
import { FileText } from 'lucide-react';
import DataTable from '@/common/Table';
import ConfirmModal from '@/common/ConfirmModal';
import PreviewModal from '@/common/PreviewModal';

export default function TextLayout() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedText, setSelectedText] = useState<IText | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState<number>();
  const [openConfirm, setOpenConfirm] = useState(false);
  const [previewText, setPreviewText] = useState<string | null>(null);

  const t = useTranslations('Materials');
  const queryClient = useQueryClient();

  const { data: texts, isLoading } = useQuery({
    queryKey: ['texts', page, search],
    queryFn: () => getTexts({ page, search }),
    placeholderData: keepPreviousData,
  });

  const deleteText = useMutation({
    mutationFn: () => deleteTexts(selectedId ? [selectedId] : selectedIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['texts'] });
      setSelectedId(undefined);
      setSelectedIds([]);
      setOpenConfirm(false);
    },
  });

  if (isLoading) return <Loader />;

  const handleConfirmDelete = () => {
    deleteText.mutate();
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === texts.data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(texts.data.map((a: IFile) => a.id));
    }
  };

  const columns = [
    {
      key: 'checkbox',
      label: (
        <Checkbox
          checked={selectedIds.length === texts.data.length && texts.data.length > 0}
          onCheckedChange={toggleSelectAll}
        />
      ),
      render: (item: IText) => (
        <Checkbox
          checked={selectedIds.includes(item.id)}
          onCheckedChange={() => toggleSelect(item.id)}
        />
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (item: IText) => (
        <TableActionMenu
          handleDelete={() => {
            setSelectedId(item.id);
            setOpenConfirm(true);
          }}
          handleEdit={() => setSelectedText(item)}
        />
      ),
    },
    {
      key: 'title',
      label: t('title'),
      render: (student: IText) => <span>{student.title}</span>,
    },
    {
      key: 'text',
      label: t('text'),
      render: (item: IText) => (
        <FileText className="w-6 h-6 cursor-pointer" onClick={() => setPreviewText(item.content)} />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <TextModal text={selectedText} setSelectedText={setSelectedText} />

      {texts && (
        <DataTable
          data={texts.data}
          columns={columns}
          totalPages={texts.meta.totalPages}
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
          isLoading={deleteText.isPending}
        />
      )}

      {previewText && (
        <PreviewModal
          open={!!previewText}
          setOpen={() => setPreviewText(null)}
          content={previewText}
        />
      )}
    </div>
  );
}
