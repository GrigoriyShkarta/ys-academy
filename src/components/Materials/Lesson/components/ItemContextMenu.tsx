import { Edit, Menu, Trash2 } from 'lucide-react';
import { LessonItemType } from '../../utils/interfaces';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface Props {
  type: LessonItemType;
  editAction: () => void;
  deleteAction: () => void;
}

export default function ItemContextMenu({ type, editAction, deleteAction }: Props) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="drag-handle w-[40px] h-[40px] flex justify-center items-center absolute right-0 top-0 z-60 cursor-move select-none p-1 bg-white/80 dark:bg-black/60 rounded text-sm">
          <Menu size={14} />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-40">
        {type === 'text' && (
          <ContextMenuItem
            onClick={e => {
              e.stopPropagation();
              editAction();
            }}
          >
            <Edit className="mr-2 h-4 w-4" /> Редактировать
          </ContextMenuItem>
        )}
        <ContextMenuItem
          onClick={e => {
            e.stopPropagation();
            deleteAction();
          }}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" /> Удалить
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
