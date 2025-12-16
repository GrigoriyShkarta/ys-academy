import { Student } from '@/components/Students/interface';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { StudentFormValues, studentSchema } from './schema';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Field } from '@/components/Students/Student/components/InfoUserModal/Field';
import { AvatarDropzone } from '@/common/AvatarDropZone';
import { AvatarCropper } from '@/common/AvatarCropper';
import { updateStudent } from '@/components/Students/Student/actions';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  open: boolean;
  close: () => void;
  student: Student;
}

export default function InfoUserModal({ open, close, student }: Props) {
  const t = useTranslations('Students');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(student?.photo ?? null);
  const [cropOpen, setCropOpen] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const client = useQueryClient();

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      id: student.id,
      name: student.name,
      email: student.email ?? '',
      telegram: student?.telegram ?? '',
      instagram: student?.instagram ?? '',
      birthDate: student?.birthDate ?? '',
      musicLevel: student?.musicLevel ?? '',
      vocalExperience: student?.vocalExperience ?? '',
      photo: student?.photo ?? '',
      goals: student.goals ?? '',
    },
  });

  const { register, handleSubmit, reset, formState } = form;

  useEffect(() => {
    reset({
      id: student.id,
      name: student.name,
      email: student.email ?? '',
      telegram: student?.telegram ?? '',
      instagram: student?.instagram ?? '',
      birthDate: student?.birthDate ?? '',
      musicLevel: student?.musicLevel ?? '',
      vocalExperience: student?.vocalExperience ?? '',
      goals: student?.goals ?? '',
      photo: student?.photo ?? '',
    });
    setPreview(student.photo ?? null);
  }, [student, reset]);

  const onSubmit = async (values: StudentFormValues) => {
    console.log('SUBMIT', values);
    try {
      await updateStudent(values);
      await client.invalidateQueries({ queryKey: ['student', values.id] });
    } catch (error) {
      console.log('error: ', error);
    } finally {
      close();
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

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6"
          >
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
            {/* ФИО */}
            <Field label={t('fullName')} required error={formState.errors.name?.message}>
              <Input {...register('name')} />
            </Field>

            {/* Email */}
            <Field label={t('email')} required error={formState.errors.email?.message}>
              <Input type="email" {...register('email')} />
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
              <Button type="submit">{t('save')}</Button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
