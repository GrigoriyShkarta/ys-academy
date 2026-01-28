import axiosInstance from '@/services/axios';
import { GetMaterialParams } from '@/components/Materials/utils/interfaces';

export const deleteSubscriptions = async (ids: number[]) => {
  const { data } = await axiosInstance.delete(`/subscriptions`, {
    data: { ids },
  });
  return data;
};

export const getSubscriptions = async ({
  page,
  search = '',
  sortBy,
  sortOrder,
}: GetMaterialParams) => {
  const { data } = await axiosInstance.get('/subscriptions', {
    params: { page, search, sortBy, sortOrder },
  });
  return data;
};

export const createSubscription = async (form: {
  title: string;
  lessons_count: number;
  price: number;
}) => {
  const { data } = await axiosInstance.post('/subscriptions', form);
  return data;
};

export const updateSubscription = async (
  id: number,
  form: { title: string; lessons_count: number; price: number }
) => {
  const { data } = await axiosInstance.patch(`/subscriptions/${id}`, form);
  return data;
};
