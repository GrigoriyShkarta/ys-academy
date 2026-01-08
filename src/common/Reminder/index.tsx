'use client';

import { Card } from '@/components/ui/card';
import { AlertCircle, Calendar, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Student } from '@/components/Students/interface';
import { MessageCircle } from 'lucide-react';
import { getLastLessonDate, shouldHighlightLesson, isWithinWeekOrPast } from '@/components/Students/utils';
import { formatDateTime } from '@/lib/utils';
import { useState } from 'react';
import Link from 'next/link';

interface StudentSubscriptionReminderProps {
  student: Student | null;
}

export default function Remider({
  student,
}: StudentSubscriptionReminderProps) {
  const t = useTranslations('Students');
  const [isVisible, setIsVisible] = useState(true);
  const today = new Date();

  if (!student) return null;

  const lastLessonDate = getLastLessonDate(student);

  console.log('isVisible', isVisible)

  const needsRenewal = lastLessonDate && shouldHighlightLesson(student, lastLessonDate);
  const isExpired = lastLessonDate ? formatDateTime(lastLessonDate, true) < formatDateTime(today, true) : false;
  const accessExpiryDate = student?.accessExpiryDate ?? '';
  const isAccessExpiryNear = accessExpiryDate ? isWithinWeekOrPast(new Date(accessExpiryDate)) : false;

  const showReminder = !needsRenewal || !isAccessExpiryNear
  const text = () => {
    if (isExpired || accessExpiryDate) {
      const deadlineDate = new Date(lastLessonDate!);
      deadlineDate.setDate(deadlineDate.getDate() + 7);
      return t('expired_renewal_message', { date: formatDateTime(accessExpiryDate ? student?.accessExpiryDate : deadlineDate, true) });
    } if (needsRenewal) {
      return t('subscription_renewal_message', { date: formatDateTime(lastLessonDate, true) });
    }
    return t('subscription_renewal_needed');
  }

  return (
    <>
      <Link
        href="https://t.me/yana_vocalcoach"
        target="_blank"
        className={`fixed flex items-center justify-center right-6 sm:w-18 sm:h-18 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:scale-105 hover:shadow-xl transition-all duration-300 z-50 ${
          showReminder && isVisible ? 'bottom-42' : 'bottom-6'
        }`}
      >
        <MessageCircle width={28} height={28} fill='white' />
      </Link>  
      {showReminder && isVisible && (
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
                {text()}
              </p>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
