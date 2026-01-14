
'use client'

import { 
  DragStartEvent, 
  DragEndEvent, 
  DndContext, 
  closestCorners, 
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useEffect, useState } from "react";
import TaskCard from "./components/TaskCard";
import Column from "./components/Column";
import { COLUMNS } from "@/lib/consts";
import { Task, ColumnId } from "./interface";

import { useTranslations } from "next-intl";
import { LayoutList, CheckCircle2, Clock, Music2, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useUser } from "@/providers/UserContext";
import { useQuery, keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { deleteTask, getTasks, moveTask } from "./actions";
import { useRouter } from "next/navigation";

export default function TrackerLayout({id}: {id?: number}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const {user} = useUser();
  const client = useQueryClient();
  const router = useRouter();
  const t = useTranslations('Widgets');

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', id ?? user!.id],
    queryFn: () => getTasks(id ?? user!.id),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (tasksData) {
      setTasks(tasksData);
    }
  }, [tasksData]);
  
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10,
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);


  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id as any;

    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    const isColumn = COLUMNS.some(c => c.id === overId);
    
    setTasks(prev => {
      const activeIndex = prev.findIndex(t => t.id === activeId);
      let overIndex = prev.findIndex(t => t.id === overId);

      if (isColumn) {
        // Drop on empty column
        const newColumnId = overId as ColumnId;
        if (activeTask.columnId === newColumnId) return prev; // No change

        const updated = [...prev];
        updated[activeIndex] = { ...updated[activeIndex], columnId: newColumnId };
        return updated;
      }

      // Drop on another task (reorder or move to column)
      const overTask = prev.find(t => t.id === overId);
      if (!overTask) return prev;

      if (activeId === overId) return prev;

      let updated = [...prev];
      if (activeTask.columnId !== overTask.columnId) {
        updated[activeIndex] = { ...updated[activeIndex], columnId: overTask.columnId };
      }
      
      return arrayMove(updated, activeIndex, overIndex);
    });

    await moveTask(activeId, {userId: id ?? user!.id, columnId: overId, newOrder: activeId});

    setActiveId(null);
  };

  const onDeleteTask = async (taskId: number) => {
    try {
      await deleteTask(taskId);
      await client.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const onToggleSubtask = (taskId: number, subtaskId: number, completed: boolean) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          subtasks: task.subtasks.map(s => 
            s.id === subtaskId ? { ...s, completed } : s
          )
        };
      }
      return task;
    }));
  };

  const getTasksByColumn = (columnId: ColumnId) => {
    return tasks.filter(t => t.columnId === columnId);
  };

  const activeTask = tasks.find(t => t.id === activeId);

  // Stats calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.columnId === 'completed').length;

  return (
    <div className="relative min-h-screen bg-transparent max-h-screen overflow-auto w-full">
      <div className="p-4 sm:p-8 md:p-10 w-full mx-auto">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center"
          aria-label="Назад"
        >
          <ChevronLeft />
          <span>Назад</span>
        </button>
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 mt-16 md:mt-0">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <LayoutList className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Трекер
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-4 sm:gap-6">
            <div className="bg-card/50 backdrop-blur-sm border border-border px-5 py-3 rounded-2xl flex flex-col items-center sm:items-start min-w-[120px]">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Всього</span>
              <div className="flex items-center gap-2">
                <Music2 className="w-4 h-4 text-primary" />
                <span className="text-2xl font-bold">{totalTasks}</span>
              </div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border px-5 py-3 rounded-2xl flex flex-col items-center sm:items-start min-w-[120px]">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Завершено</span>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-2xl font-bold">{completedTasks}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Board Section */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 md:gap-6 overflow-x-auto pt-4 px-6 pb-8 snap-x snap-mandatory h-content">
            {COLUMNS.map((column, index) => (
              <motion.div
                key={column.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="snap-center snap-always min-w-[300px] md:min-w-[320px] lg:flex-1"
              >
                <Column 
                  column={column} 
                  tasks={getTasksByColumn(column.id)} 
                  userId={id ?? user!.id}
                  onDeleteTask={onDeleteTask}
                  onToggleSubtask={onToggleSubtask}
                />
              </motion.div>
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="opacity-90 scale-105 pointer-events-none drop-shadow-2xl">
                <TaskCard
                  task={activeTask}
                  userId={id ?? user!.id}
                  onDelete={() => {}}
                  onToggleSubtask={() => {}}
                  isOverlay
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
