import { Layout } from 'react-grid-layout';

export interface IFile {
  id: number;
  title: string;
  url: string;
}

export interface IText {
  id: number;
  title: string;
  content: string;
}

export interface GetMaterialParams {
  page?: number | 'all';
  search?: string;
}

export type BlockSource = 'custom' | 'bank';

export type LessonItemType = 'text' | 'image' | 'audio' | 'video';

export interface LessonItem {
  id?: string;
  type: LessonItemType;
  content: string | File;
  source: BlockSource;
  bankId?: number;
  audioPublicId?: string;
  videoPublicId?: string;
  photoPublicId?: string;
  layout?: Layout | string;
}

export interface LessonBlockType {
  id: number;
  items: LessonItem[];
  title: string;
}

export interface Lesson {
  title: string;
  blocks: LessonBlockType[];
}

export interface Module {
  id: number;
  title: string;
  url?: string;
  lessons?: {
    id: number;
    title: string;
    index?: number;
  }[];
}
