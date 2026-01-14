export type ColumnId = 'homework' | 'songs' | 'in-progress' | 'completed' | 'plans';

export interface Subtask {
  id: number;
  title: string;
  completed: boolean;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  columnId: ColumnId;
  order: number;
  subtasks: Subtask[];
}

export interface IColumn {
  id: ColumnId;
  title: string;
  color: string;
}