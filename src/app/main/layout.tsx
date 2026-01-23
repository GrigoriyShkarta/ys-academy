'use client';

import { ReactNode, useEffect } from 'react';
import Sidebar from '@/common/SideBar';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '@/services/profile';
import Loader from '@/common/Loader';
import { useUser } from '@/providers/UserContext';
import { getStudent } from '@/components/Students/Student/actions';
import StudentSubscriptionReminder from '@/common/Reminder';
import { MetronomeProvider } from '@/providers/MetronomeContext';
import { TunerProvider } from '@/providers/TunerContext';
import { PianoProvider } from '@/providers/PianoContext';
import MetronomeWidget from '@/common/Widgets/MetronomWidget';
import TunerWidget from '@/common/Widgets/TunerWidget';
import PianoWidget from '@/common/Widgets/PianoWidget';
import WidgetHub from '@/common/Widgets/WidgetHub';
import { getLastLessonDate, shouldHighlightLesson, isWithinWeekOrPast } from '@/components/Students/utils';
import { useState } from 'react';
import NotificationBell from '@/components/Students/NotificationBell';

export default function MainLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { setUser, user } = useUser();
  const [isReminderVisible, setIsReminderVisible] = useState(true);
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

  // Должно ли отображаться напоминание
  const shouldShowReminder = () => {
    if (userData?.role === 'super_admin' || !studentData) return false;
    const lastLessonDate = getLastLessonDate(studentData);
    const needsRenewal = lastLessonDate && shouldHighlightLesson(studentData, lastLessonDate);
    const accessExpiryDate = studentData?.accessExpiryDate ?? '';
    const isAccessExpiryNear = accessExpiryDate ? isWithinWeekOrPast(new Date(accessExpiryDate)) : false;
    return !!(needsRenewal || isAccessExpiryNear);
  };

  const isShiftedByReminder = shouldShowReminder() && isReminderVisible;

  return (
    <MetronomeProvider>
      <TunerProvider>
        <PianoProvider>
          <TunerWidget />
          <MetronomeWidget />
          <PianoWidget />
          <WidgetHub isShiftedByReminder={isShiftedByReminder} />
          <div className="flex">
            <Sidebar />

            <div className="absolute top-4 right-6 z-50 hidden md:block">
              <NotificationBell notifications={user?.role === 'super_admin' ? userData?.notifications : studentData?.notifications ?? []} />
            </div>

            {children}

            {/* Напоминание о продлении абонемента для студента */}
            {userData?.role !== 'super_admin' && studentData && (
              <StudentSubscriptionReminder 
                student={studentData} 
                isVisible={isReminderVisible}
                setIsVisible={setIsReminderVisible}
                shouldShow={shouldShowReminder()}
              />
            )}
          </div>
        </PianoProvider>
      </TunerProvider>
    </MetronomeProvider>
  );
}
