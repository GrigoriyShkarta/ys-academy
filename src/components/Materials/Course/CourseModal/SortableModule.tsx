import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function SortableModule({
  module,
  onRemove,
}: {
  module: { id: number; title: string; index?: number };
  onRemove: (id: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: module.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex justify-between items-center p-3 rounded-lg border border-input ${
        isDragging ? 'border-blue-400 shadow-lg' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center gap-2">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-5 h-5 text-gray-400" />
        </div>
        {isEditing ? (
          <Input value={module.title} className="border-none bg-transparent" />
        ) : (
          <span className="font-medium">{module.title}</span>
        )}
      </div>
      <div className="flex gap-2">
        {/*{isEditing ? (*/}
        {/*  <Check className="cursor-pointer hover:scale-110 transition" />*/}
        {/*) : (*/}
        {/*  <Edit*/}
        {/*    className="cursor-pointer hover:scale-110 transition"*/}
        {/*    onClick={() => setIsEditing(true)}*/}
        {/*  />*/}
        {/*)}*/}

        <Trash2
          color="red"
          className="cursor-pointer hover:scale-110 transition"
          onClick={() => onRemove(module.id)}
        />
      </div>
    </div>
  );
}
