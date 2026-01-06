'use client';

import { useUser } from '@/providers/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MaterialsPage() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (user.role === 'super_admin') {
        router.push('/main/materials/audio');
      } else {
        router.push('/main');
      }
    }
  }, [user, router]);

  // Optional: show a loading spinner while redirecting
  return <div>Loading...</div>;
}
