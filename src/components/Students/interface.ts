export interface Student {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  modules?: StudentModule[];
}

export interface StudentModule {
  id: number;
  title: string;
  url?: string;
  lessons: StudentLesson[];
}

export interface StudentLesson {
  id: number;
  title: string;
  access: boolean;
  access_blocks: number[];
  blocks: string;
}
