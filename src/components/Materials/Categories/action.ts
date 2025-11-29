import axiosInstance from '@/services/axios';
import { GetMaterialParams } from '@/components/Materials/utils/interfaces';

export const deleteCategory = async (ids: number[]) => {
  const { data } = await axiosInstance.delete(`/category`, {
    data: { ids },
  });
  return data;
};

export const getCategories = async ({
  page,
  search = '',
  sortBy,
  sortOrder,
}: GetMaterialParams) => {
  const { data } = await axiosInstance.get('/category', {
    params: { page, search, sortBy, sortOrder },
  });
  return data;
};

export const createCategory = async (form: { title: string; color?: string }[]) => {
  const { data } = await axiosInstance.post('/category', { form });
  return data;
};
