import axiosInstance from '@/services/axios';
import { ContentFormValues } from '@/components/Materials/utils/materialSchemas';
import { GetMaterialParams } from '@/components/Materials/utils/interfaces';

export const uploadText = async (form: ContentFormValues) => {
  const formData = new FormData();
  formData.append('title', form.title);
  if (form.content) {
    formData.append('content', form.content);
  }

  const { data } = await axiosInstance.post('/text/upload', formData);
  return data;
};

export const getTexts = async ({ page, search }: GetMaterialParams) => {
  const { data } = await axiosInstance.get('/text', {
    params: { page, search },
  });
  return data;
};

export const deleteTexts = async (ids: number[]) => {
  const { data } = await axiosInstance.delete(`/text`, {
    data: { ids },
  });
  return data;
};

export const editText = async (
  id: number,
  form: { title: string; content: File | string | null }
) => {
  const formData = new FormData();
  formData.append('title', form.title);
  if (form.content) {
    formData.append('content', form.content);
  }

  const { data } = await axiosInstance.patch(`/text/${id}`, formData);

  return data;
};
