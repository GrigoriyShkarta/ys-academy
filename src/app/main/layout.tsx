'use client';

import { ReactNode, useEffect } from 'react';
import Sidebar from '@/common/SideBar';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '@/services/profile';
import Loader from '@/common/Loader';
import { useUser } from '@/providers/UserContext';

export default function MainLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { setUser, user } = useUser();
  const { data: userData, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: getMe,
  });

  useEffect(() => {
    if (userData) {
      setUser({
        role: userData.role,
        id: userData.id,
        name: userData.name,
        isActive: userData.isActive,
      });
    }
  }, [userData]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="flex">
      <Sidebar />

      {children}
    </div>
  );
}
