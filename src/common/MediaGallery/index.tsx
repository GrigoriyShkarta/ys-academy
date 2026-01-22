// typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FunnelX, Trash2, Edit, Check, X } from 'lucide-react';
import Loader from '@/common/Loader';
import { Category, IFile, Lesson } from '@/components/Materials/utils/interfaces';
import PreviewModal from '@/common/PreviewModal';
import ConfirmModal from '@/common/ConfirmModal';
import Pagination from '@/common/Pagination';
import LessonsListModal from '@/common/LessonsListModal';
import CategoryListModal from '@/common/CategoryListModal';
import MultiSelect from '@/common/MultiSelect';
import ConfirmTextChild from '@/common/ConfirmTextChild';
import { useUser } from '@/providers/UserContext';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import MediaItem from './MediaItem';
import SortableMediaItem from './SortableMediaItem';

interface MultiOption {
  value: string;
  label: string;
}

interface MediaGalleryProps {
  data: IFile[];
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onSearchChange?: (search: string) => void;
  handleEdit?: (file: IFile) => void;
  handleDelete?: (ids: number[]) => Promise<void>;
  isDeleting?: boolean;
  isPhoto?: boolean;
  isOneSelectItem?: boolean;
  handleClickItem?: (file: IFile) => void;
  isLink?: boolean;
  linkUrl?: string;
  hiddenClickAll?: boolean;
  hiddenCheckbox?: boolean;
  showFromDevice?: boolean;
  hiddenSearch?: boolean;
  hideLessons?: boolean;
  queryKey?: string;
  handleClickFromDevice?: () => void;
  multiSelectOptions?: MultiOption[];
  selectedMulti?: string[];
  onMultiSelectChange?: (selected: string[]) => void;
  isFiles?: boolean;
  onReorder?: (newOrder: {id: number, order: number}[]) => void;
}

