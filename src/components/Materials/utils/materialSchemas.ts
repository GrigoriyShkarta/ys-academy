import { z } from 'zod';

export const contentSchema = (t: (key: string) => string) =>
  z.object({
    id: z.number().optional(),
    title: z.string().optional(),
    categories: z.array(z.string()).optional(),
    isOther: z.boolean().optional(),
    content: z
      .union([
        z.instanceof(File),
        z.string().min(1, t('required_field')), // требуем непустую строку
      ])
      .or(z.literal('')) // чтобы избежать ошибки при вводе пустой строки
      .refine(val => val !== null && val !== '', {
        message: t('required_field'),
      }),
  });

export type ContentFormValues = z.infer<ReturnType<typeof contentSchema>>;
