import axiosInstance from '@/services/axios';
import { GetMaterialParams, LessonDocItem } from '@/components/Materials/utils/interfaces';
import qs from 'qs';

export const createLesson = async (
  lessons: LessonDocItem[],
  lessonTitle: string,
  cover?: string,
  coverPublicId?: string,
  categoryIds?: string[],
  moduleIds?: string[]
) => {
  const formatedLesson = {
    title: lessonTitle,
    blocks: lessons,
    cover,
    publicImgId:coverPublicId,
    categoryIds,
    moduleIds,
  };

  const { data } = await axiosInstance.post('/lesson/create', formatedLesson);

  return data;
};

export const updateLesson = async (
  id: number,
  lessons: LessonDocItem[],
  lessonTitle: string,
  cover?: string,
  coverPublicId?: string,
  categoryIds?: string[],
  moduleIds?: string[]
) => {
  const formatedLesson = {
    title: lessonTitle,
    blocks: lessons,
    cover,
    publicImgId:coverPublicId,
    categoryIds,
    moduleIds,
  };

  const { data } = await axiosInstance.post(`/lesson/update/${id}`, formatedLesson);

  return data;
};

export const deleteLesson = async (id: number[]) => {
  const { data } = await axiosInstance.delete(`/lesson`, {
    data: { ids: id },
  });
  return data;
};

export const getAllLessons = async ({
  page,
  search = '',
  sortBy,
  sortOrder,
  categories,
}: GetMaterialParams) => {
  const { data } = await axiosInstance.get('/lesson', {
    params: { page, search, sortBy, sortOrder, categories },
    paramsSerializer: params => {
      return qs.stringify(params, { arrayFormat: 'repeat' });
    },
  });
  return data;
};

export const getLesson = async (id: number) => {
  const { data } = await axiosInstance.get(`/lesson/${id}`);
  return data;
};

export const assignLesson = async (
  userIds: number[],
  lessonIds?: ({ id: number } | { id: number; remove: boolean })[],
  replaceAll?: boolean
) => {
  const { data } = await axiosInstance.post('/lesson/assign', {
    lessonIds,
    userIds,
    replaceAll,
  });
  return data;
};
