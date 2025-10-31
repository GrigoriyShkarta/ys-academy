import axiosInstance from '@/services/axios';

export async function getMe() {
  return await axiosInstance.get(`/user/me`);
}
