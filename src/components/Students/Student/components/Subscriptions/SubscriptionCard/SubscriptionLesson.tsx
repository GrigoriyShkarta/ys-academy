import { Dispatch, SetStateAction, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { format, isValid, Locale } from 'date-fns';
import { Loader, Pencil } from 'lucide-react';
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
  editingDateTime: Date | null;
  setEditingDateTime: Dispatch<SetStateAction<Date | null>>;
  editingLessonId?: number;
  setEditingLessonId: Dispatch<SetStateAction<number | undefined>>;
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
  setEditingLessonId,
  isLoadingChangeLessonDate = false,
  currentLocale,
}: LessonItemProps) {
  const t = useTranslations('Students');
  const { user } = useUser();
  const lessonStatuses = ['completed', 'expired', 'transfer', 'pending'];

  const displayDate = useMemo(() => {
    if (editingDateTime && isValid(editingDateTime)) return editingDateTime;
    if (lesson?.scheduledAt) {
      const d = new Date(lesson.scheduledAt);
      if (isValid(d)) return d;
    }
    return null;
  }, [editingDateTime, lesson?.scheduledAt]);

  const dateValue = useMemo(() => {
    return displayDate ? format(displayDate, 'yyyy-MM-dd') : '';
  }, [displayDate]);

  const timeValue = useMemo(() => {
    return displayDate ? format(displayDate, 'HH:mm') : '';
  }, [displayDate]);

  return (
    <div
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
            value={dateValue}
            onChange={e => {
              const date = e.target.value;
              if (!date) return;
              const time = timeValue || '12:00';
              const newDate = new Date(`${date}T${time}`);
              if (isValid(newDate)) {
                setEditingDateTime(newDate);
              }
            }}
          />

          <Input
            type="time"
            value={timeValue}
            onChange={e => {
              const time = e.target.value;
              if (!time) return;
              const date = dateValue || format(new Date(), 'yyyy-MM-dd');
              const newDate = new Date(`${date}T${time}`);
              if (isValid(newDate)) {
                setEditingDateTime(newDate);
              }
            }}
          />

          <Button
            disabled={!editingDateTime || !isValid(editingDateTime)}
            variant="outline"
            onClick={() => saveLessonDate(lesson.id)}
          >
            {isLoadingChangeLessonDate ? <Loader className="animate-spin" /> : t('save')}
          </Button>
        </>
      ) : (
        <div className="flex justify-between items-start">
          <div>
            {/* День недели + полная дата */}
            <p className="text-sm font-medium">
              {lesson.scheduledAt ? format(new Date(lesson?.scheduledAt), 'd MMMM yyyy', {
                locale: currentLocale,
              }) : ''}
            </p>

            <p className="text-sm">
              {lesson.scheduledAt ? format(new Date(lesson?.scheduledAt), 'EEEE HH:mm', {
                locale: currentLocale,
              }) : ''}
            </p>
          </div>
          {lesson.status === 'transfer' && user?.role === 'super_admin' && (
            <button
              onClick={() => {
                setEditingLessonId(lesson.id);
                setEditingDateTime(new Date(lesson.scheduledAt));
              }}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
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
