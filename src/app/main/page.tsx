'use client';

import { useEffect } from 'react';
import { YS_TOKEN } from '@/lib/consts';
import { useRouter } from 'next/navigation';

export default function MainPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem(YS_TOKEN);
    if (!token) router.push('/');
  }, []);

  return <div></div>;
}
