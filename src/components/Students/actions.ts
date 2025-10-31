import axiosInstance from '@/services/axios';
import { CreateStudentFormValues } from '@/components/Students/studentsSchema';

export const getStudents = async () => {
  const { data } = await axiosInstance.get('/user/students');
  return data;
};

export const createStudent = async (form: CreateStudentFormValues) => {
  const { data } = await axiosInstance.post('/user', form);
  return data;
};
