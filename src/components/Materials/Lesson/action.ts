import axiosInstance from '@/services/axios';
import { GetMaterialParams, LessonDocItem } from '@/components/Materials/utils/interfaces';

export const createLesson = async (
  lessons: LessonDocItem[],
  lessonTitle: string,
  cover?: string
) => {
  const formatedLesson = {
    title: lessonTitle,
    blocks: lessons,
    cover,
  };
  const { data } = await axiosInstance.post('/lesson/create', formatedLesson);

  return data;
};

export const updateLesson = async (
  id: number,
  lessons: LessonDocItem[],
  lessonTitle: string,
  cover?: string
) => {
  const formatedLesson = {
    title: lessonTitle,
    blocks: lessons,
    cover,
  };

  const { data } = await axiosInstance.post(`/lesson/update/${id}`, formatedLesson);

  return data;
};

export const deleteLesson = async (id: number | number[]) => {
  const { data } = await axiosInstance.delete(`/lesson/${id}`);
  return data;
};

export const getAllLessons = async ({
  page,
  search = '',
  sortBy,
  sortOrder,
}: GetMaterialParams) => {
  const { data } = await axiosInstance.get('/lesson', {
    params: { page, search, sortBy, sortOrder },
  });
  return data;
};

export const getLesson = async (id: number) => {
  const { data } = await axiosInstance.get(`/lesson/${id}`);
  return data;
};

export const assignLesson = async (userIds: number[], lessonIds?: number | number[]) => {
  const { data } = await axiosInstance.post('/lesson/assign', {
    lessonIds,
    userIds,
  });
  return data;
};
