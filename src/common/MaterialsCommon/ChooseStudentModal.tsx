import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getStudents } from '@/components/Students/actions';
import { keepPreviousData } from '@tanstack/query-core';
import { useTranslations } from 'next-intl';
import { Student } from '@/components/Students/interface';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import Loader from '@/common/Loader';
import DataTable from '@/common/Table';
import { Checkbox } from '@/components/ui/checkbox';
import { IFile } from '@/components/Materials/utils/interfaces';
import { useUser } from '@/providers/UserContext';

interface Props {
  open: boolean;
  closeModal: () => void;
  acceptedLessons?: number[];
  selectedLesson?: number | null;
}

export default function ChooseStudentModal({
  open,
  closeModal,
  acceptedLessons,
  selectedLesson,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<number[]>(acceptedLessons ?? []);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const t = useTranslations('Students');
  const client = useQueryClient();
  const { user } = useUser();

  useEffect(() => {
    setSelectedIds(acceptedLessons ?? []);
  }, [acceptedLessons]);

  const { data: students, isLoading } = useQuery({
    queryKey: ['students', search],
    queryFn: () => getStudents(search, 'all'),
    placeholderData: keepPreviousData,
    enabled: user?.role === 'super_admin',
  });

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (!students) return;
    setSelectedIds(prev =>
      prev.length === students.data.lessons?.length
        ? []
        : students.data.lessons?.map((a: IFile) => a.id)
    );
  }, [students]);

  // const assignLessons = async () => {
  //   if (selectedIds && selectedLesson) {
  //     try {
  //       setLoading(true);
  //       await assignLesson(selectedIds, selectedLesson);
  //       await client.invalidateQueries({ queryKey: ['students'] });
  //     } catch (error) {
  //       console.log('error: ', error);
  //     } finally {
  //       setLoading(false);
  //       closeModal();
  //     }
  //   }
  // };

  const columns = [
    {
      key: 'checkbox',
      label: (
        <Checkbox
          checked={
            selectedIds.length === students?.data?.lessons?.length &&
            students?.data?.lessons?.length > 0
          }
          onCheckedChange={toggleSelectAll}
        />
      ),
      render: (item: Student) => (
        <Checkbox
          checked={selectedIds.includes(item.id)}
          onCheckedChange={() => toggleSelect(item.id)}
        />
      ),
    },
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
    <Dialog open={open} onOpenChange={closeModal}>
      <DialogContent className="sm:max-w-[1024px] max-h-[90vh] overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable]">
        <DialogTitle>
          <VisuallyHidden />
        </DialogTitle>

        {isLoading ? (
          <Loader />
        ) : (
          <DataTable
            data={students.data ?? []}
            columns={columns}
            selectedIds={selectedIds}
            onSearchChange={newSearch => {
              setSearch(newSearch);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
