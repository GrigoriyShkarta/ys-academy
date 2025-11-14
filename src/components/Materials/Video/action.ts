import axiosInstance from '@/services/axios';
import { ContentFormValues } from '@/components/Materials/utils/materialSchemas';
import { GetMaterialParams } from '@/components/Materials/utils/interfaces';

export const uploadVideo = async (form: ContentFormValues) => {
  const formData = new FormData();
  formData.append('title', form?.title ?? '');
  if (form.content) {
    formData.append('file', form.content);
  }

  const { data } = await axiosInstance.post('/video/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const getVideos = async ({ page, search }: GetMaterialParams) => {
  const { data } = await axiosInstance.get('/video', {
    params: { page, search },
  });
  return data;
};

export const deleteVideos = async (ids: number[]) => {
  const { data } = await axiosInstance.delete(`/video`, {
    data: { ids },
  });
  return data;
};

export const editVideo = async (
  id: number,
  form: { title: string; content: File | string | null }
) => {
  const formData = new FormData();
  formData.append('title', form.title);
  if (form.content) {
    formData.append('file', form.content);
  }

  const { data } = await axiosInstance.patch(`/video/${id}`, formData);

  return data;
};
