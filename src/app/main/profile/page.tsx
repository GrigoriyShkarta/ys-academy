'use client';

import { useUser } from '@/providers/UserContext';
import Student from '@/components/Students/Student';

export default function ProfilePage() {
  const { user } = useUser();
  if (!user) return null;
  return <Student id={user?.id} />;
}
