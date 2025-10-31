import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPhotos } from '@/components/Materials/Photo/action';
import { keepPreviousData } from '@tanstack/query-core';
import Loader from '@/common/Loader';
import { IFile, LessonItemType } from '@/components/Materials/utils/interfaces';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import MediaGallery from '@/common/MediaGallery';

interface Props {
  open: boolean;
  closeModal: () => void;
  handleAdd: (type: LessonItemType, content: string | File, bankId?: number) => void;
}

export default function ChoosePhotoModal({ open, closeModal, handleAdd }: Props) {
  const [search, setSearch] = useState('');

  const { data: photos, isLoading } = useQuery({
    queryKey: ['photos', search],
    queryFn: () => getPhotos({ search, page: 'all' }),
    placeholderData: keepPreviousData,
  });

  return (
    <Dialog open={open} onOpenChange={closeModal}>
      <DialogContent className="sm:max-w-[1024px] max-h-[90vh] overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable]">
        <DialogTitle>
          <VisuallyHidden />
        </DialogTitle>
        {isLoading ? (
          <Loader />
        ) : (
          <MediaGallery
            data={photos.data}
            onSearchChange={newSearch => {
              setSearch(newSearch);
            }}
            handleClickItem={(item: IFile) => {
              handleAdd('image', item.url, item.id);
              closeModal();
            }}
            isOneSelectItem
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
