import { Category } from '@/components/Materials/utils/interfaces';

export interface Student {
  id: number;
  name: string;
  isActive: boolean;
  email: string;
  photo?: File | string | null;
  telegram?: string;
  city?: string;
  instagram?: string;
  birthDate?: string | Date | null;
  musicLevel?: string;
  vocalExperience?: string;
  goals?: string;
  modules?: StudentModule[];
  courses?: StudentCourse[];
  subscriptions?: StudentSubscription[];
  password?: string;
  accessExpiryDate?: string;
  notifications?: Notification[];
}

export interface Notification {
  id: number;
  title: string;
  read: boolean;
  createdAt: string;
}

export interface StudentModule {
  id: number;
  title: string;
  url?: string;
  access: boolean;
  progress: number;
  lessons: StudentLesson[];
  categories: Category[];
}

export interface StudentLesson {
  id: number;
  title: string;
  access: boolean;
  access_blocks: number[];
  categories: Category[];
  accessBlocks: string;
  accessString: string;
}

export interface StudentCourse {
  id: number;
  title: string;
  access: boolean;
  url?: string;
  modules: StudentModule[];
  categories: Category[];
  progress: number;
  lessons?: StudentLesson[];
}

export interface StudentSubscription {
  id: number;
  paymentStatus: string;
  amount: number;
  paymentDate?: string;
  lessonDays?: string[];
  createdAt: string;
  subscription: {
    id: number;
    title: string;
    price: number;
  };
  lessons: StudentSubscriptionLesson[];
}

export interface StudentSubscriptionLesson {
  id: number;
  scheduledAt: string;
  status: string;
  recordingUrl?: string;
}
