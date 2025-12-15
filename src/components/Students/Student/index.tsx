'use client';

import { useQuery } from '@tanstack/react-query';
import { getStudent } from '@/components/Students/Student/actions';
import Info from '@/components/Students/Student/components/Info';
import { Loader } from 'lucide-react';
import StudentCourses from '@/components/Students/Student/components/StudentCourses';

export default function Student({ id }: { id: number }) {
  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => getStudent(id),
    enabled: !!id,
  });

  if (isLoading) return <Loader />;

  return (
    student && (
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 flex flex-col gap-4 w-full mt-18 sm:mt-0">
        <Info student={student} />
        <StudentCourses courses={student.courses} userId={id} />
      </div>
    )
  );
}
