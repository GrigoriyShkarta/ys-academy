// components/Students/Student/components/LessonItem.tsx

import { Dispatch, SetStateAction } from 'react';
import { useTranslations } from 'next-intl';
import { format, Locale } from 'date-fns';
import { Loader } from 'lucide-react';
import { useUser } from '@/providers/UserContext';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { StudentSubscriptionLesson } from '@/components/Students/interface';

interface LessonItemProps {
  lesson: StudentSubscriptionLesson;
  subscriptionId: number;
  changeLessonStatus: (subscriptionId: number, lessonId: number, status: string) => void;
  saveLessonDate: (lessonId: number) => void;
  editingDateTime: Date | null; // может быть null, не undefined
  setEditingDateTime: Dispatch<SetStateAction<Date | null>>;
  editingLessonId?: number;
  isLoadingChangeLessonDate?: boolean;
  currentLocale: Locale;
}

export default function LessonItem({
  lesson,
  subscriptionId,
  changeLessonStatus,
  saveLessonDate,
  editingDateTime,
  setEditingDateTime,
  editingLessonId,
  isLoadingChangeLessonDate = false,
  currentLocale,
}: LessonItemProps) {
  const t = useTranslations('Students');
  const { user } = useUser();
  const lessonStatuses = ['completed', 'expired', 'transfer', 'pending'];

  return (
    <div
      key={lesson.id}
      className={`flex flex-col gap-1 p-2 rounded-[8px] border
                      ${lesson.status === 'completed' && 'bg-green-500 text-white'}
                      ${lesson.status === 'expired' && 'bg-red-500 text-white'}
                      ${lesson.status === 'transfer' && 'bg-orange-500 text-white'}
                    `}
    >
      {editingLessonId === lesson.id ? (
        <>
          <Input
            type="date"
            value={format(editingDateTime! || lesson.scheduledAt, 'yyyy-MM-dd')}
            onChange={e => {
              const date = e.target.value;
              const time = format(editingDateTime!, 'HH:mm');
              setEditingDateTime(new Date(`${date}T${time}`));
            }}
          />

          <Input
            type="time"
            value={format(editingDateTime! || lesson.scheduledAt, 'HH:mm')}
            onChange={e => {
              const time = e.target.value;
              const date = format(editingDateTime!, 'yyyy-MM-dd');
              setEditingDateTime(new Date(`${date}T${time}`));
            }}
          />

          <Button
            disabled={!editingDateTime}
            variant="outline"
            onClick={() => saveLessonDate(lesson.id)}
          >
            {isLoadingChangeLessonDate ? <Loader className="animate-spin" /> : t('save')}
          </Button>
        </>
      ) : (
        <>
          {/* День недели + полная дата */}
          <p className="text-sm font-medium">
            {format(new Date(lesson.scheduledAt), 'd MMMM yyyy', {
              locale: currentLocale,
            })}
          </p>

          <p className="text-sm">
            {format(new Date(lesson.scheduledAt), 'EEEE HH:mm', {
              locale: currentLocale,
            })}
          </p>
        </>
      )}

      {user?.role === 'super_admin' ? (
        <Select
          value={lesson.status}
          onValueChange={value => changeLessonStatus(subscriptionId, lesson.id, value)}
        >
          <SelectTrigger className="text-xs">
            <SelectValue placeholder={t('select_status')} />
          </SelectTrigger>
          <SelectContent>
            {lessonStatuses.map(status => (
              <SelectItem key={status} value={String(status)}>
                {t(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <p className="text-xs font-medium">{t(lesson.status)}</p>
      )}
    </div>
  );
}
