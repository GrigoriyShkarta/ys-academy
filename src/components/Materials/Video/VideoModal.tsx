import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
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
import { getYouTubeId } from '@/lib/utils';

interface Props {
  photo: IFile | null;
  setSelectedFile: Dispatch<SetStateAction<IFile | null>>;
}

export default function VideoModal({ photo, setSelectedFile }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('Materials');
  const tForm = useTranslations('Validation');
  const queryClient = useQueryClient();

  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentSchema(tForm)),
    reValidateMode: 'onChange',
    mode: 'onTouched',
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
    if (photo) {
      setOpen(true);
      form.reset({
        id: photo.id,
        content: photo.url,
        title: photo.title,
      });
    } else {
      form.reset({
        id: undefined,
        content: '',
        title: '',
      });
    }
  }, [photo]);

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

  return (
    <Dialog
      open={open}
      onOpenChange={value => {
        form.reset();
        setSelectedFile(null);
        setOpen(value);
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-accent w-[240px] mx-auto">{t('addVideo')}</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{t(photo ? 'edit_video' : 'addVideo')}</DialogTitle>
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

                  {/* Превью видео только если ссылка валидна */}
                  {getYouTubeId(field.value as string) && !form.formState.errors.content && (
                    <div className="mt-3 aspect-video w-full overflow-hidden rounded-xl border border-border">
                      <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${getYouTubeId(field.value as string)}`}
                        title="YouTube Video Preview"
                        allowFullScreen
                      />
                    </div>
                  )}
                </FormItem>
              )}
            />

            <DialogFooter className="flex justify-end space-x-2">
              <FormFooter
                isLoading={isLoading}
                isValid={form.formState.isValid}
                onCancel={() => setOpen(false)}
                onSubmitText={t(!!photo ? 'edit' : 'add')}
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
