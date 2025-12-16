import { z } from 'zod';

export const studentSchema = z.object({
  id: z.number(),
  name: z.string().min(2),
  email: z.string().email(),
  telegram: z.string().optional().or(z.literal('')),
  instagram: z.string().optional().or(z.literal('')),
  birthDate: z.string().optional().or(z.literal('')),
  musicLevel: z.string().optional().or(z.literal('')),
  vocalExperience: z.string().optional().or(z.literal('')),
  goals: z.string().optional().or(z.literal('')),
  photo: z.any().optional().or(z.literal('')),
});

export type StudentFormValues = z.infer<typeof studentSchema>;
