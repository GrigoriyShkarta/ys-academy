import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import LessonBlock from './LessonBlock';
import { Block } from '@blocknote/core';

interface SortableLessonBlockProps {
  id: number;
  blockId: number;
  lesson: Block[];
  onUpdate: (blockId: number, content: Block[]) => void;
  editable: boolean;
  deleteSection?: (blockId: number) => void;
  isLessonDetail?: boolean;
  isSelectBlock?: boolean;
  selectBlock?: (blockId: number) => void;
}

export function SortableLessonBlock({ id, ...props }: SortableLessonBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !props.editable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <LessonBlock {...props} attributes={attributes} listeners={listeners} />
    </div>
  );
}
