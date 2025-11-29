'use client';

import { useQuery } from '@tanstack/react-query';
import { getStudent } from '@/components/Students/Student/actions';
import Info from '@/components/Students/Student/components/Info';
import { Loader } from 'lucide-react';
import StudentModules from '@/components/Students/Student/components/StudentModules';

export default function Student({ id }: { id: number }) {
  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => getStudent(id),
    enabled: !!id,
  });

  if (isLoading) return <Loader />;

  return (
    student && (
      <div className="flex flex-col p-8 gap-4 w-full mt-18 sm:mt-0">
        <Info student={student} />
        <StudentModules modules={student.modules} studentId={id} />
      </div>
    )
  );
}
