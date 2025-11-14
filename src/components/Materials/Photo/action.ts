import axiosInstance from '@/services/axios';
import { ContentFormValues } from '@/components/Materials/utils/materialSchemas';
import { GetMaterialParams } from '@/components/Materials/utils/interfaces';
import { compressImage } from '@/lib/utils';

export const uploadPhoto = async (form: ContentFormValues) => {
  const formData = new FormData();
  let finalFile: File | string = form.content;
  if (form.content instanceof File) {
    try {
      finalFile = await compressImage(form.content, {
        maxSizeKB: 500,
        maxWidth: 1024,
      });
    } catch (err) {
      console.warn('Compression failed, using original', err);
      finalFile = form.content; // fallback
    }
  }
  formData.append('title', form?.title ?? '');
  if (form.content) {
    formData.append('file', finalFile);
  }

  const { data } = await axiosInstance.post('/photo/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const getPhotos = async ({ page, search }: GetMaterialParams) => {
  const { data } = await axiosInstance.get('/photo', {
    params: { page, search },
  });
  return data;
};

export const editPhoto = async (id: number, form: ContentFormValues) => {
  const formData = new FormData();
  formData.append('title', form?.title ?? '');
  if (form.content) {
    formData.append('file', form.content);
  }

  const { data } = await axiosInstance.patch(`/photo/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data;
};

export const deletePhotos = async (ids: number[]) => {
  const { data } = await axiosInstance.delete(`/photo`, {
    data: { ids },
  });
  return data;
};
