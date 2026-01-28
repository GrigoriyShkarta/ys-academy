
'use client'
import StudentList from '@/common/StudentList';
import BoardLayout from '@/components/Boards';
import { useUser } from '@/providers/UserContext';
import { useEffect } from 'react';

export default function BoardsPage() {
  const { user } = useUser();
  
    useEffect(() => {
      if (!user) return;
    }, [user]);
  
    return user?.role === 'super_admin' ? <StudentList link='boards' /> : <BoardLayout />;
}
