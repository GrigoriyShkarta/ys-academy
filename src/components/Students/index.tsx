'use client';

import CreateStudentModal from '@/components/Students/CreateStudentModal';
import { useQuery } from '@tanstack/react-query';
import { getStudents } from '@/components/Students/actions';
import { Student } from '@/components/Students/interface';
import StudentsTable from '@/components/Students/StudentTable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import Loader from '@/common/Loader';
import { useTranslations } from 'next-intl';

export default function StudentsLayout() {
  const t = useTranslations('Students');
  const {
    data: students,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['students'],
    queryFn: () => getStudents(),
  });

  if (isLoading) return <Loader />;
  if (students?.lenght > 0) return null;

  const columns = [
    {
      key: 'name',
      label: 'Студент',
      render: (student: Student) => (
        <Link href={`students/${student.id}`} className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={student?.photo ?? ''} alt={student.name} />
            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span>{student.name}</span>
        </Link>
      ),
    },
    {
      key: 'is_active',
      label: t('status'),
      render: (student: Student) => (
        <span
          className={`px-2 py-1 rounded-full ${student.isActive ? 'bg-green-500' : 'bg-red-500'}`}
        >
          {student.isActive ? t('active') : t('inactive')}
        </span>
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
