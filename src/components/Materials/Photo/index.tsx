'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/query-core';
import Loader from '@/common/Loader';
import { deletePhotos, getPhotos } from '@/components/Materials/Photo/action';
import PhotoModal from '@/components/Materials/Photo/PhotoModal';
import { IFile } from '@/components/Materials/utils/interfaces';
import MediaGallery from '@/common/MediaGallery';
import useDragAndDropMaterial from '@/hooks/useDragAndDropMaterial';
import DrugOverflow from '@/common/DrugOverflow';
import { getCategories } from '@/components/Materials/Categories/action';

export default function PhotoLayout() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<IFile | null>(null);
  const [addFiles, setAddFiles] = useState<File[] | null>(null);

  const { data: photos, isLoading } = useQuery({
    queryKey: ['photos', page, search, selectedCategories],
    queryFn: () => getPhotos({ page, search, categories: selectedCategories }),
    placeholderData: keepPreviousData,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories({ page: 'all' }),
  });

  const categoryOptions = (categories?.data ?? []).map((c: any) => ({
    value: String(c.id),
    label: c.title,
    color: c.color,
  }));

  const onMultiSelectChange = (selected: string[]) => {
    setSelectedCategories(selected);
  };

  useEffect(() => {
    if (photos && photos.meta.totalPages < photos.meta.currentPage) {
      setPage(photos.meta.totalPages);
    }
  }, [photos]);

  const { dragActive, onDragOver, onDragLeave, onDrop } = useDragAndDropMaterial({
    accept: ['image/*'],
    onFiles: files => {
      setAddFiles(files);
    },
  });

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col gap-4 p-4 mt-18 sm:mt-0">
      <PhotoModal
        photo={selectedFile}
        setSelectedFile={setSelectedFile}
        uploadedFiles={addFiles}
        setUploadedFiles={setAddFiles}
      />

      {photos.data && (
        <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
          <DrugOverflow dragActive={dragActive} />

          <MediaGallery
            data={photos?.data}
            totalPages={photos.meta.totalPages}
            currentPage={photos.meta.currentPage}
            multiSelectOptions={categoryOptions}
            onMultiSelectChange={onMultiSelectChange}
            onPageChange={newPage => setPage(newPage)}
            handleEdit={(item: IFile) => setSelectedFile(item)}
            handleDelete={deletePhotos}
            onSearchChange={newSearch => {
              setPage(1);
              setSearch(newSearch);
            }}
            queryKey="photos"
          />
        </div>
      )}
    </div>
  );
}
