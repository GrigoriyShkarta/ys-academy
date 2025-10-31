'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useTranslations } from 'next-intl';
import { CreateStudentFormValues, createStudentSchema } from '@/components/Students/studentsSchema';
import { generatePassword } from '@/components/Students/utils';
import { createStudent } from '@/components/Students/actions';

export default function CreateStudentModal() {
  const [open, setOpen] = useState(false);
  const t = useTranslations('Students');
  const form = useForm<CreateStudentFormValues>({
    resolver: zodResolver(createStudentSchema(t)),
    reValidateMode: 'onChange',
    mode: 'onTouched',
    defaultValues: {
      name: '',
      password: '',
      email: '',
    },
  });

  const onSubmit = async (data: CreateStudentFormValues) => {
    await createStudent(data);
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent w-[240px] mx-auto">{t('create_student')}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{t('creating_student')}</DialogTitle>
          <DialogDescription>{t('fill_student_info')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('name')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('email')}</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('password')}</FormLabel>
                  <div className="relative flex items-center">
                    <FormControl>
                      <Input
                        placeholder="••••••"
                        type={'text'}
                        autoComplete="current-password"
                        {...field}
                        className="pr-20"
                      />
                    </FormControl>
                    <div className="absolute right-0.5 flex space-x-1 top-0.5 h-full">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="px-2 rounded-[6px]"
                        onClick={() => generatePassword(8, form)}
                      >
                        {t('generate')}
                      </Button>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={!form.formState.isValid} className="bg-accent">
                {t('create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
