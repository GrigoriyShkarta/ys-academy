export type ColumnId = 'homework' | 'songs' | 'in_progress' | 'completed' | 'plans' | 'song_plans' | 'song_in_progress' | 'song_ready';

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