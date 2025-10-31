import axiosInstance from '@/services/axios';
import { LoginFormValues } from '@/components/Auth/authSchema';

export async function login(data: LoginFormValues): Promise<{ access_token: string }> {
  return await axiosInstance.post(`/auth/login`, data);
}
