import axiosInstance from '@/services/axios';
import { GetMaterialParams } from '@/components/Materials/utils/interfaces';

export const createLesson = async (formData: FormData) => {
  const { data } = await axiosInstance.post('/lesson/create', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data;
};

export const updateLesson = async (id: number, formData: FormData) => {
  const { data } = await axiosInstance.post(`/lesson/update/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data;
};

export const deleteLesson = async (id: number) => {
  const { data } = await axiosInstance.delete(`/lesson/${id}`);
  return data;
};

export const getUnassignedLessons = async ({ search, page }: GetMaterialParams) => {
  const { data } = await axiosInstance.get('/lesson/unassigned', {
    params: { search, page },
  });
  return data;
};

export const getLesson = async (id: number) => {
  const { data } = await axiosInstance.get(`/lesson/${id}`);
  return data;
};
