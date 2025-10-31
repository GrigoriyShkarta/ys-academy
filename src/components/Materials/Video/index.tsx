'use client';

import { useState } from 'react';
import { IFile } from '@/components/Materials/utils/interfaces';
import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/query-core';
import { deleteVideos, getVideos } from '@/components/Materials/Video/action';
import Loader from '@/common/Loader';
import VideoModal from '@/components/Materials/Video/VideoModal';
import MediaGallery from '@/common/MediaGallery';

export default function VideoLayout() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<IFile | null>(null);

  const { data: videos, isLoading } = useQuery({
    queryKey: ['videos', page, search],
    queryFn: () => getVideos({ page, search }),
    placeholderData: keepPreviousData,
  });

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col gap-4">
      <VideoModal photo={selectedFile} setSelectedFile={setSelectedFile} />

      {videos.data && (
        <MediaGallery
          data={videos.data}
          totalPages={videos.meta.totalPages}
          currentPage={videos.meta.currentPage}
          handleDelete={deleteVideos}
          onPageChange={newPage => setPage(newPage)}
          handleEdit={(item: IFile) => setSelectedFile(item)}
          onSearchChange={newSearch => {
            setPage(1);
            setSearch(newSearch);
          }}
          isPhoto={false}
          queryKey="videos"
        />
      )}
    </div>
  );
}
