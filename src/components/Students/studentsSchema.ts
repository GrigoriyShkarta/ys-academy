import * as z from 'zod';

export const createStudentSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t('validation.required_field')),
    email: z.string().min(1, t('validation.required_field')).email(t('validation.invalid_email')),
    password: z.string().min(1, t('validation.required_field')),
  });

export type CreateStudentFormValues = z.infer<ReturnType<typeof createStudentSchema>>;
