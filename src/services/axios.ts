'use client';

import axios from 'axios';
import { YS_REFRESH_TOKEN, YS_TOKEN } from '@/lib/consts';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use(
  config => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(YS_TOKEN);
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  error => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Проверяем 401 и отсутствие повторной попытки
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (typeof window === 'undefined') {
          throw new Error('No access to localStorage');
        }

        const refreshToken = localStorage.getItem(YS_REFRESH_TOKEN);
        if (!refreshToken) {
          throw new Error('No refresh token found');
        }

        const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh/`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = data;

        // сохраняем новые токены
        localStorage.setItem(YS_TOKEN, access_token);
        localStorage.setItem(YS_REFRESH_TOKEN, refresh_token);

        // обновляем заголовок и повторяем запрос
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // удаляем токены и редиректим
        if (typeof window !== 'undefined') {
          localStorage.removeItem(YS_TOKEN);
          localStorage.removeItem(YS_REFRESH_TOKEN);
          window.location.href = '/';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
