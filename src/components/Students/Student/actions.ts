import axiosInstance from '@/services/axios';
import { Student } from '@/components/Students/interface';

export const getStudent = async (id: number): Promise<Student> => {
  const { data } = await axiosInstance.get(`/user/${id}`);
  return data;
};
