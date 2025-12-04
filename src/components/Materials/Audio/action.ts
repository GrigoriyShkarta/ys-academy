import axiosInstance from '@/services/axios';
import qs from 'qs';
import { ContentFormValues } from '@/components/Materials/utils/materialSchemas';
import { GetMaterialParams } from '@/components/Materials/utils/interfaces';

export const uploadAudio = async (form: ContentFormValues) => {
  const formData = new FormData();
  formData.append('title', form?.title ?? '');
  formData.append('categoryIds', JSON.stringify(form.categories));
  if (form.content) {
    formData.append('file', form.content);
  }

  const { data } = await axiosInstance.post('/audio/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const getAudios = async ({
  page,
  search = '',
  sortBy,
  sortOrder,
  categories,
}: GetMaterialParams) => {
  const { data } = await axiosInstance.get('/audio', {
    params: { page, search, sortBy, sortOrder, categories },
    paramsSerializer: params => {
      return qs.stringify(params, { arrayFormat: 'repeat' });
    },
  });
  return data;
};

export const deleteAudios = async (ids: number[]) => {
  const { data } = await axiosInstance.delete(`/audio`, {
    data: { ids },
  });
  return data;
};

export const editAudio = async (id: number, form: ContentFormValues) => {
  const { data } = await axiosInstance.patch(`/audio/${id}`, form);

  return data;
};
