'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStudents } from '@/components/Students/actions';
import { keepPreviousData } from '@tanstack/query-core';
import Loader from '@/common/Loader';
import { Student } from '@/components/Students/interface';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DataTable from '@/common/Table';

export default function StudentList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data: students, isLoading } = useQuery({
    queryKey: ['students', page, search],
    queryFn: () => getStudents(search, page),
    placeholderData: keepPreviousData,
  });

  if (isLoading) return <Loader />;
  if (students?.lenght > 0) return null;

  const columns = [
    {
      key: 'name',
      label: 'Студент',
      render: (student: Student) => (
        <Link href={`lesson-recordings/${student.id}`} className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={student?.photo ?? ''} alt={student.name} />
            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span>{student.name}</span>
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 w-full items-center p-8">
      {students && (
        <DataTable
          columns={columns}
          data={students.data}
          totalPages={students.meta.totalPages}
          currentPage={page}
          onPageChange={newPage => setPage(newPage)}
          onSearchChange={newSearch => {
            setPage(1);
            setSearch(newSearch);
          }}
        />
      )}
    </div>
  );
}
