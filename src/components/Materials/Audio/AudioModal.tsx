'use client';

import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { editAudio, uploadAudio } from '@/components/Materials/Audio/action';
import { IFile } from '@/components/Materials/utils/interfaces';
import { ContentFormValues, contentSchema } from '@/components/Materials/utils/materialSchemas';
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
import { Button } from '@/components/ui/button';
import { Dropzone } from '@/common/Dropzone';
import { FormFooter } from '@/common/ModalFooter';

interface Props {
  audio: IFile | null;
  setSelectedFile: Dispatch<SetStateAction<IFile | null>>;
}

export default function AudioModal({ audio, setSelectedFile }: Props) {
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
    if (audio) {
      setOpen(true);
      form.reset({
        id: audio.id,
        content: audio.url,
        title: audio.title,
      });
    } else {
      form.reset({
        id: undefined,
        content: '',
        title: '',
      });
    }
  }, [audio]);

  const onSubmit = async (data: ContentFormValues) => {
    setIsLoading(true);
    if (data.id) {
      await editAudio(data.id, data);
    } else {
      await uploadAudio(data);
    }
    await queryClient.invalidateQueries({ queryKey: ['audios'] });
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
        <Button className="bg-accent w-[240px] mx-auto">{t('addAudio')}</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{t(audio ? 'editAudio' : 'addAudio')}</DialogTitle>
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
              render={({ field: { onChange, value } }) => (
                <FormItem>
                  <FormLabel>{t('file')}</FormLabel>
                  <FormControl>
                    <Dropzone
                      value={value}
                      onChange={onChange}
                      dragLabel={t('dragOrClick')}
                      accept={['audio/']}
                      label={t('mp3_or_wav')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex justify-end space-x-2">
              <FormFooter
                isLoading={isLoading}
                isValid={form.formState.isValid}
                onCancel={() => setOpen(false)}
                onSubmitText={t(audio ? 'edit' : 'add')}
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
