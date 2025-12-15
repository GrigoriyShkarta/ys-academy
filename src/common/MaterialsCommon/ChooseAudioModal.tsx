import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAudios } from '@/components/Materials/Audio/action';
import { keepPreviousData } from '@tanstack/query-core';
import Loader from '@/common/Loader';
import { Category, IFile, Lesson, LessonItemType } from '@/components/Materials/utils/interfaces';
import { useTranslations } from 'next-intl';
import DataTable from '@/common/Table';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import AudioModal from '@/components/Materials/Audio/AudioModal';
import DrugOverlay from '@/common/MaterialsCommon/DrugOverlay';
import useDragAndDropMaterial from '@/hooks/useDragAndDropMaterial';
import { getCategories } from '@/components/Materials/Categories/action';
import Chip from '@/common/Chip';
import { CircleChevronRight, ClipboardList } from 'lucide-react';
import CategoryListModal from '@/common/CategoryListModal';
import LessonsListModal from '@/common/LessonsListModal';
import { useUser } from '@/providers/UserContext';

interface Props {
  open: boolean;
  closeModal: () => void;
  handleAdd: (type: LessonItemType, content?: string | File, bankId?: number) => void;
}

export default function ChooseAudioModal({ open, closeModal, handleAdd }: Props) {
  const [search, setSearch] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [addFiles, setAddFiles] = useState<File[] | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryList, setCategoryList] = useState<Category[] | undefined>([]);
  const [lessonsList, setLessonsList] = useState<Lesson[] | undefined>([]);
  const { dragActive, onDragOver, onDragLeave, onDrop } = useDragAndDropMaterial({
    accept: ['audio/*'],
    onFiles: files => setAddFiles(files),
  });
  const t = useTranslations('Materials');
  const { user } = useUser();

  const { data: audios, isLoading } = useQuery({
    queryKey: ['audios', search, selectedCategories],
    queryFn: () => getAudios({ search, page: 'all', categories: selectedCategories }),
    placeholderData: keepPreviousData,
    enabled: user?.role === 'super_admin',
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories({ page: 'all' }),
    enabled: user?.role === 'super_admin',
  });

  const categoryOptions = (categories?.data ?? []).map((c: any) => ({
    value: String(c.id),
    label: c.title,
    color: c.color,
  }));

  const onMultiSelectChange = (selected: string[]) => {
    setSelectedCategories(selected);
  };

  const columns = [
    {
      key: 'title',
      label: t('title'),
      render: (item: IFile) => <span>{item?.title || ''}</span>,
    },
    {
      key: 'audio',
      label: t('audio'),
      render: (item: IFile) => (
        <div className="flex items-center gap-2">
          {item?.url && <audio controls src={item.url} className="h-6 w-[400px]" />}
        </div>
      ),
    },
    {
      key: 'categories',
      label: t('categories'),
      render: (item: IFile) => {
        const categories = item?.categories || [];

        if (!categories.length) return null;

        return (
          <div className="flex gap-1 items-center">
            {categories.slice(0, 2).map(category => (
              <Chip key={category.id} category={category} />
            ))}

            {categories.length > 2 && (
              <CircleChevronRight
                className="cursor-pointer"
                onClick={() => setCategoryList(categories)}
              />
            )}
          </div>
        );
      },
    },
    {
      key: 'lessons',
      label: t('lessons'),
      render: (item: IFile) => {
        const lessons = item?.lessons || [];

        if (lessons.length === 0) return null;

        return (
          <ClipboardList
            className="cursor-pointer"
            onClick={e => {
              e.stopPropagation();
              setLessonsList(lessons);
            }}
          />
        );
      },
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
              data={audios?.data}
              columns={columns}
              showFromDevice
              multiSelectOptions={categoryOptions}
              onMultiSelectChange={onMultiSelectChange}
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
        uploadedFiles={addFiles}
        setUploadedFiles={setAddFiles}
        hideTrigger
      />

      <LessonsListModal list={lessonsList} close={() => setLessonsList(undefined)} />
      <CategoryListModal list={categoryList} close={() => setCategoryList(undefined)} />
    </>
  );
}
