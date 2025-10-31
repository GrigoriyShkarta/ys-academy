import { LoginFormValues } from '@/components/Auth/authSchema';
import { YS_REFRESH_TOKEN, YS_TOKEN } from '@/lib/consts';
import { UseFormReturn } from 'react-hook-form';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function onSubmit(
  data: LoginFormValues,
  setIsLoading: (isLoading: boolean) => void,
  form: UseFormReturn<LoginFormValues>
) {
  setIsLoading(true);

  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      form.setError('root', {
        message: responseData.message,
      });
      return;
    } else {
      localStorage.setItem(YS_TOKEN, responseData.access_token);
      localStorage.setItem(YS_REFRESH_TOKEN, responseData.refresh_token);
      window.location.href = '/main';
    }
  } catch (error) {
    console.error('Ошибка входа:', error);
  } finally {
    setIsLoading(false);
  }
}
