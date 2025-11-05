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
import AudioModal from '@/components/Materials/Audio/AudioModal';
import DrugOverlay from '@/common/MaterialsCommon/DrugOverlay';
import useDragAndDropMaterial from '@/common/MaterialsCommon/useDragAndDropMaterial';

interface Props {
  open: boolean;
  closeModal: () => void;
  handleAdd: (type: LessonItemType, content: string | File, bankId?: number) => void;
}

export default function ChooseAudioModal({ open, closeModal, handleAdd }: Props) {
  const [search, setSearch] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const { dragActive, onDragOver, onDragLeave, onDrop, file, setFile } = useDragAndDropMaterial();
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
        <DialogContent
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className="sm:max-w-[1024px] max-h-[90vh] overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable]"
        >
          <DialogTitle>
            <VisuallyHidden />
          </DialogTitle>

          <DrugOverlay dragActive={dragActive} />

          {isLoading ? (
            <Loader />
          ) : (
            <DataTable
              data={audios.data}
              columns={columns}
              showFromDevice
              handleClickFromDevice={() => setOpenModal(true)}
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

      <AudioModal
        openModal={openModal}
        closeModal={setOpenModal}
        fileFromDevice={file}
        setSelectedFile={f => setFile(f as File | null)}
        hideTrigger
      />
    </>
  );
}
