import axiosInstance from '@/services/axios';
import { GetMaterialParams, Module, ModuleDTO } from '@/components/Materials/utils/interfaces';
import qs from 'qs';

export const createModule = async (form: ModuleDTO) => {
  const { data } = await axiosInstance.post('/module/create', form);

  return data;
};

export const updateModule = async (form: ModuleDTO, id: number) => {
  const { data } = await axiosInstance.post(`/module/update/${id}`, form);

  return data;
};

export const deleteModule = async (id?: number) => {
  const { data } = await axiosInstance.delete(`/module/${id}`);
  return data;
};

export const getModules = async ({
  page,
  search = '',
  categories,
  sortBy,
  sortOrder,
}: GetMaterialParams) => {
  const { data } = await axiosInstance.get('/module', {
    params: { page, search, categories, sortBy, sortOrder },
    paramsSerializer: params => {
      return qs.stringify(params, { arrayFormat: 'repeat' });
    },
  });
  return data;
};

export const getModule = async (id?: number): Promise<Module> => {
  const { data } = await axiosInstance.get(`/module/${id}`);
  return data;
};
