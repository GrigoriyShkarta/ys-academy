import { FC, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import MultiSelect from '@/common/MultiSelect';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/components/Materials/Categories/action';
import CategoryModal from '@/components/Materials/Categories/CategoryModal';

type YouTubePreview = { id: string; url: string; title?: string; categories?: string[] };
type FilePreview = {
  uid: string;
  preview: string;
  title?: string;
  fileName?: string;
  categories?: string[];
};

interface Props {
  fetchingFileIdx?: number | null;
  fetchingYoutubeIdx?: number | null;
  youtube?: YouTubePreview[];
  files?: FilePreview[];
  onRemoveFile: (uid: string) => void;
  onRemoveYoutube?: (index: number) => void;
  onYoutubeTitleChange?: (index: number, title: string) => void;
  onFileTitleChange?: (uid: string, title: string) => void;
  onYoutubeCategoriesChange?: (index: number, categories: string[]) => void;
  onFileCategoriesChange?: (uid: string, categories: string[]) => void;
}

export const VideoPreviewList: FC<Props> = ({
  fetchingFileIdx,
  youtube = [],
  files = [],
  onRemoveFile,
  onRemoveYoutube,
  onYoutubeTitleChange,
  onFileTitleChange,
  onYoutubeCategoriesChange,
  onFileCategoriesChange,
}) => {
  const t = useTranslations('Materials');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [activeVideoKey, setActiveVideoKey] = useState<string | null>(null); // 'yt-0' или 'file-abc123'
  const [globalCategories, setGlobalCategories] = useState<string[]>([]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories({ page: 'all' }),
  });

  const categoryOptions = (categories?.data ?? []).map((c: any) => ({
    value: String(c.id),
    label: c.title,
    color: c.color,
  }));

  const allVideos = [
    ...youtube.map((v, i) => ({ ...v, type: 'youtube' as const, index: i })),
    ...files.map(f => ({ ...f, type: 'file' as const, uid: f.uid })),
  ];

  const handleGlobalCategoryChange = (next: string[]) => {
    const removed = globalCategories.filter(c => !next.includes(c));
    const added = next.filter(c => !globalCategories.includes(c));

    setGlobalCategories(next);

    // Update YouTube videos
    youtube.forEach((video, idx) => {
      let current = video.categories || [];
      // Remove categories that were removed globally
      current = current.filter(c => !removed.includes(c));
      // Add categories that were added globally
      const updated = [...new Set([...current, ...added])];
      onYoutubeCategoriesChange?.(idx, updated);
    });

    // Update File videos
    files.forEach(file => {
      let current = file.categories || [];
      // Remove categories that were removed globally
      current = current.filter(c => !removed.includes(c));
      // Add categories that were added globally
      const updated = [...new Set([...current, ...added])];
      onFileCategoriesChange?.(file.uid, updated);
    });
  };

  const handleNewCategories = (newCategories?: string[]) => {
    if (!activeVideoKey || !newCategories) return;
    if (!newCategories) return;

    // Для YouTube
    if (activeVideoKey.startsWith('yt-')) {
      const idx = Number(activeVideoKey.split('-')[1]);
      const current = youtube[idx]?.categories || [];
      onYoutubeCategoriesChange?.(idx, [...new Set([...current, ...newCategories])]);
    }

    // Для загруженных файлов
    if (activeVideoKey.startsWith('file-')) {
      const uid = activeVideoKey.replace('file-', '');
      const current = files.find(f => f.uid === uid)?.categories || [];
      onFileCategoriesChange?.(uid, [...new Set([...current, ...newCategories])]);
    }

    setActiveVideoKey(null);
  };

  const openCategoryModal = (key: string) => {
    setActiveVideoKey(key);
    setIsCategoryModalOpen(true);
  };

  if (allVideos.length === 0) return null;

  return (
    <>
      <div className="mt-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            {t('uploaded_videos')}: <span className="font-bold">{allVideos.length}</span>/9
          </p>

          <MultiSelect
            options={categoryOptions}
            selected={globalCategories}
            onChange={handleGlobalCategoryChange}
            placeholder={t('select_categories')}
            className="w-full max-w-[300px]"
          />
        </div>

        <div
          className={`grid gap-5 ${
            allVideos.length === 1
              ? 'grid-cols-1'
              : allVideos.length === 2
              ? 'grid-cols-2'
              : 'grid-cols-3'
          }`}
        >
          {/* === YouTube видео === */}
          {youtube.map((video, idx) => {
            const key = `yt-${idx}`;
            const isFetching = fetchingFileIdx === idx;
            const selectedCategories = video.categories ?? [];

            return (
              <div
                key={key}
                className={`relative rounded-xl border bg-card shadow-sm transition-all ${
                  isFetching ? 'ring-2 ring-primary/20 bg-primary/5' : ''
                }`}
              >
                {isFetching && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                    <Loader className="w-10 h-10 animate-spin text-primary" />
                  </div>
                )}

                <div className="p-4 space-y-4">
                  <div className="aspect-video overflow-hidden rounded-lg bg-black">
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${video.id}`}
                      title={video.title || 'YouTube video'}
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Название видео</Label>
                    <Input
                      value={video.title || ''}
                      onChange={e => onYoutubeTitleChange?.(idx, e.target.value)}
                      placeholder={t('enterTitle')}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs font-medium">Категории</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => openCategoryModal(key)}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        {youtube.length + files.length < 2 && t('create_category')}
                      </Button>
                    </div>
                    <MultiSelect
                      options={categoryOptions}
                      selected={selectedCategories}
                      onChange={next => onYoutubeCategoriesChange?.(idx, next)}
                      placeholder={t('select_categories')}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-3 right-3"
                    onClick={() => onRemoveYoutube?.(idx)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          {/* === Загруженные видео === */}
          {files.map(file => {
            const key = `file-${file.uid}`;
            const isFetching = fetchingFileIdx === youtube.length + files.indexOf(file);
            const selectedCategories = file.categories ?? [];

            return (
              <div
                key={key}
                className={`relative rounded-xl border bg-card shadow-sm transition-all ${
                  isFetching ? 'ring-2 ring-primary/20 bg-primary/5' : ''
                }`}
              >
                {isFetching && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                    <Loader className="w-10 h-10 animate-spin text-primary" />
                  </div>
                )}

                <div className="p-4 space-y-4">
                  <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                    <video
                      src={file.preview}
                      className="w-full h-full object-cover"
                      controls
                      preload="metadata"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Название видео</Label>
                    <Input
                      value={file.title || ''}
                      onChange={e => onFileTitleChange?.(file.uid, e.target.value)}
                      placeholder={t('enterTitle')}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs font-medium">Категории</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => openCategoryModal(key)}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        {files.length + youtube.length < 2 && t('create_category')}
                      </Button>
                    </div>
                    <MultiSelect
                      options={categoryOptions}
                      selected={selectedCategories}
                      onChange={next => onFileCategoriesChange?.(file.uid, next)}
                      placeholder={t('select_categories')}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-3 right-3"
                    onClick={() => onRemoveFile(file.uid)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <CategoryModal
        openModal={isCategoryModalOpen}
        closeModal={() => {
          setIsCategoryModalOpen(false);
          setActiveVideoKey(null);
        }}
        selectCategory={handleNewCategories}
        hideTrigger
      />
    </>
  );
};

export default VideoPreviewList;
