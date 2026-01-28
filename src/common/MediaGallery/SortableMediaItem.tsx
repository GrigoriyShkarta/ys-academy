
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import MediaItem from './MediaItem';
import { IFile, Lesson, Category } from '@/components/Materials/utils/interfaces';

interface SortableMediaItemProps {
  item: IFile;
  // pass through all props needed by MediaItem
  selectedIds: number[];
  toggleSelect: (id: number) => void;
  isLink: boolean;
  linkUrl?: string;
  isPhoto: boolean;
  hiddenCheckbox: boolean;
  hideLessons: boolean;
  userRole?: string;
  handleEdit?: (item: IFile) => void;
  setSelectedId: (id: number) => void;
  setOpenConfirm: (val: boolean) => void;
  setPreviewUrl: (url: string) => void;
  seCategoryList: (cats: Category[]) => void;
  setLessonsList: (lessons: Lesson[]) => void;
  disabled?: boolean;
  isReordering?: boolean;
}

export default function SortableMediaItem(props: SortableMediaItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.item.id, disabled: props.disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <MediaItem
      {...props}
      setNodeRef={setNodeRef}
      styles={style}
      attributes={attributes}
      listeners={listeners}
      isDragging={isDragging}
    />
  );
}
