'use client';

import CreateStudentModal from '@/components/Students/CreateStudentModal';
import { useQuery } from '@tanstack/react-query';
import { getStudents } from '@/components/Students/actions';
import { Student } from '@/components/Students/interface';
import StudentsTable from '@/components/Students/StudentTable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function StudentsLayout() {
  const {
    data: students,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['students'],
    queryFn: getStudents,
  });

  if (isLoading) return <div>Loading...</div>;
  if (students?.lenght > 0) return null;

  const columns = [
    {
      key: 'name',
      label: 'Студент',
      render: (student: Student) => (
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={student?.avatar ?? ''} alt={student.name} />
            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span>{student.name}</span>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (student: Student) => <span>{student.email}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-4 w-full items-center p-8">
      <CreateStudentModal />

      {students && <StudentsTable data={students.data} columns={columns} />}
    </div>
  );
}
