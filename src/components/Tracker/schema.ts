import z from "zod";

export const subtaskSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, 'Назва підзадачі обов\'язкова'),
  completed: z.boolean(),
});

export const taskSchema = z.object({
  title: z.string().min(1, 'Назва завдання обов\'язкова'),
  description: z.string().optional(),
  subtasks: z.array(subtaskSchema),
});

export type TaskFormValues = z.infer<typeof taskSchema>;