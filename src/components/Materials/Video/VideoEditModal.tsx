import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { checkYouTubeVideoExists, getYouTubeId, isFile } from '@/lib/utils';
import MultiSelect from '@/common/MultiSelect';
import { getCategories } from '@/components/Materials/Categories/action';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import CategoryModal from '@/components/Materials/Categories/CategoryModal';

interface Props {
  video?: IFile | null;
  hideTrigger?: boolean;
  setSelectedFile?: Dispatch<SetStateAction<IFile | null>>;
}

export default function VideoEditModal({ video, setSelectedFile }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const t = useTranslations('Materials');
  const tForm = useTranslations('Validation');
  const queryClient = useQueryClient();

  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentSchema(tForm)),
    reValidateMode: 'onChange',
    mode: 'onChange',
    defaultValues: { title: '', content: '', categories: [] },
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

  const fileValue = form.watch('content');

  useEffect(() => {
    if (isFile(fileValue)) {
      const f = fileValue as File;
      const url = URL.createObjectURL(f);
      setLocalPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setLocalPreviewUrl(null);
      };
    }
    setLocalPreviewUrl(null);
  }, [fileValue]);

  useEffect(() => {
    const validateVideo = async () => {
      if (!fileValue) return;
      if (isFile(fileValue)) {
        form.clearErrors('content');
        return;
      }
      const valueStr = String(fileValue).trim();
      const videoId = getYouTubeId(valueStr);
      if (videoId) {
        const exists = await checkYouTubeVideoExists(valueStr);
        if (!exists) {
          form.setError('content', { message: tForm('video_not_found') });
        } else {
          form.clearErrors('content');
        }
        return;
      }
      form.clearErrors('content');
    };

    const timeout = setTimeout(() => validateVideo(), 600);
    return () => clearTimeout(timeout);
  }, [fileValue, form, t, tForm]);

  useEffect(() => {
    if (video) {
      setOpen(true);
      form.reset({
        id: video.id,
        content: video.url,
        title: video.title,
        categories: video?.categories.map(c => String(c.id)) ?? [],
      });
    } else {
      form.reset({ id: undefined, content: '', title: '' });
    }
  }, [video, form]);

  const onSubmit = async (data: ContentFormValues) => {
    setIsLoading(true);
    try {
      const title = data.title ?? '';
      const content = data.content === '' ? '' : data.content;
      const formatedFile = {
        title,
        content,
        categories: data.categories,
      };
      if (data.id) {
        await editVideo(data.id, formatedFile);
      } else {
        await uploadVideo({ ...data, title });
      }
      await queryClient.invalidateQueries({ queryKey: ['videos'] });
    } finally {
      setIsLoading(false);
      handleClose();
    }
  };

  const handleClose = () => {
    setOpen(false);
    if (setSelectedFile) {
      setSelectedFile(null);
    }
  };

  const handleNewCategoriesForFile = (newCategories?: string[]) => {
    if (!newCategories) return;

    // Берём текущие категории из формы
    const current = form.getValues('categories') || [];

    // Добавляем новые (и убираем дубли, если нужно)
    const updated = Array.from(new Set([...current, ...newCategories]));

    form.setValue('categories', updated);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button className="bg-accent w-[240px] mx-auto">{t('addVideo')}</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
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

            <FormField
              control={form.control}
              name="categories"
              render={({ field }) => (
                <>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label>{t('categories')}</Label>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-primary hover:text-primary"
                      onClick={() => setIsCategoryModalOpen(true)}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      {t('create_category')}
                    </Button>
                  </div>
                  <FormItem>
                    <FormControl>
                      <MultiSelect
                        options={categoryOptions}
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder={t('select_categories')}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => {
                const val = field.value as unknown;
                const str = String(val || '').trim();
                const yid = !isFile(val) ? getYouTubeId(str) : null;

                return (
                  <FormItem>
                    {yid ? (
                      <>
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
                      </>
                    ) : null}

                    {(() => {
                      if (isFile(val)) {
                        return (
                          <div className="mt-3 aspect-video w-full overflow-hidden rounded-xl border border-border">
                            <video className="w-full h-full" src={localPreviewUrl || ''} controls />
                          </div>
                        );
                      }

                      if (yid && !form.formState.errors.content) {
                        return (
                          <div className="mt-3 aspect-video w-full overflow-hidden rounded-xl border border-border">
                            <iframe
                              className="w-full h-full"
                              src={`https://www.youtube.com/embed/${yid}`}
                              title="YouTube Video Preview"
                              allowFullScreen
                            />
                          </div>
                        );
                      }

                      if (str) {
                        return (
                          <div className="mt-3 aspect-video w-full overflow-hidden rounded-xl border border-border">
                            <video className="w-full h-full" src={str} controls />
                          </div>
                        );
                      }

                      return null;
                    })()}
                  </FormItem>
                );
              }}
            />

            <DialogFooter className="flex justify-end space-x-2">
              <FormFooter
                isLoading={isLoading}
                isValid={form.formState.isValid}
                onCancel={handleClose}
                onSubmitText={t(!!video ? 'edit' : 'add')}
                onCancelText={t('cancel')}
                loadingText={t('uploading')}
              />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>

      <CategoryModal
        openModal={isCategoryModalOpen}
        closeModal={() => {
          setIsCategoryModalOpen(false);
        }}
        selectCategory={handleNewCategoriesForFile}
        hideTrigger
      />
    </Dialog>
  );
}
