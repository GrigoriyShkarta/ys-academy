import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAudios } from '@/components/Materials/Audio/action';
import { keepPreviousData } from '@tanstack/query-core';
import Loader from '@/common/Loader';
import { IFile, LessonItemType } from '@/components/Materials/utils/interfaces';
import { useTranslations } from 'next-intl';
import DataTable from '@/common/Table';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface Props {
  open: boolean;
  closeModal: () => void;
  handleAdd: (type: LessonItemType, content: string | File, bankId?: number) => void;
}

export default function ChooseAudioModal({ open, closeModal, handleAdd }: Props) {
  const [search, setSearch] = useState('');
  const t = useTranslations('Materials');

  const { data: audios, isLoading } = useQuery({
    queryKey: ['audios', search],
    queryFn: () => getAudios({ search, page: 'all' }),
    placeholderData: keepPreviousData,
  });

  const columns = [
    {
      key: 'title',
      label: t('title'),
      render: (student: IFile) => <span>{student?.title}</span>,
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
    <>
      <Dialog open={open} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[1024px] max-h-[90vh] overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable]">
          <DialogTitle>
            <VisuallyHidden />
          </DialogTitle>
          {isLoading ? (
            <Loader />
          ) : (
            <DataTable
              data={audios.data}
              columns={columns}
              onSearchChange={newSearch => {
                setSearch(newSearch);
              }}
              handleClickRow={(item: IFile) => {
                handleAdd('audio', item.url, item.id);
                closeModal();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
