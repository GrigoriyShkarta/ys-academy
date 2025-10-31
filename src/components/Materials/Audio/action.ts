import axiosInstance from '@/services/axios';
import { ContentFormValues } from '@/components/Materials/utils/materialSchemas';
import { GetMaterialParams } from '@/components/Materials/utils/interfaces';

export const uploadAudio = async (form: ContentFormValues) => {
  const formData = new FormData();
  formData.append('title', form.title);
  if (form.content) {
    formData.append('file', form.content);
  }

  const { data } = await axiosInstance.post('/audio/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const getAudios = async ({ page, search = '' }: GetMaterialParams) => {
  const { data } = await axiosInstance.get('/audio', {
    params: { page, search },
  });
  return data;
};

export const deleteAudios = async (ids: number[]) => {
  const { data } = await axiosInstance.delete(`/audio`, {
    data: { ids },
  });
  return data;
};

export const editAudio = async (
  id: number,
  form: { title: string; content: File | string | null }
) => {
  const formData = new FormData();
  formData.append('title', form.title);
  if (form.content) {
    formData.append('file', form.content);
  }

  const { data } = await axiosInstance.patch(`/audio/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data;
};
