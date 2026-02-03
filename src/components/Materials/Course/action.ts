import { Course, GetMaterialParams, ModuleDTO } from '@/components/Materials/utils/interfaces';
import axiosInstance from '@/services/axios';
import qs from 'qs';

export const getCourses = async ({ search = '', categories }: GetMaterialParams) => {
  const { data } = await axiosInstance.get('/course', {
    params: { search, categories },
    paramsSerializer: params => {
      return qs.stringify(params, { arrayFormat: 'repeat' });
    },
  });
  return data;
};

export const createCourse = async (form: ModuleDTO) => {
  const { data } = await axiosInstance.post('/course/create', form);

  return data;
};

export const updateCourse = async (form: ModuleDTO, id: number) => {
  const { data } = await axiosInstance.put(`/course/${id}`, form);

  return data;
};

export const getCourse = async (id: number, userId?: number): Promise<Course> => {
  const { data } = await axiosInstance.get(`/course/${id}`, {
    params: { userId },
  });

  return data;
};

export const deleteCourse = async (id?: number) => {
  const { data } = await axiosInstance.delete(`/course/${id}`);
  return data;
};

export const reorderCourses = async (courses: { id: number; order: number }[]) => {
  const { data } = await axiosInstance.patch('/course/reorder', courses);
  return data;
};
