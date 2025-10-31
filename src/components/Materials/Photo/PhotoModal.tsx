import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { editPhoto, uploadPhoto } from '@/components/Materials/Photo/action';
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
import { Dropzone } from '@/common/Dropzone';
import { FormFooter } from '@/common/ModalFooter';
import { ContentFormValues, contentSchema } from '@/components/Materials/utils/materialSchemas';
import { IFile } from '@/components/Materials/utils/interfaces';

interface Props {
  photo: IFile | null;
  setSelectedFile: Dispatch<SetStateAction<IFile | null>>;
}

export default function PhotoModal({ photo, setSelectedFile }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('Materials');
  const tForm = useTranslations('Validation');
  const queryClient = useQueryClient();

  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentSchema(tForm)),
    reValidateMode: 'onChange',
    mode: 'onTouched',
    defaultValues: { title: '' },
  });

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
      await editPhoto(data.id, data);
    } else {
      await uploadPhoto(data);
    }
    await queryClient.invalidateQueries({ queryKey: ['photos'] });
    setOpen(false);
    form.reset();
    setIsLoading(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={value => {
        setOpen(value);
        setSelectedFile(null);
        form.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-accent w-[240px] mx-auto">{t('addPhoto')}</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{t(photo ? 'editPhoto' : 'addPhoto')}</DialogTitle>
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

            <Controller
              control={form.control}
              name="content"
              render={({ field: { onChange, value } }) => {
                return (
                  <FormItem>
                    <FormLabel>{t('file')}</FormLabel>
                    <FormControl>
                      <Dropzone
                        value={value}
                        onChange={onChange}
                        dragLabel={t('dragOrClick')}
                        accept={['image/']}
                        label={t('jpeg_or_png')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <DialogFooter className="flex justify-end space-x-2">
              <FormFooter
                isLoading={isLoading}
                isValid={form.formState.isValid}
                onCancel={() => setOpen(false)}
                onSubmitText={t('add')}
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
