'use client';

import StudentCourses from '@/components/Students/Student/components/StudentCourses';
import { useUser } from '@/providers/UserContext';
import { useQuery } from '@tanstack/react-query';
import { getStudent } from '@/components/Students/Student/actions';
import Loader from '@/common/Loader';

export default function CoursesPage() {
  const { user } = useUser();

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', user?.id],
    queryFn: () => getStudent(user!.id),
    enabled: !!user?.id,
  });

  if (isLoading) {
    return <Loader />;
  }

  if (!student || !user) {
    return null;
  }

  return (
    <div className="flex gap-2 mb-4 justify-center sm:max-w-7xl sm:mx-auto py-8 mt-18 sm:mt-0 w-full px-4 sm:px-8">
      <StudentCourses courses={student.courses} userId={user?.id} />
    </div>
  );
}
