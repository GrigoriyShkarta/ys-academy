import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { StudentLesson } from '@/components/Students/interface';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Loader2, UserLock } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import DataTable from '@/common/Table';
import { Button } from '@/components/ui/button';
import { assignLesson } from '@/components/Materials/Lesson/action';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/common/ConfirmModal';

interface Props {
  lessons?: StudentLesson[];
  studentId: number;
  moduleId: number;
  courseId: number;
  open: boolean;
  close: () => void;
}

export default function StudentModuleModal({
  lessons,
  open,
  close,
  studentId,
  moduleId,
  courseId,
}: Props) {
  const [search, setSearch] = useState('');
  const [openConfirm, setOpenConfirm] = useState(false);
  const [lessonId, setLessonId] = useState<number>();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const client = useQueryClient();
  
  const router = useRouter();
  const t = useTranslations('Common');

  useEffect(() => {
    if (!lessons) return;
    const acceptedIds = lessons.filter(l => l.access).map(l => l.id);

    setSelectedIds(prev => {
      // избегаем лишнего обновления, если массивы одинаковы
      if (prev.length === acceptedIds.length && prev.every((v, i) => v === acceptedIds[i])) {
        return prev;
      }
      return acceptedIds;
    });
  }, [lessons, open]);

  const filteredLessons = lessons?.filter(l => l.title.includes(search));

  const handleClickAccessIcon = (id: number) => {
    if (selectedIds.length > 0) {
      setOpenConfirm(true);
      setLessonId(id);
    } else {
      router.push(`/main/students/${studentId}/lesson-detail/${id}`);
    }
  }

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (!filteredLessons) return;
    setSelectedIds(prev =>
      prev.length === filteredLessons.length ? [] : filteredLessons.map((a: StudentLesson) => a.id)
    );
  }, [filteredLessons]);

  const handleAddAccess = async () => {
    try {
      setLoading(true);

      const allLessonIds = lessons?.map(l => l.id) ?? [];
      const selected = selectedIds;

      // Дать доступ
      const toAdd = selected.map(id => ({ id }));

      // Удалить доступ
      const toRemove = allLessonIds
        .filter(id => !selected.includes(id))
        .map(id => ({ id, remove: true }));

      const payload = [...toAdd, ...toRemove];

      await assignLesson([+studentId], payload);

      await client.invalidateQueries({ queryKey: ['course', courseId] });

      if (openConfirm) {
        router.push(`/main/students/${studentId}/lesson-detail/${lessonId}`);
      }
    } catch (error) {
      console.log('error: ', error);
    } finally {
      setLoading(false);
      closeModal();
    }
  };

  const closeModal = () => {
    setSelectedIds([]);
    close();
  };

  const columns = [
    {
      key: 'checkbox',
      label: (
        <Checkbox
          checked={selectedIds.length === filteredLessons?.length && filteredLessons?.length > 0}
          onCheckedChange={toggleSelectAll}
        />
      ),
      render: (item: StudentLesson) => (
        <Checkbox
          checked={selectedIds.includes(item.id)}
          onCheckedChange={() => toggleSelect(item.id)}
        />
      ),
    },
    {
      key: 'title',
      label: t('title'),
      render: (item: StudentLesson) => (
        <p className="max-w-full w-fit overflow-hidden text-ellipsis">{item.title}</p>
      ),
    },
    {
      key: 'access',
      label: <p className="text-center">{t('access')}</p>,
      render: (item: StudentLesson) => <p className="text-center">{item.accessBlocks}</p>,
    },
    {
      key: 'details',
      label: <p className="text-center">{t('details')}</p>,
      render: (item: StudentLesson) => (
        <UserLock onClick={() => handleClickAccessIcon(item.id)} />
      ),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={closeModal}>
      <DialogContent className="sm:max-w-[1024px] max-h-[90vh] overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable]">
        <DialogTitle>
          <VisuallyHidden />
        </DialogTitle>

        <DataTable
          data={filteredLessons ?? []}
          columns={columns}
          selectedIds={selectedIds}
          onSearchChange={newSearch => {
            setSearch(newSearch);
          }}
        />

        <DialogFooter>
          <Button className="bg-accent" onClick={handleAddAccess} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : t('add_access')}
          </Button>
        </DialogFooter>
      </DialogContent>

      <ConfirmModal
        open={openConfirm}
        confirmAction={handleAddAccess}
        setOnClose={() => setOpenConfirm(false)}
        isLoading={loading}
      />
    </Dialog>
  );
}
