'use client';

import { useState, useEffect, ReactNode } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trash2, Plus } from "lucide-react";
import { Task, ColumnId, Subtask } from "../interface";
import { cn } from "@/lib/utils";
import { createTask, updateTask } from "../actions";
import { TaskFormValues, taskSchema } from "../schema";
import { useQueryClient } from "@tanstack/react-query";

export default function TaskDialog({
  task,
  columnId,
  userId,
  trigger,
}: {
  task?: Task;
  columnId?: ColumnId;
  userId: number;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const client = useQueryClient()

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      subtasks: task?.subtasks || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subtasks",
  });

  // Reset form when task changes or modal opens
  useEffect(() => {
    if (open) {
      form.reset({
        title: task?.title || '',
        description: task?.description || '',
        subtasks: task?.subtasks || [],
      });
    }
  }, [open, task, form]);

  const onSubmit = async (values: TaskFormValues) => {
    const taskData = {
      title: values.title,
      description: values.description,
      columnId: task?.columnId || columnId!,
      subtasks: values?.subtasks,
    };

    if (task?.id) {
      await updateTask(userId, task.id, {
        title: values.title,
        description: values.description,
        subtasks: values.subtasks.map((s) => ({
          id: s.id || 0, // Fallback for new subtasks, though backend usually handles it
          title: s.title,
          completed: s.completed,
        })),
      });
    } else {
      await createTask(userId, taskData);
    }
    await client.invalidateQueries({
      queryKey: ['tasks', userId],
    })
    setOpen(false);
  };

  const addSubtask = () => {
    append({
      title: '',
      completed: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent 
        className="sm:max-w-[500px]"
        onInteractOutside={() => setOpen(false)}
        onEscapeKeyDown={() => setOpen(false)}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>{task ? 'Редагувати завдання' : 'Нове завдання'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Назва завдання *</FormLabel>
                  <FormControl>
                    <Input placeholder="Введіть назву..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Опис завдання</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Додайте опис..." 
                      className="resize-none" 
                      rows={3} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base">Підзадачі</FormLabel>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addSubtask}
                  className="h-8 gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Додати
                </Button>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <FormField
                        control={form.control}
                        name={`subtasks.${index}.completed`}
                        render={({ field }) => (
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="mt-1"
                            />
                          </FormControl>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`subtasks.${index}.title`}
                        render={({ field }) => (
                          <FormItem className="flex-1 space-y-0">
                            <FormControl>
                              <Input 
                                placeholder="Назва підзадачі..." 
                                {...field} 
                                className={cn(
                                  "h-9 transition-colors",
                                  form.watch(`subtasks.${index}.completed`) && "text-muted-foreground line-through bg-muted/50"
                                )}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <FormMessage className="ml-8" />
                  </div>
                ))}
                
                {fields.length === 0 && (
                  <p className="text-sm text-center text-muted-foreground py-4 border-2 border-dashed rounded-lg">
                    Немає підзадач. Натисніть "Додати", щоб створити.
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full bg-accent" disabled={form.formState.isSubmitting || !form.formState.isValid}>
              {task ? 'Зберегти зміни' : 'Створити завдання'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}