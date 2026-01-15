
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
import { COLUMNS, TASK_COLUMNS, SONG_COLUMNS } from "@/lib/consts";
import { Task, ColumnId } from "./interface";
import { LayoutList, CheckCircle2, Music2, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useUser } from "@/providers/UserContext";
import { useQuery, keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { deleteTask, getTasks, moveTask, toggleSubtask } from "./actions";
import { useRouter } from "next/navigation";
import Loader from "@/common/Loader";

export default function TrackerLayout({id, isProfile}: {id?: number, isProfile?: boolean}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [currentTab, setCurrentTab] = useState<'tasks' | 'songs'>('tasks');
  const {user} = useUser();
  const client = useQueryClient();
  const router = useRouter();

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', id ?? user?.id],
    queryFn: () => getTasks((id ?? user?.id) || 0),
    placeholderData: keepPreviousData,
    enabled: !!id || !!user?.id,
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

    let targetColumnId = overId;
    if (!isColumn) {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) {
        targetColumnId = overTask.columnId;
      }
    }

    setTasks(prev => {
      const activeIndex = prev.findIndex(t => t.id === activeId);
      let overIndex = prev.findIndex(t => t.id === overId);

      if (isColumn) {
        // Drop on empty column
        if (activeTask.columnId === targetColumnId) return prev; // No change

        const updated = [...prev];
        updated[activeIndex] = { ...updated[activeIndex], columnId: targetColumnId as ColumnId };
        return updated;
      }

      // Drop on another task (reorder or move to column)
      if (activeId === overId) return prev;

      let updated = [...prev];
      if (activeTask.columnId !== targetColumnId) {
        updated[activeIndex] = { ...updated[activeIndex], columnId: targetColumnId };
      }
      
      return arrayMove(updated, activeIndex, overIndex);
    });

    await moveTask(activeId, {userId: id ?? user!.id, columnId: targetColumnId, newOrder: activeId});

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

  const onToggleSubtask = async (taskId: number, subtaskId: number, completed: boolean) => {
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
    await toggleSubtask(taskId, subtaskId, id ?? user!.id, completed);
    await client.invalidateQueries({ queryKey: ['tasks'] });
  };

  const getTasksByColumn = (columnId: ColumnId) => {
    return tasks.filter(t => t.columnId === columnId);
  };

  const columns = currentTab === 'tasks' ? TASK_COLUMNS : SONG_COLUMNS;

  const activeTask = tasks.find(t => t.id === activeId);

  // Stats calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.columnId === 'completed').length;

  if (isLoading) return <Loader />;
  if (!id && !user) return null

  return (
    <div className={`relative ${isProfile ? 'h-1/2' : 'h-screen'} bg-transparent w-full flex flex-col overflow-hidden`}>
      {!isProfile && <div className="flex-none p-4 sm:p-8 md:p-10 pb-0">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors mb-4"
          aria-label="Назад"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">Назад</span>
        </button>
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
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
            
            <div className="flex bg-muted p-1 rounded-xl">
              <button
                onClick={() => setCurrentTab('tasks')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentTab === 'tasks' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Завдання
              </button>
              <button
                onClick={() => setCurrentTab('songs')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentTab === 'songs' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Пісні
              </button>
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
      </div>
    }

      {/* Board Section */}
      <div className="flex-1 min-h-0">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className={`flex gap-4 md:gap-6 overflow-x-auto ${isProfile ? 'h-[50vh] px-2' : 'h-full px-10'} pb-6 pt-2 snap-x snap-mandatory scroll-smooth`}>
            {columns.map((column, index) => (
              <motion.div
                key={column.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="snap-center snap-always min-w-[300px] md:min-w-[320px] lg:flex-1 h-full flex flex-col pb-4"
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
