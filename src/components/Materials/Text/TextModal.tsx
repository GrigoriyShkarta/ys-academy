'use client';

import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import dynamic from 'next/dynamic';
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
import { IText } from '@/components/Materials/utils/interfaces';
import { zodResolver } from '@hookform/resolvers/zod';
import { editText, uploadText } from '@/components/Materials/Text/action';
import { quillFormats, quillModules } from '@/lib/utils';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
// Загружаем стили редактора только на клиенте
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - динамический импорт стилей
  import('react-quill-new/dist/quill.snow.css');
}

interface Props {
  text: IText | null;
  setSelectedText: Dispatch<SetStateAction<IText | null>>;
}

export default function TextModal({ text, setSelectedText }: Props) {
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
    if (text) {
      setOpen(true);
      form.reset({
        id: text.id,
        content: text.content,
        title: text.title,
      });
    } else {
      form.reset({
        id: undefined,
        content: '',
        title: '',
      });
    }
  }, [text]);

  const onSubmit = async (data: ContentFormValues) => {
    setIsLoading(true);
    if (data.id) {
      // await editText(data.id, data);
    } else {
      await uploadText(data);
    }
    await queryClient.invalidateQueries({ queryKey: ['texts'] });
    setOpen(false);
    form.reset();
    setIsLoading(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={value => {
        setOpen(value);
        setSelectedText(null);
        form.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-accent w-[240px] mx-auto">{t('addText')}</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto [scrollbar-gutter:stable]">
        <DialogHeader>
          <DialogTitle>{t(text ? 'editText' : 'addText')}</DialogTitle>
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
            <div>
              <Controller
                name="content"
                control={form.control}
                render={({ field }) => (
                  <ReactQuill
                    theme="snow"
                    value={typeof field.value === 'string' ? field.value : ''}
                    onChange={field.onChange}
                    modules={quillModules}
                    formats={quillFormats}
                  />
                )}
              />
            </div>

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
