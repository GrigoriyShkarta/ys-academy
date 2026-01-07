'use client';

import { Card } from '@/components/ui/card';
import { AlertCircle, Calendar, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Student } from '@/components/Students/interface';
import { getLastLessonDate, shouldHighlightLesson } from '@/components/Students/utils';
import { formatDateTime } from '@/lib/utils';
import { useState } from 'react';

interface StudentSubscriptionReminderProps {
  student: Student | null;
}

export default function StudentSubscriptionReminder({
  student,
}: StudentSubscriptionReminderProps) {
  const t = useTranslations('Students');
  const [isVisible, setIsVisible] = useState(true);

  if (!student) return null;

  const lastLessonDate = getLastLessonDate(student);

  // Показываем напоминание только если абонемент истекает или истек
  const needsRenewal = lastLessonDate && shouldHighlightLesson(student, lastLessonDate);

  if (!needsRenewal || !isVisible) return null;

  return (
    <Card className="fixed bottom-6 right-6 w-80 sm:w-96 p-4 shadow-2xl z-50 border-orange-500 border-2 animate-in slide-in-from-bottom-5 bg-orange-50 dark:bg-orange-950/20">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <AlertCircle className="w-6 h-6 text-orange-500" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-sm text-orange-700 dark:text-orange-400">
              {t('subscription_renewal_needed')}
            </h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-muted-foreground hover:text-foreground transition-colors ml-2"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('subscription_renewal_message')}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Calendar className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-medium text-orange-700 dark:text-orange-400">
              {t('last_lesson')}: {formatDateTime(lastLessonDate, true)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
