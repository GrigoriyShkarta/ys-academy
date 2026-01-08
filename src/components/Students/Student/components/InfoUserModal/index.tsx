'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Field } from './Field'; // твой кастомный компонент Field
import { AvatarDropzone } from '@/common/AvatarDropZone';
import { AvatarCropper } from '@/common/AvatarCropper';
import { StudentFormValues, studentSchema } from './schema';
import { useTranslations } from 'next-intl';
import { useUser } from '@/providers/UserContext';
import { updateStudent } from '@/components/Students/Student/actions';
import { generatePassword } from '@/components/Students/utils';
import { Student } from '@/components/Students/interface';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Props {
  open: boolean;
  close: () => void;
  student: Student;
}

export default function InfoUserModal({ open, close, student }: Props) {
  const t = useTranslations('Students');
  const client = useQueryClient();
  const { user } = useUser();

  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>((student?.photo as string) ?? null);
  const [cropOpen, setCropOpen] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      id: student.id,
      name: student.name,
      city: student?.city,
      email: student.email ?? '',
      telegram: student.telegram ?? '',
      instagram: student.instagram ?? '',
      birthDate: student?.birthDate
        ? new Date(student.birthDate).toISOString().split('T')[0]
        : '',
      musicLevel: student.musicLevel ?? '',
      vocalExperience: student.vocalExperience ?? '',
      goals: student.goals ?? '',
      photo: student.photo ?? '',
      isActive: student.isActive,
      accessExpiryDate: student?.accessExpiryDate
        ? new Date(student.accessExpiryDate).toISOString().split('T')[0]
        : '',
      password: '',
    },
  });

  const { handleSubmit, reset, formState, register, control } = form;

  useEffect(() => {
    reset({
      id: student.id,
      name: student.name,
      email: student.email ?? '',
      city: student?.city ?? '',
      telegram: student.telegram ?? '',
      instagram: student.instagram ?? '',
      birthDate: student?.birthDate
        ? new Date(student.birthDate).toISOString().split('T')[0]
        : '',
      musicLevel: student.musicLevel ?? '',
      vocalExperience: student.vocalExperience ?? '',
      goals: student.goals ?? '',
      photo: student.photo ?? '',
      isActive: student.isActive,
      accessExpiryDate: student?.accessExpiryDate
        ? new Date(student.accessExpiryDate).toISOString().split('T')[0]
        : '',
      password: '',
    });
    setPreview((student.photo as string) ?? null);
  }, [student, reset]);

  const onSubmit = async (values: StudentFormValues) => {
    setLoading(true);

    const data = {
      ...values,
      photo: avatar ?? '',
    };

    try {
      await updateStudent(data);
      await client.invalidateQueries({ queryKey: ['student', values.id] });
      close();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-[1024px] max-h-[90vh] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl">{t('editStudent')}</DialogTitle>
          </DialogHeader>

          <FormProvider {...form}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6"
            >
              {/* Фото */}
              <AvatarDropzone
                preview={preview}
                onSelect={(_, rawPreview) => {
                  setRawImage(rawPreview);
                  setCropOpen(true);
                }}
              />
              {rawImage && (
                <AvatarCropper
                  open={cropOpen}
                  image={rawImage}
                  onClose={() => setCropOpen(false)}
                  onCropComplete={(file, croppedPreview) => {
                    setAvatar(file);
                    setPreview(croppedPreview);
                  }}
                />
              )}

              <div className="flex flex-col gap-6">
                <Field label={t('fullName')} required error={formState.errors.name?.message}>
                  <Input {...register('name')} />
                </Field>

                {/* Пароль (только для супер-админа) */}
                {user?.role === 'super_admin' && (
                  <Field label={t('password')} className="md:col-span-2">
                    <div className="relative flex items-center">
                      <Input
                        placeholder="••••••"
                        type="text"
                        {...register('password')}
                        className="pr-20"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="absolute right-0 top-[1px] px-2 rounded-[6px] h-[95%]"
                        onClick={() => generatePassword(8, form)}
                      >
                        {t('generate')}
                      </Button>
                    </div>
                  </Field>
                )}
                {user?.role === 'super_admin' && (
                  <Field
                    label={t('access_data')}
                    error={formState.errors?.accessExpiryDate?.message}
                  >
                    <Input type="date" {...register('accessExpiryDate')} />
                  </Field>
                )}
              </div>
              {/* ФИО */}

              {/* Email */}
              <Field label={t('email')} required error={formState.errors.email?.message}>
                <Input type="email" {...register('email')} />
              </Field>

              {user?.role === 'super_admin' && (
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label className="">{t('status')}</Label>

                      <Select
                        value={field.value ? 'active' : 'inactive'}
                        onValueChange={value => field.onChange(value === 'active')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectStatus')} />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="active">{t('active')}</SelectItem>
                          <SelectItem value="inactive">{t('inactive')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
              )}

              {/* City */}
              <Field label={t('city')}>
                <Input {...register('city')} />
              </Field>

              {/* Telegram */}
              <Field label={t('telegram')}>
                <Input placeholder="@username" {...register('telegram')} />
              </Field>

              {/* Instagram */}
              <Field label={t('instagram')}>
                <Input placeholder="@username" {...register('instagram')} />
              </Field>

              {/* Дата рождения */}
              <Field label={t('birthDate')}>
                <Input type="date" {...register('birthDate')} />
              </Field>

              {/* Музыкальный уровень */}
              <Field
                label={t('musicLevel')}
                error={formState.errors.musicLevel?.message}
                className="md:col-span-2"
              >
                <Textarea rows={3} {...register('musicLevel')} />
              </Field>

              {/* Вокальный опыт */}
              <Field
                label={t('vocalExperience')}
                error={formState.errors.vocalExperience?.message}
                className="md:col-span-2"
              >
                <Textarea rows={3} {...register('vocalExperience')} />
              </Field>

              {/* Цели */}
              <Field
                label={t('goals')}
                error={formState.errors.goals?.message}
                className="md:col-span-2"
              >
                <Textarea rows={3} {...register('goals')} />
              </Field>

              {/* Actions */}
              <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={close}>
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !form.formState.isValid}
                  className="bg-accent"
                >
                  {t('save')}
                </Button>
              </div>
            </form>
          </FormProvider>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
