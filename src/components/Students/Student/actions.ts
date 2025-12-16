import axiosInstance from '@/services/axios';
import { Student } from '@/components/Students/interface';

export const getStudent = async (id: number): Promise<Student> => {
  const { data } = await axiosInstance.get(`/user/${id}`);
  return data;
};

export const updateStudent = async (student: Student) => {
  const formData = new FormData();

  // обязательные / базовые
  formData.append('email', student.email);
  formData.append('name', student.name);
  formData.append('telegram', student?.telegram ?? '');
  formData.append('instagram', student?.instagram ?? '');
  formData.append('city', student?.city ?? '');
  formData.append(
    'birthDate',
    student?.birthDate
      ? typeof student.birthDate === 'string'
        ? student.birthDate
        : student?.birthDate.toISOString()
      : ''
  );
  formData.append('musicLevel', student?.musicLevel ?? '');
  formData.append('vocalExperience', student?.vocalExperience ?? '');
  formData.append('goals', student?.goals ?? '');

  // фото (важно: только если это File)
  if (student.photo instanceof File) {
    formData.append('photo', student.photo);
  }

  const { data } = await axiosInstance.patch(`/user/${student.id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data;
};
