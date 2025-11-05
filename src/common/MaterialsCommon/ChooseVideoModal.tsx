import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getVideos } from '@/components/Materials/Video/action';
import { keepPreviousData } from '@tanstack/query-core';
import Loader from '@/common/Loader';
import { IFile, LessonItemType } from '@/components/Materials/utils/interfaces';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import MediaGallery from '@/common/MediaGallery';
import VideoModal from '@/components/Materials/Video/VideoModal';

interface Props {
  open: boolean;
  closeModal: () => void;
  handleAdd: (type: LessonItemType, content: string | File, bankId?: number) => void;
}

export default function ChooseVideoModal({ open, closeModal, handleAdd }: Props) {
  const [search, setSearch] = useState('');

  const { data: videos, isLoading } = useQuery({
    queryKey: ['videos', search],
    queryFn: () => getVideos({ search, page: 'all' }),
    placeholderData: keepPreviousData,
  });

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
            <MediaGallery
              data={videos.data}
              onSearchChange={newSearch => {
                setSearch(newSearch);
              }}
              handleClickItem={(item: IFile) => {
                handleAdd('video', item.url, item.id);
                closeModal();
              }}
              isPhoto={false}
              isOneSelectItem
            />
          )}
        </DialogContent>
      </Dialog>

      <VideoModal hideTrigger />
    </>
  );
}
