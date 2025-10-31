'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/query-core';
import Loader from '@/common/Loader';
import { deletePhotos, getPhotos } from '@/components/Materials/Photo/action';
import PhotoModal from '@/components/Materials/Photo/PhotoModal';
import { IFile } from '@/components/Materials/utils/interfaces';
import MediaGallery from '@/common/MediaGallery';

export default function PhotoLayout() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<IFile | null>(null);

  const { data: photos, isLoading } = useQuery({
    queryKey: ['photos', page, search],
    queryFn: () => getPhotos({ page, search }),
    placeholderData: keepPreviousData,
  });

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col gap-4">
      <PhotoModal photo={selectedFile} setSelectedFile={setSelectedFile} />

      {photos.data && (
        <MediaGallery
          data={photos.data}
          totalPages={photos.meta.totalPages}
          currentPage={photos.meta.currentPage}
          onPageChange={newPage => setPage(newPage)}
          handleEdit={(item: IFile) => setSelectedFile(item)}
          handleDelete={deletePhotos}
          onSearchChange={newSearch => {
            setPage(1);
            setSearch(newSearch);
          }}
          queryKey="photos"
        />
      )}
    </div>
  );
}
