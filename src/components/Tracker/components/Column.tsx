import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Task, IColumn } from "../interface";
import TaskDialog from "./TaskModal";
import TaskCard from "./TaskCard";
import { useUser } from "@/providers/UserContext";
import { cn } from "@/lib/utils";

interface ColumnProps {
  column: IColumn;
  tasks: Task[];
  userId: number;
  onDeleteTask: (taskId: number) => void;
  onToggleSubtask: (taskId: number, subtaskId: number, completed: boolean) => void;
}

export default function Column({ 
  column, 
  tasks,
  userId,
  onDeleteTask, 
  onToggleSubtask 
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const {user} = useUser();

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      <div 
        ref={setNodeRef}
        className={cn(
          "flex-1 bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-4 transition-all duration-200 shadow-sm",
          isOver && "bg-primary/5 border-primary/30 ring-2 ring-primary/10 scale-[1.01]"
        )}
      >
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-2.5">
            <div className={cn("w-2.5 h-2.5 rounded-full shadow-lg", column.color)} />
            <div className="flex flex-col">
              <h3 className="font-bold text-foreground/90">{column.title}</h3>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest leading-none mt-0.5">
                {tasks.length} {tasks.length === 1 ? 'завдання' : 'завдань'}
              </span>
            </div>
          </div>

          {user?.role === 'super_admin' && (
            <TaskDialog columnId={column.id} userId={userId} trigger={
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors border border-transparent hover:border-primary/20"
              >
                <Plus className="w-4 h-4" />
              </Button>
            } />
          )}
        </div>

        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                userId={userId}
                onDelete={() => onDeleteTask(task.id)}
                onToggleSubtask={(subtaskId: number, completed: boolean) => onToggleSubtask(task.id, subtaskId, completed)}
              />
            ))}
            
            {tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-border/30 rounded-xl bg-muted/5">
                <p className="text-xs text-muted-foreground font-medium text-center uppercase tracking-tight">
                  Порожньо
                </p>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
