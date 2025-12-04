'use client';

import { useEffect, useState } from 'react';
import { IFile } from '@/components/Materials/utils/interfaces';
import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/query-core';
import { deleteVideos, getVideos } from '@/components/Materials/Video/action';
import Loader from '@/common/Loader';
import VideoModal from '@/components/Materials/Video/VideoModal';
import useDragAndDropMaterial from '@/hooks/useDragAndDropMaterial';
import MediaGallery from '@/common/MediaGallery';
import DrugOverflow from '@/common/DrugOverflow';
import { getCategories } from '@/components/Materials/Categories/action';

export default function VideoLayout() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<IFile | null>(null);
  const [addFiles, setAddFiles] = useState<File[] | null>(null);

  const { data: videos, isLoading } = useQuery({
    queryKey: ['videos', page, search, selectedCategories],
    queryFn: () => getVideos({ page, search, categories: selectedCategories }),
    placeholderData: keepPreviousData,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories({ page: 'all' }),
  });

  const onMultiSelectChange = (selected: string[]) => {
    setSelectedCategories(selected);
  };

  const categoryOptions = (categories?.data ?? []).map((c: any) => ({
    value: String(c.id),
    label: c.title,
    color: c.color,
  }));

  useEffect(() => {
    if (videos && videos.meta.totalPages < videos.meta.currentPage) {
      setPage(videos.meta.totalPages);
    }
  }, [videos]);

  const { dragActive, onDragOver, onDragLeave, onDrop } = useDragAndDropMaterial({
    accept: ['video/*'],
    onFiles: files => {
      setAddFiles(files);
    },
  });

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col gap-4 p-4 mt-18 sm:mt-0">
      <VideoModal
        video={selectedFile}
        setSelectedFile={setSelectedFile}
        newFiles={addFiles}
        setNewFiles={setAddFiles}
      />

      {videos.data && (
        <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
          <DrugOverflow dragActive={dragActive} />

          <MediaGallery
            data={videos?.data}
            totalPages={videos.meta.totalPages}
            currentPage={videos.meta.currentPage}
            handleDelete={deleteVideos}
            multiSelectOptions={categoryOptions}
            onMultiSelectChange={onMultiSelectChange}
            onPageChange={newPage => setPage(newPage)}
            handleEdit={(item: IFile) => setSelectedFile(item)}
            onSearchChange={newSearch => {
              setPage(1);
              setSearch(newSearch);
            }}
            isPhoto={false}
            queryKey="videos"
          />
        </div>
      )}
    </div>
  );
}
