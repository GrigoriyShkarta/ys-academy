import axiosInstance from '@/services/axios';
import { Module, ModuleDTO } from '@/components/Materials/utils/interfaces';

export const createModule = async (form: ModuleDTO) => {
  const { data } = await axiosInstance.post('/module/create', form);

  return data;
};

export const updateModule = async (form: ModuleDTO, id: number) => {
  const { data } = await axiosInstance.post(`/module/update/${id}`, form);

  return data;
};

export const deleteModule = async (id: number) => {
  const { data } = await axiosInstance.delete(`/module/${id}`);
  return data;
};

export const getModules = async ({ search = '' }) => {
  const { data } = await axiosInstance.get('/module', {
    params: { search },
  });
  return data;
};

export const getModule = async (id: number): Promise<Module> => {
  const { data } = await axiosInstance.get(`/module/${id}`);
  return data;
};
