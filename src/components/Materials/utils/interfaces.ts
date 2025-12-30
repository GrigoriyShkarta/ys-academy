import { Layout } from 'react-grid-layout';
import { Block } from '@blocknote/core';
import { StudentModule } from '@/components/Students/interface';

export interface IFile {
  id: number;
  title: string;
  url?: string;
  createdAt?: string;
  color?: string;
  lessons?: Lesson[];
  categories?: Category[];
  modules?: Module[];
  index?: number;
  progress?: number;
  price?: number;
  lessons_count?: number;
}

export interface Category {
  id: number;
  title: string;
  color?: string;
}

export interface Lesson {
  id: number;
  title: string;
}

export interface GetMaterialParams {
  page?: number | 'all';
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  categories?: string[];
}

export type BlockSource = 'custom' | 'bank';

export type LessonItemType = 'text' | 'image' | 'audio' | 'video';

export interface LessonItem {
  id?: string;
  type: LessonItemType;
  content: string | File;
  source?: BlockSource;
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

export interface ModuleDTO {
  title: string;
  url?: string;
  publicImgId?: string;
  lessons?: {
    id: number;
    order: number;
  }[];
  categories?: string[];
}

export interface Module {
  id: number;
  title: string;
  url?: string;
  categories?: Category[];
  lessons?: {
    id: number;
    title: string;
    order?: number;
  }[];
}

export interface Course {
  id: number;
  title: string;
  url?: string;
  modules: StudentModule[];
  categories?: Category[];
}

export interface LessonDocItem {
  blockId: number;
  content: Block[];
}

export interface Subscription {
  id: number;
  title: string;
  price: number;
  lessons_count: number;
}
