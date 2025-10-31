import { z } from 'zod';

export const loginSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string().min(1, t('validation.required_field')).email(t('validation.invalid_email')),
    password: z.string().min(1, t('validation.required_field')),
  });

export type LoginFormValues = z.infer<ReturnType<typeof loginSchema>>;
