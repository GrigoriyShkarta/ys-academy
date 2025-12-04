import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPhotos } from '@/components/Materials/Photo/action';
import { keepPreviousData } from '@tanstack/query-core';
import Loader from '@/common/Loader';
import { Category, IFile, LessonItemType } from '@/components/Materials/utils/interfaces';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import MediaGallery from '@/common/MediaGallery';
import useDragAndDropMaterial from '@/hooks/useDragAndDropMaterial';
import DrugOverlay from '@/common/MaterialsCommon/DrugOverlay';
import PhotoModal from '@/components/Materials/Photo/PhotoModal';
import { getCategories } from '@/components/Materials/Categories/action';
import CategoryListModal from '@/common/CategoryListModal';

interface Props {
  open: boolean;
  closeModal: () => void;
  handleAdd: (type: LessonItemType, content: string | File, bankId?: number) => void;
}

export default function ChoosePhotoModal({ open, closeModal, handleAdd }: Props) {
  const [search, setSearch] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [categoryList, seCategoryList] = useState<Category[] | undefined>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [addFiles, setAddFiles] = useState<File[] | null>(null);
  const { dragActive, onDragOver, onDragLeave, onDrop } = useDragAndDropMaterial({
    accept: 'image/*',
    onFiles: files => setAddFiles(files),
  });

  const { data: photos, isLoading } = useQuery({
    queryKey: ['photos', search, selectedCategories],
    queryFn: () => getPhotos({ search, page: 'all', categories: selectedCategories }),
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
            <MediaGallery
              data={photos.data}
              showFromDevice
              handleClickFromDevice={() => setOpenModal(true)}
              multiSelectOptions={categoryOptions}
              onMultiSelectChange={onMultiSelectChange}
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

      <PhotoModal
        openModal={openModal}
        closeModal={setOpenModal}
        uploadedFiles={addFiles}
        setUploadedFiles={setAddFiles}
        hideTrigger
      />

      <CategoryListModal list={categoryList} close={() => seCategoryList(undefined)} />
    </>
  );
}
