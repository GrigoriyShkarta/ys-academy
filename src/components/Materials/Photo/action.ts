import axiosInstance from '@/services/axios';
import qs from 'qs';
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
  formData.append('categoryIds', JSON.stringify(form.categories));
  if (form.content) {
    formData.append('file', finalFile);
  }
  if (form.isOther) {
    formData.append('isOther', String(form.isOther));
  }

  const { data } = await axiosInstance.post('/photo/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const getPhotos = async ({ page, search, categories }: GetMaterialParams) => {
  const { data } = await axiosInstance.get('/photo', {
    params: { page, search, categories },
    paramsSerializer: params => {
      return qs.stringify(params, { arrayFormat: 'repeat' });
    },
  });
  return data;
};

export const editPhoto = async (
  id: number,
  form: {
    content: string | undefined;
    categoryIds: string[] | undefined;
    title: string;
  }
) => {
  const { data } = await axiosInstance.patch(`/photo/${id}`, form);

  return data;
};

export const deletePhotos = async (ids: number[]) => {
  const { data } = await axiosInstance.delete(`/photo`, {
    data: { ids },
  });
  return data;
};
