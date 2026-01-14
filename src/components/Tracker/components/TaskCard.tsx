import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useSortable } from "@dnd-kit/sortable";
import { Checkbox } from "@/components/ui/checkbox";
import { GripVertical, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "../interface";
import { cn } from "@/lib/utils";
import TaskDialog from "./TaskModal";
import { useUser } from "@/providers/UserContext";

interface TaskCardProps {
  task: Task;
  userId: number;
  onDelete: () => void;
  onToggleSubtask: (subtaskId: number, completed: boolean) => void;
  isOverlay?: boolean;
}

export default function TaskCard({ 
  task, 
  userId, 
  onDelete, 
  onToggleSubtask,
  isOverlay 
}: TaskCardProps) {
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isSubtasksExpanded, setIsSubtasksExpanded] = useState(false);

  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging 
  } = useSortable({
    id: task.id,
  });

  const {user} = useUser();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  const completedSubtasks = task.subtasks.filter(s => s.completed).length;
  const totalSubtasks = task.subtasks.length;
  const completionPercentage = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
  
  const displayedSubtasks = isSubtasksExpanded ? task.subtasks : task.subtasks.slice(0, 3);
  const hasMoreSubtasks = totalSubtasks > 3;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "mb-3 group outline-none select-none touch-none",
        isOverlay && "cursor-grabbing"
      )}
      {...attributes}
      {...listeners}
    >
      <Card className={cn(
        "relative overflow-hidden cursor-grab active:cursor-grabbing py-0 gap-1.5 flex flex-col",
        "bg-card/60 backdrop-blur-sm border-border/40 transition-all duration-300",
        "hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-0.5",
        isDragging && "shadow-2xl border-primary ring-2 ring-primary/20",
        isOverlay && "shadow-2xl border-primary ring-2 ring-primary/30 rotate-[2deg] scale-[1.02]"
      )}>
        {/* Subtle Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        <CardHeader className="p-4 pb-0 pt-3 space-y-0 gap-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-[15px] font-bold text-foreground/90 leading-snug break-words group-hover:text-primary transition-colors">
                {task.title}
              </CardTitle>
            </div>
            
            {totalSubtasks > 0 && (
              <div className="relative w-9 h-9 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-9 h-9 transform -rotate-90">
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    fill="none"
                    className="text-muted/20"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 15}`}
                    strokeDashoffset={`${2 * Math.PI * 15 * (1 - completionPercentage / 100)}`}
                    className={cn(
                      "transition-all duration-700 ease-out",
                      completionPercentage === 100 ? "text-emerald-500" : "text-primary"
                    )}
                  />
                </svg>
                <span className="absolute text-[9px] font-black tracking-tighter text-foreground/80">
                  {completionPercentage}%
                </span>
              </div>
            )}
          </div>
        </CardHeader>

        {task.description && (
          <CardContent 
            className="px-4 pt-0 pb-2 pt-1"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="relative group/desc">
              <p className={cn(
                "text-[12px] text-muted-foreground leading-relaxed transition-all duration-300",
                !isDescExpanded && "line-clamp-2"
              )}>
                {task.description}
              </p>
              {task.description.length > 60 && (
                <button 
                  onClick={() => setIsDescExpanded(!isDescExpanded)}
                  className="text-[10px] text-primary hover:underline font-semibold mt-0.5"
                >
                  {isDescExpanded ? 'Згорнути' : 'Читати далі...'}
                </button>
              )}
            </div>
          </CardContent>
        )}

        {totalSubtasks > 0 && (
          <CardContent 
            className="px-4 pb-4 pt-1 space-y-1.5"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1 p-2 rounded-xl bg-muted/30 border border-border/10">
              {displayedSubtasks.map(subtask => (
                <div 
                  key={subtask.id} 
                  className="flex items-center gap-2.5 group/subtask p-1 rounded-md hover:bg-background/50 transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSubtask(subtask.id, !subtask.completed);
                  }}
                >
                  <Checkbox
                    id={`subtask-${subtask.id}`}
                    checked={subtask.completed}
                    onCheckedChange={(checked) => onToggleSubtask(subtask.id, checked as boolean)}
                    className={cn(
                      "w-3.5 h-3.5 rounded-sm border-muted-foreground/40 transition-all",
                      "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                    )}
                  />
                  <label
                    htmlFor={`subtask-${subtask.id}`}
                    className={cn(
                      "text-[11px] font-medium leading-none cursor-pointer select-none transition-all",
                      subtask.completed ? 'line-through text-muted-foreground/60' : 'text-foreground/80'
                    )}
                  >
                    {subtask.title}
                  </label>
                </div>
              ))}
              
              {hasMoreSubtasks && (
                <button 
                  onClick={() => setIsSubtasksExpanded(!isSubtasksExpanded)}
                  className="text-[10px] text-muted-foreground hover:text-primary font-bold transition-colors pt-1 px-1 text-left"
                >
                  {isSubtasksExpanded ? 'Приховати' : `Ще ${totalSubtasks - 3} підзадач(і)...`}
                </button>
              )}
            </div>
          </CardContent>
        )}

        {(user!.role === 'super_admin') && (
          <div 
            className={cn(
              "px-3 pb-3 flex items-center justify-end transition-all duration-300",
              "translate-y-1",
              isOverlay && "opacity-0"
            )}
            onPointerDown={(e) => e.stopPropagation()}
          >

            <div className="flex gap-1">
              <TaskDialog 
                task={task}
                userId={userId} 
                trigger={
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors">
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                }
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
