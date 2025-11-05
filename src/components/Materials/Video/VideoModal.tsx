import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import axios from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { FormFooter } from '@/common/ModalFooter';
import { ContentFormValues, contentSchema } from '@/components/Materials/utils/materialSchemas';
import { IFile } from '@/components/Materials/utils/interfaces';
import { editVideo, uploadVideo } from '@/components/Materials/Video/action';
import { getYouTubeId, isFile } from '@/lib/utils';
import { Dropzone } from '@/common/Dropzone';

interface Props {
  video?: IFile | null;
  hideTrigger?: boolean;
  setSelectedFile?: Dispatch<SetStateAction<IFile | null>>;
}

export default function VideoModal({ video, setSelectedFile, hideTrigger }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const t = useTranslations('Materials');
  const tForm = useTranslations('Validation');
  const queryClient = useQueryClient();

  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentSchema(tForm)),
    reValidateMode: 'onChange',
    mode: 'onChange',
    defaultValues: { title: '', content: '' },
  });

  const checkYouTubeVideoExists = async (videoUrl: string): Promise<boolean> => {
    try {
      const response = await axios.get('https://www.youtube.com/oembed', {
        params: { url: videoUrl, format: 'json' },
      });
      return response.status === 200;
    } catch {
      return false;
    }
  };

  const fileValue = form.watch('content');

  useEffect(() => {
    const validateVideo = async () => {
      if (!fileValue) return;

      const videoId = getYouTubeId(fileValue as string);
      if (!videoId) {
        form.setError('content', {
          message: tForm('invalid_youtube_url'),
        });
        return;
      }

      const exists = await checkYouTubeVideoExists(fileValue as string);
      if (!exists) {
        form.setError('content', {
          message: tForm('video_not_found'),
        });
      } else {
        form.clearErrors('content');
      }
    };

    // Небольшая задержка, чтобы не спамить API при вводе
    const timeout = setTimeout(() => validateVideo(), 600);
    return () => clearTimeout(timeout);
  }, [fileValue, form, t]);

  useEffect(() => {
    if (video) {
      setOpen(true);
      form.reset({
        id: video.id,
        content: video.url,
        title: video.title,
      });
    } else {
      form.reset({
        id: undefined,
        content: '',
        title: '',
      });
    }
  }, [video]);

  const onSubmit = async (data: ContentFormValues) => {
    setIsLoading(true);
    if (data.id) {
      await editVideo(data.id, data);
    } else {
      await uploadVideo(data);
    }
    await queryClient.invalidateQueries({ queryKey: ['videos'] });
    setOpen(false);
    setIsLoading(false);
  };

  const closeModal = (value: boolean) => {
    form.reset();
    setOpen(value);
    if (setSelectedFile) {
      setSelectedFile(null);
    }
  };

  const contentValue = form.watch('content');

  const isUrl = typeof contentValue === 'string' && contentValue.trim() !== '';
  const isFileType = isFile(contentValue);
  const hasContent = isUrl || isFileType;

  return (
    <Dialog open={open} onOpenChange={closeModal}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button className="bg-accent w-[240px] mx-auto">{t('addVideo')}</Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(video ? 'edit_video' : 'addVideo')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('title')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('enterTitle')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isFileType && (
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('url')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('url')}
                        {...field}
                        value={(field.value as string) || ''}
                        onChange={e => field.onChange(e.target.value.trim())}
                        className={form.formState.errors.content ? 'border-red-500' : ''}
                      />
                    </FormControl>
                    <FormMessage />

                    {/* Превью YouTube */}
                    {getYouTubeId(field.value as string) && !form.formState.errors.content && (
                      <div className="mt-3 aspect-video w-full overflow-hidden rounded-xl border border-border">
                        <iframe
                          className="w-full h-full"
                          src={`https://www.youtube.com/embed/${getYouTubeId(
                            field.value as string
                          )}`}
                          title="YouTube Video Preview"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </FormItem>
                )}
              />
            )}

            {/* "или" — только если нет файла */}
            {!hasContent && <p className="text-center">{t('or')}</p>}

            {/* Dropzone — только если файл или пусто */}
            {!isUrl && (
              <Controller
                control={form.control}
                name="content"
                render={({ field: { value } }) => (
                  <FormItem>
                    <FormLabel>{t('file')}</FormLabel>
                    <FormControl>
                      <Dropzone
                        value={value}
                        onChange={file => {
                          if (!file) {
                            form.setValue('content', '');
                            form.setValue('title', '');
                            setVideoPreviewUrl(null);
                            form.trigger();
                            return;
                          }

                          const cleanName = file.name.replace(/\.[^/.]+$/, '');
                          form.setValue('title', cleanName, { shouldValidate: true });
                          form.setValue('content', file);

                          // Создаём URL для превью
                          const preview = URL.createObjectURL(file);
                          setVideoPreviewUrl(preview);

                          form.trigger(['title', 'content']);
                        }}
                        dragLabel={t('dragOrClick')}
                        accept={['video/']}
                        label={t('video_file')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="flex justify-end space-x-2">
              <FormFooter
                isLoading={isLoading}
                isValid={form.formState.isValid}
                onCancel={() => closeModal(false)}
                onSubmitText={t(!!video ? 'edit' : 'add')}
                onCancelText={t('cancel')}
                loadingText={t('uploading')}
              />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
