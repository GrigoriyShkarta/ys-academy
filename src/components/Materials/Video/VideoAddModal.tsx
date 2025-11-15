import { Dispatch, KeyboardEvent, SetStateAction, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormFooter } from '@/common/ModalFooter';
import { uploadVideo } from '@/components/Materials/Video/action';
import { Dropzone } from '@/common/Dropzone';
import VideoPreviewList from './VideoPreviewList';
import { fetchYouTubeOembed, getYouTubeId } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  hideTrigger?: boolean;
  open?: boolean;
  close?: Dispatch<SetStateAction<boolean>>;
  setNewFiles?: Dispatch<SetStateAction<File[] | null>>;
  initialFiles?: File[] | null;
}

export default function VideoAddModal({
  hideTrigger,
  open = false,
  close,
  setNewFiles,
  initialFiles,
}: Props) {
  const MAX_FILES = 9;
  const [internalOpen, setInternalOpen] = useState(open);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUploads, setSelectedUploads] = useState<
    { uid: string; file: File; title: string; preview: string }[]
  >([]);
  const [urlsText, setUrlsText] = useState('');
  const [youtubeItems, setYoutubeItems] = useState<
    { id?: string; url: string; title?: string; valid?: boolean; error?: 'format' | 'not_found' }[]
  >([]);
  const [fetchingFile, setFetchingFile] = useState<number | null>(null);

  const t = useTranslations('Materials');
  const tValidation = useTranslations('Validation');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) setInternalOpen(true);
  }, [open]);

  useEffect(() => {
    if (!initialFiles || initialFiles.length === 0) {
      setSelectedUploads([]);
      return;
    }
    const mapped = initialFiles.map((f, idx) => ({
      uid: idx.toString(),
      file: f,
      title: f.name.replace(/\.[^/.]+$/, ''),
      preview: URL.createObjectURL(f),
    }));
    setSelectedUploads(prev => [...prev, ...mapped]);
    setInternalOpen(true);
  }, [initialFiles]);

  const handleOpenChange = (val: boolean) => {
    setInternalOpen(val);
    setSelectedUploads([]);
    setYoutubeItems([]);
    setUrlsText('');
    setFetchingFile(null);
    if (setNewFiles) setNewFiles(null);
    if (close) close(false);
  };

  // Парсим urlsText -> youtubeItems и подтягиваем title через oEmbed
  useEffect(() => {
    const lines = urlsText
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    // Создаём записы для каждой строки: если id не найден — помечаем как format error
    const initial = lines.map(url => {
      const id = getYouTubeId(url);
      if (!id) return { url, valid: false as const, error: 'format' as const };
      return { id, url, valid: undefined as unknown as boolean };
    });

    setYoutubeItems(initial);

    // Для каждой записи с id делаем oEmbed-запрос и помечаем valid/not_found
    initial.forEach(async item => {
      if (!item.id) return;
      const o = await fetchYouTubeOembed(item.id);
      if (o.ok) {
        setYoutubeItems(prev =>
          prev.map(it => (it.id === item.id ? { ...it, title: o.title, valid: true } : it))
        );
      } else {
        setYoutubeItems(prev =>
          prev.map(it => (it.id === item.id ? { ...it, valid: false, error: 'not_found' } : it))
        );
      }
    });
  }, [urlsText]);

  // helper: формируем список youtube для превью (только те, у кого есть id)
  const previewYoutube = youtubeItems.filter(it => it.id) as {
    id: string;
    url: string;
    title?: string;
    valid?: boolean;
  }[];

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // пробел работает как Enter (вставляет перенос строки в позицию каретки)
  const handleTextareaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === ' ') {
      e.preventDefault();
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart ?? urlsText.length;
      const end = el.selectionEnd ?? urlsText.length;
      const before = urlsText.slice(0, start);
      const after = urlsText.slice(end);
      const newValue = before + '\n' + after;
      setUrlsText(newValue);
      // выставляем каретку после вставленного newline
      window.requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 1;
      });
    }
  };

  const onSubmitMultiFiles = async () => {
    setIsLoading(true);
    try {
      // загрузим только валидные YouTube ссылки
      const validYoutubeToUpload = youtubeItems.filter(it => it.id && it.valid === true);
      for (let i = 0; i < validYoutubeToUpload.length; i++) {
        const y = validYoutubeToUpload[i];
        setFetchingFile(i);
        await uploadVideo({ title: y.title ?? `YouTube ${y.id}`, content: y.url });
      }

      // загрузим файлы
      for (let i = 0; i < selectedUploads.length; i++) {
        const item = selectedUploads[i];
        setFetchingFile(i + validYoutubeToUpload.length);
        try {
          await uploadVideo({
            title: item.title || item.file.name.replace(/\.[^/.]+$/, ''),
            content: item.file,
          });
        } catch {}
      }

      await queryClient.invalidateQueries({ queryKey: ['videos'] });
      handleOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const allYoutubeValid = youtubeItems.length === 0 || youtubeItems.every(it => it.valid === true);
  const hasValidationError = youtubeItems.some(it => it.valid === false || it.error != null);

  return (
    <Dialog open={internalOpen} onOpenChange={handleOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button className="bg-accent w-[240px] mx-auto">{t('addVideo')}</Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('addVideo')}</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={async e => {
            e.preventDefault();
            await onSubmitMultiFiles();
          }}
        >
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('url')}</p>
            <Textarea
              className={`w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2
                text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                ${hasValidationError ? '!border-destructive focus-visible:!ring-destructive' : ''}`}
              placeholder={`${t('url')} — ${t('one_per_line')}`}
              value={urlsText}
              onChange={e => setUrlsText(e.target.value)}
              // ref={textareaRef}
              onKeyDown={handleTextareaKeyDown}
              aria-invalid={hasValidationError}
            />
            {youtubeItems.some(it => it.valid === false) && (
              <div className="mt-2 text-sm text-destructive">
                {youtubeItems.map((it, idx) =>
                  it.valid === false ? (
                    <div key={`err-${idx}`}>
                      {it.error === 'format'
                        ? tValidation('invalid_youtube_url')
                        : tValidation('video_not_found')}
                    </div>
                  ) : null
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">{t('each_url_new_line')}</p>

            <Dropzone
              multiple
              accept={['video/*']}
              label={t('video_file')}
              dragLabel={t('dragOrClick')}
              maxFiles={MAX_FILES}
              onChangeMany={files => {
                const availableSlots = Math.max(
                  0,
                  MAX_FILES - (selectedUploads.length + youtubeItems.length)
                );
                const limited = files.slice(0, availableSlots);
                const mapped = limited.map((f, idx) => ({
                  uid: idx.toString(),
                  file: f,
                  title: f.name.replace(/\.[^/.]+$/, ''),
                  preview: URL.createObjectURL(f),
                }));
                setSelectedUploads(prev => [...prev, ...mapped]);
              }}
              disabled={selectedUploads.length + youtubeItems.length >= MAX_FILES}
            />

            <VideoPreviewList
              youtube={previewYoutube}
              fetchingFileIdx={fetchingFile}
              files={selectedUploads.map(s => ({
                uid: s.uid,
                preview: s.preview,
                title: s.title,
                fileName: s.file.name,
              }))}
              onRemoveFile={(uid: string) =>
                setSelectedUploads(prev => {
                  const item = prev.find(p => p.uid === uid);
                  if (item) URL.revokeObjectURL(item.preview);
                  return prev.filter(p => p.uid !== uid);
                })
              }
              onRemoveYoutube={(filteredIndex: number) => {
                const item = previewYoutube[filteredIndex];
                if (!item) return;
                const lines = urlsText
                  .split('\n')
                  .map(l => l.trim())
                  .filter(Boolean);
                const idxToRemove = lines.findIndex(l => l === item.url);
                if (idxToRemove !== -1) {
                  lines.splice(idxToRemove, 1);
                  setUrlsText(lines.join('\n'));
                }
              }}
              onYoutubeTitleChange={(filteredIndex: number, title: string) => {
                const item = previewYoutube[filteredIndex];
                if (!item) return;
                setYoutubeItems(prev =>
                  prev.map(it => (it.url === item.url ? { ...it, title } : it))
                );
              }}
              onFileTitleChange={(uid: string, title: string) =>
                setSelectedUploads(prev => prev.map(it => (it.uid === uid ? { ...it, title } : it)))
              }
            />
          </div>

          <DialogFooter className="flex justify-end space-x-2">
            <FormFooter
              isLoading={isLoading}
              isValid={previewYoutube.length + selectedUploads.length > 0 && allYoutubeValid}
              onCancel={() => handleOpenChange(false)}
              onSubmitText={t('add')}
              onCancelText={t('cancel')}
              loadingText={t('uploading')}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
