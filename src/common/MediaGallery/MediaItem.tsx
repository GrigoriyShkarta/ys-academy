
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { CircleChevronRight, ClipboardList, Edit, Trash2 } from 'lucide-react';
import Chip from '@/common/Chip';
import { getYouTubeId } from '@/lib/utils';
import logo from '../../../public/assets/logo.png';
import { IFile, Lesson, Category } from '@/components/Materials/utils/interfaces';

interface MediaItemProps {
  item: IFile;
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
  styles?: React.CSSProperties;
  setNodeRef?: (node: HTMLElement | null) => void;
  attributes?: any;
  listeners?: any;
  isDragging?: boolean;
  isReordering?: boolean;
}

export default function MediaItem({
  item,
  selectedIds,
  toggleSelect,
  isLink,
  linkUrl,
  isPhoto,
  hiddenCheckbox,
  hideLessons,
  userRole,
  handleEdit,
  setSelectedId,
  setOpenConfirm,
  setPreviewUrl,
  seCategoryList,
  setLessonsList,
  styles,
  setNodeRef,
  attributes,
  listeners,
  isDragging,
  isReordering
}: MediaItemProps) {
  const isVideoFileUrl = (url?: string) => !!url && /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);

  return (
    <div
      ref={setNodeRef}
      style={styles}
      {...attributes}
      {...listeners}
      className={`relative group rounded-lg overflow-hidden border hover:shadow-md transition bg-background ${
        selectedIds.includes(item.id) ? 'ring-2 ring-orange-500' : ''
      } ${isDragging ? 'opacity-50 z-50' : ''}`}
    >
      {/* Видео, YouTube или фото */}
      {isLink && !isReordering ? (
        <Link href={`${linkUrl}/${item.id}`} className="block">
          <img
            src={item?.url ? item.url : logo.src}
            alt={item.title}
            className="w-full h-48 object-cover cursor-pointer"
          />
        </Link>
      ) : isLink && isReordering ? (
          <img
            src={item?.url ? item.url : logo.src}
            alt={item.title}
            className="w-full h-48 object-cover cursor-grab"
          />
      ) : getYouTubeId(item?.url ?? '') ? (
        <div className="relative w-full h-48 bg-black">
             <img
              src={`https://img.youtube.com/vi/${getYouTubeId(item?.url ?? '')}/mqdefault.jpg`}
              alt={item.title}
              className={`w-full h-full object-cover ${isReordering ? 'cursor-grab' : 'cursor-pointer'}`}
              onClick={() => !isReordering && setPreviewUrl(item?.url ?? '')}
            />
        </div>
      ) : !isPhoto || isVideoFileUrl(item.url) ? (
        <video
          src={item.url}
          className={`w-full h-48 object-cover ${isReordering ? 'cursor-grab' : 'cursor-pointer'}`}
          onClick={() => !isReordering && setPreviewUrl(item?.url ?? '')}
        />
      ) : (
        <img
          src={item.url}
          alt={item.title}
          className={`w-full h-48 object-cover ${isReordering ? 'cursor-grab' : 'cursor-pointer'}`}
          onClick={() => !isReordering && setPreviewUrl(item?.url ?? '')}
        />
      )}

      {/* Чекбокс выбора */}
      {!hiddenCheckbox && !isReordering && (
        <Checkbox
          checked={selectedIds.includes(item.id)}
          onCheckedChange={() => toggleSelect(item.id)}
          className="absolute top-2 left-2 bg-accent/80! w-6 h-6 rounded-sm z-10"
          onPointerDown={(e) => e.stopPropagation()} 
        />
      )}

      {/* Кнопки редактирования и удаления */}
      {handleEdit && !isReordering && (
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition z-10">
          <button
            onClick={e => {
              e.stopPropagation();
              handleEdit(item);
            }}
            className="bg-accent/80 p-1 rounded-sm shadow hover:bg-accent text-white"
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Edit size={16} />
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              setSelectedId(item.id);
              setOpenConfirm(true);
            }}
            className="bg-destructive/80 p-1 rounded-sm shadow hover:bg-destructive text-white"
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      {item?.progress && (
        <div className="absolute left-2 top-2 p-1 bg-white/50 text-xs rounded-xl z-10">
          {item.progress}%
        </div>
      )}

      <div
        className="p-2 text-center text-sm font-medium text-muted-foreground truncate"
        title={item.title}
      >
        {item.title}
      </div>
      {item?.categories && item?.categories?.length > 0 && (
        <div className="flex gap-1 m-2 justify-center" onPointerDown={(e) => e.stopPropagation()}>
          {item?.categories?.slice(0, 2).map(category => (
            <Chip key={category.id} category={category} />
          ))}
          {item?.categories?.length > 2 && (
            <CircleChevronRight
              className="cursor-pointer"
              onClick={() => seCategoryList(item.categories!)}
            />
          )}
        </div>
      )}
      {!hideLessons &&
        userRole === 'super_admin' &&
        item?.lessons &&
        item?.lessons?.length > 0 && (
          <div className="flex gap-1 m-2 justify-center" onPointerDown={(e) => e.stopPropagation()}>
            <ClipboardList
              onClick={() => setLessonsList(item.lessons!)}
              className="cursor-pointer"
            />
          </div>
        )}
    </div>
  );
}
