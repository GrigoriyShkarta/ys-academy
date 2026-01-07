'use client';

import LessonRecordingsLayout from '@/components/Materials/LessonRecordings';
import { useUser } from '@/providers/UserContext';
import { useEffect } from 'react';

export default function LessonRecordingPage() {
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;
  }, [user]);

  return user?.id ? <LessonRecordingsLayout id={user?.id} /> : null;
}
