import axiosInstance from '@/services/axios';

export async function getMe() {
  const { data } = await axiosInstance.get(`/user/me`);

  return data;
}
