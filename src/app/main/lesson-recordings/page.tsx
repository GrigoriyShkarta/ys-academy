'use client';

import StudentList from '@/common/StudentList';
import LessonRecordingsLayout from '@/components/LessonRecordings';
import { useUser } from '@/providers/UserContext';
import { useEffect } from 'react';

export default function LessonRecordingPage() {
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;
  }, [user]);

  return user?.role === 'super_admin' ? <StudentList link='lesson-recordings' /> : <LessonRecordingsLayout id={user?.id!} />;
}
