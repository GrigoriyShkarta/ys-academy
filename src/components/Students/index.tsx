'use client';

import CreateStudentModal from '@/components/Students/CreateStudentModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteUser, getStudents } from '@/components/Students/actions';
import { Student } from '@/components/Students/interface';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import Loader from '@/common/Loader';
import { useTranslations } from 'next-intl';
import { formatDateTime } from '@/lib/utils';
import { getLastLessonDate, shouldHighlightLesson, getLastSubscription } from '@/components/Students/utils';
import TableActionMenu from '@/common/TableActioMenu';
import { IFile } from '@/components/Materials/utils/interfaces';
import { useState } from 'react';
import ConfirmModal from '@/common/ConfirmModal';
import DataTable from '@/common/Table';
import { keepPreviousData } from '@tanstack/query-core';
import { useUser } from '@/providers/UserContext';

export default function StudentsLayout() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const client = useQueryClient();
  const t = useTranslations('Students');
  const { user } = useUser();
  const { data: students, isLoading } = useQuery({
    queryKey: ['students', 'all', search],
    queryFn: () => getStudents(search, 'all'),
    placeholderData: keepPreviousData,
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
      key: 'payment_status',
      label: t('payment_status'),
      render: (student: Student) => {
        const lastSubscription = getLastSubscription(student);

        if (!lastSubscription) {
          return <span className="text-gray-400">-</span>;
        }

        const { paymentStatus, amount, subscription } = lastSubscription;
        const totalPrice = subscription.price;

        if (paymentStatus === 'paid') {
          return (
            <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-medium">
              {t('paid')}
            </span>
          );
        }

        if (paymentStatus === 'unpaid') {
          return (
            <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-medium">
              {t('unpaid')}
            </span>
          );
        }

        if (paymentStatus === 'partially_paid') {
          return (
            <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs font-medium">
              {amount.toLocaleString('uk-UA')}/{totalPrice.toLocaleString('uk-UA')} грн
            </span>
          );
        }

        return <span className="text-gray-400">-</span>;
      },
    },
    {
      key: 'last_lesson',
      label: 'Дата оплати',
      render: (student: Student) => {
        const lastSubscription = getLastSubscription(student);
        const lastLessonDate = getLastLessonDate(student);

        const paymentDate = lastSubscription?.nextPaymentDate
          ? new Date(lastSubscription.nextPaymentDate)
          : null;
        const dateToShow = paymentDate || lastLessonDate;

        if (!dateToShow) {
          return <span className="text-gray-400">-</span>;
        }

        const isPaid = lastSubscription?.paymentStatus === 'paid';
        const dateToHighlight = paymentDate && !isPaid ? paymentDate : lastLessonDate;

        const shouldHighlight = shouldHighlightLesson(student, dateToHighlight) && student.isActive;

        return (
          <span className={shouldHighlight ? 'text-red-500 font-semibold' : ''}>
            {formatDateTime(dateToShow, true)}
          </span>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4 w-full items-center p-8">
      <CreateStudentModal />

      {students && (
        <>
          <div className="w-full">
            <span className="text-gray-500 text-start">Усього активних студентів: {students.meta.activeStudentsCount}</span>
         </div>  
          <DataTable
          //@ts-ignore
          columns={columns}
          data={students.data}
          onSearchChange={newSearch => {
            setPage(1);
            setSearch(newSearch);
          }}
        />
        </>
      )}

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
