'use client';

import CreateStudentModal from '@/components/Students/CreateStudentModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteUser, getStudents } from '@/components/Students/actions';
import { Student } from '@/components/Students/interface';
import StudentsTable, { Column } from '@/components/Students/StudentTable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import Loader from '@/common/Loader';
import { useTranslations } from 'next-intl';
import { formatDateTime } from '@/lib/utils';
import { getLastLessonDate, shouldHighlightLesson } from '@/components/Students/utils';
import TableActionMenu from '@/common/TableActioMenu';
import { IFile } from '@/components/Materials/utils/interfaces';
import { useState } from 'react';
import ConfirmModal from '@/common/ConfirmModal';

export default function StudentsLayout() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const client = useQueryClient();
  const t = useTranslations('Students');
  const {
    data: students,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['students'],
    queryFn: () => getStudents(),
  });

  const deleteStudent = async () => {
    try {
      setLoadingDelete(true);
      await deleteUser(selectedId as number);
      await client.invalidateQueries({ queryKey: ['students'] });
    } catch (error) {
      console.log('error: ', error);
    } finally {
      setLoadingDelete(false);
      setSelectedId(null);
    }
  };

  if (isLoading) return <Loader />;
  if (students?.lenght > 0) return null;

  const columns = [
    {
      key: 'actions',
      label: '',
      render: (item: IFile) => (
        <TableActionMenu
          handleDelete={() => {
            setSelectedId(item.id);
          }}
          // handleEdit={() => setSelectedFile(item)}
        />
      ),
    },
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
    {
      key: 'last_lesson',
      label: 'Останній урок',
      render: (student: Student) => {
        const lastLessonDate = getLastLessonDate(student);

        if (!lastLessonDate) {
          return <span className="text-gray-400">-</span>;
        }

        const shouldHighlight = shouldHighlightLesson(student, lastLessonDate) && student.isActive;

        return (
          <span className={shouldHighlight ? 'text-red-500 font-semibold' : ''}>
            {formatDateTime(lastLessonDate)}
          </span>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4 w-full items-center p-8">
      <CreateStudentModal />

      {students && <StudentsTable data={students.data} columns={columns as Column[]} />}

      {selectedId && (
        <ConfirmModal
          open={!!selectedId}
          confirmAction={deleteStudent}
          setOnClose={() => setSelectedId(null)}
          isLoading={loadingDelete}
          // children={<ConfirmTextChild />}
        />
      )}
    </div>
  );
}
