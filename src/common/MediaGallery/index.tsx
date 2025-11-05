'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import Loader from '@/common/Loader';
import { IFile } from '@/components/Materials/utils/interfaces';
import PreviewModal from '@/common/PreviewModal';
import ConfirmModal from '@/common/ConfirmModal';
import Pagination from '@/common/Pagination';
import { getYouTubeId } from '@/lib/utils';
import logo from '../../../public/assets/logo.png';

interface MediaGalleryProps {
  data: IFile[];
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onSearchChange: (search: string) => void;
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
  queryKey?: string;
  handleClickFromDevice?: () => void;
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
}: MediaGalleryProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState<number>();
  const [search, setSearch] = useState('');
  const [openConfirm, setOpenConfirm] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();
  const t = useTranslations('Common');

  const toggleSelect = (id: number) => {
    if (handleClickItem) {
      handleClickItem(data.find(item => item.id === id)!);
    } else {
      setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map(item => item.id));
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

  if (!data) return <Loader />;

  return (
    <div className="flex flex-col gap-4 w-full min-h-[100px]">
      {/* Поиск и массовое удаление */}

      <div className="flex flex-col gap-3">
        <div className="flex gap-4">
          <Input
            placeholder={t('search')}
            value={search}
            onChange={handleSearchChange}
            className="max-w-sm"
          />

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
        </div>

        {!isOneSelectItem && !hiddenClickAll && (
          <div className="flex gap-2">
            <Checkbox
              checked={selectedIds.length === data.length && data.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground">{t('select_all')}</span>
          </div>
        )}
      </div>

      {/* Сетка медиа */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 w-full box-border">
        {data.map((item: IFile) => (
          <div
            key={item.id}
            className={`relative group rounded-lg overflow-hidden border hover:shadow-md transition ${
              selectedIds.includes(item.id) ? 'ring-2 ring-orange-500' : ''
            }`}
          >
            {/* Видео или фото */}
            {isLink ? (
              // если isLink, делаем только превью ссылкой на модуль
              <Link href={`${linkUrl}/${item.id}`} className="block">
                <img
                  src={item?.url ? item.url : logo.src}
                  alt={item.title}
                  className="w-full h-48 object-cover cursor-pointer"
                />
              </Link>
            ) : getYouTubeId(item.url) ? (
              <iframe
                className="w-full h-48 object-cover cursor-pointer"
                src={`https://www.youtube.com/embed/${getYouTubeId(item.url)}`}
                title={item.title}
                allowFullScreen
                onClick={() => setPreviewUrl(item.url)}
              />
            ) : (
              <img
                src={item.url}
                alt={item.title}
                className="w-full h-48 object-cover cursor-pointer"
                onClick={() => setPreviewUrl(item.url)}
              />
            )}

            {/* Чекбокс выбора */}
            {!hiddenCheckbox && (
              <Checkbox
                checked={selectedIds.includes(item.id)}
                onCheckedChange={() => toggleSelect(item.id)}
                className="absolute top-2 left-2 bg-accent/80! w-6 h-6 rounded-sm"
              />
            )}

            {/* Кнопки редактирования и удаления */}
            {handleEdit && (
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleEdit(item);
                  }}
                  className="bg-accent/80 p-1 rounded-sm shadow hover:bg-accent text-white"
                  type="button"
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
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            <div
              className="p-2 text-center text-sm font-medium text-muted-foreground truncate"
              title={item.title}
            >
              {item.title}
            </div>
          </div>
        ))}
      </div>

      {currentPage && totalPages && onPageChange && data.length > 0 ? (
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
        />
      )}
    </div>
  );
}