export default function MediaGallery({
  data,
  totalPages,
  currentPage,
  onPageChange,
  onSearchChange,
  handleEdit,
  isDeleting,
  handleClickItem,
  linkUrl,
  handleDelete,
  queryKey,
  handleClickFromDevice,
  showFromDevice = false,
  isPhoto = true,
  isOneSelectItem = false,
  isLink = false,
  hiddenClickAll = false,
  hiddenCheckbox = false,
  hideLessons = false,
  hiddenSearch = false,
  multiSelectOptions = [],
  selectedMulti = [],
  isFiles,
  onMultiSelectChange,
  onReorder,
}: MediaGalleryProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState<number>();
  const [search, setSearch] = useState('');
  const [openConfirm, setOpenConfirm] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lessonsList, setLessonsList] = useState<Lesson[] | undefined>([]);
  const [categoryList, seCategoryList] = useState<Category[] | undefined>([]);
  const [localSelected, setLocalSelected] = useState<string[]>([]);
  const [items, setItems] = useState<IFile[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();
  const { user } = useUser();
  const t = useTranslations('Common');

  useEffect(() => {
    if (data) {
      setItems(data);
    }
  }, [data]);

  useEffect(() => {
    if (selectedMulti.length > 0) {
      setLocalSelected(selectedMulti);
    }
  }, [selectedMulti]);

  const toggleSelect = (id: number) => {
    if (handleClickItem) {
      handleClickItem(items.find(item => item.id === id)!);
    } else {
      setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(item => item.id));
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      onSearchChange?.(value);
    }, 500);
  };

  const deleteItem = useMutation({
    mutationFn: (ids: number[]) => (handleDelete ? handleDelete(ids) : Promise.resolve()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [queryKey] });
      setSelectedIds([]);
      setSelectedId(undefined);
      setPreviewUrl(null);
      setOpenConfirm(false);
    },
  });
  const handleConfirmDelete = (ids: number[]) => {
    deleteItem.mutate(ids);
  };

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (active.id !== over?.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems;
      });
    }
  };

  const saveOrder = () => {
    if (onReorder) {
        const payload = items.map((item, index) => ({ id: item.id, order: index }));
        onReorder(payload);
    }
    setIsReordering(false);
  }

  const cancelOrder = () => {
    setItems(data);
    setIsReordering(false);
  }

  if (!items) return <Loader />;

  // Common props for items
  const itemProps = {
    selectedIds,
    toggleSelect,
    isLink,
    linkUrl,
    isPhoto,
    hiddenCheckbox,
    hideLessons,
    userRole: user?.role,
    handleEdit,
    setSelectedId,
    setOpenConfirm,
    setPreviewUrl,
    seCategoryList,
    setLessonsList,
  };

  const content = (
    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-2 xl:grid-cols-5 gap-4 w-full box-border">
      {onReorder && user?.role === 'super_admin' ? (
        <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy} disabled={!isReordering}>
          {items.map((item) => (
            <SortableMediaItem
              key={item.id}
              item={item}
              disabled={!isReordering}
              isReordering={isReordering}
              {...itemProps}
            />
          ))}
        </SortableContext>
      ) : (
        items.map((item) => (
          <MediaItem
            key={item.id}
            item={item}
            {...itemProps}
          />
        ))
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 w-full min-h-[100px]">
      {/* Поиск и массовое удаление */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-4 items-center flex-wrap">
          {!hiddenSearch && (
            <Input
              placeholder={t('search')}
              value={search}
              onChange={handleSearchChange}
              className="max-w-sm"
            />
          )}

          {multiSelectOptions.length > 0 && (
            <div className="flex gap-2">
              <MultiSelect
                options={multiSelectOptions}
                selected={localSelected}
                onChange={next => {
                  setLocalSelected(prev => {
                    if (prev.length === next.length && prev.every((v, i) => v === next[i]))
                      return prev;
                    return next;
                  });
                  onMultiSelectChange?.(next);
                }}
                placeholder={t('select')}
                className="relative"
              />

              {localSelected.length > 0 && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setLocalSelected([]);
                    onMultiSelectChange?.([]);
                  }}
                >
                  <FunnelX />
                </Button>
              )}
            </div>
          )}

          {!isOneSelectItem && selectedIds.length > 0 && (
            <Button
              className="bg-destructive hover:bg-destructive/80"
              onClick={() => setOpenConfirm(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}

          {showFromDevice && handleClickFromDevice && (
            <Button className="bg-accent hover:bg-accent/80" onClick={handleClickFromDevice}>
              {t('from_device')}
            </Button>
          )}
          
          {/* Reorder controls */}
          {onReorder && user?.role === 'super_admin' && (
             <>
               {!isReordering ? (
                 <Button onClick={() => setIsReordering(true)} variant="outline" size="icon" title="Змінити порядок">
                   <Edit className="w-4 h-4" />
                 </Button>
               ) : (
                 <div className="flex gap-2 ml-auto sm:ml-0">
                    <Button onClick={saveOrder} variant="default" size="icon" className="bg-green-600 hover:bg-green-700" title="Зберегти порядок">
                        <Check className="w-4 h-4" />
                    </Button>
                    <Button onClick={cancelOrder} variant="destructive" size="icon" title="Скасувати">
                        <X className="w-4 h-4" />
                    </Button>
                 </div>
               )}
             </>
          )}
        </div>

        {!isOneSelectItem && !hiddenClickAll && items.length > 0 && !isReordering && (
          <div className="flex gap-2">
            <Checkbox
              checked={selectedIds.length === items.length && items.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground">{t('select_all')}</span>
          </div>
        )}
      </div>

      {/* Сетка медиа с DND или без */}
      {onReorder && user?.role === 'super_admin' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {content}
        </DndContext>
      ) : (
        content
      )}

      {currentPage && totalPages && onPageChange && items.length > 0 ? (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
      ) : null}
      
      {previewUrl && (
        <PreviewModal
          open={!!previewUrl}
          setOpen={() => setPreviewUrl(null)}
          content={previewUrl}
        />
      )}

      {openConfirm && (
        <ConfirmModal
          open={openConfirm}
          confirmAction={() => handleConfirmDelete(selectedId ? [selectedId] : selectedIds)}
          setOnClose={() => setOpenConfirm(false)}
          isLoading={isDeleting}
          children={isFiles && <ConfirmTextChild />}
        />
      )}

      <LessonsListModal list={lessonsList} close={() => setLessonsList(undefined)} />
      <CategoryListModal list={categoryList} close={() => seCategoryList(undefined)} />
    </div>
  );
}
