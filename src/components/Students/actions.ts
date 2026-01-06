import axiosInstance from '@/services/axios';
import { CreateStudentFormValues } from '@/components/Students/studentsSchema';

export const getStudents = async (
  search?: string,
  page?: number | string,
  withStudent?: boolean
) => {
  const { data } = await axiosInstance.get('/user/students', {
    params: { search, page, withStudent },
  });
  return data;
};

export const createStudent = async (form: CreateStudentFormValues) => {
  const { data } = await axiosInstance.post('/user', form);
  return data;
};

export const deleteUser = async (id: number) => {
  const { data } = await axiosInstance.delete(`/user/${id}`);
  return data;
};
