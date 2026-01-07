'use client';

import { ReactNode, useEffect } from 'react';
import Sidebar from '@/common/SideBar';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '@/services/profile';
import Loader from '@/common/Loader';
import { useUser } from '@/providers/UserContext';
import { getStudent } from '@/components/Students/Student/actions';
import StudentSubscriptionReminder from '@/common/Reminder';

export default function MainLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { setUser, user } = useUser();
  const { data: userData, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: getMe,
  });

  // Получаем полную информацию о студенте с абонементами
  const { data: studentData } = useQuery({
    queryKey: ['student', userData?.id],
    queryFn: () => getStudent(userData!.id),
    enabled: !!userData?.id && userData?.role !== 'super_admin',
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

      {/* Напоминание о продлении абонемента для студента */}
      {userData?.role !== 'super_admin' && studentData && (
        <StudentSubscriptionReminder student={studentData} />
      )}
    </div>
  );
}
