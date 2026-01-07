import { format } from 'date-fns';
import { useLocale } from 'use-intl';
import { dateLocales } from '@/lib/consts';
import { SupportedLocale } from '@/components/Students/Student/components/Subscriptions/SubscriptionModal';
import { StudentSubscription } from '@/components/Students/interface';
import { getYouTubeId } from '@/lib/utils';
import { CirclePlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import UrlModal from '@/components/Materials/LessonRecordings/URLModal';
import { useTranslations } from 'next-intl';
import { useUser } from '@/providers/UserContext';

export default function SubscriptionInfo({
  subscription,
  isExpanded,
}: {
  subscription: StudentSubscription;
  isExpanded: boolean;
}) {
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const locale = useLocale();
  const t = useTranslations('Materials');
  const { user } = useUser();
  const currentLocale = dateLocales[locale as SupportedLocale] || dateLocales.uk;

  // Сбрасываем selectedLessonId когда карточка сворачивается
  useEffect(() => {
    if (!isExpanded) {
      setSelectedLessonId(null);
    }
  }, [isExpanded]);

  // Компактный вид (свёрнутый)
  if (!isExpanded) {
    return (
      <div className="px-2 sm:px-2 py-1 sm:py-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
          <h2 className="text-base sm:text-lg font-medium">{subscription.subscription.title}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
            {format(new Date(subscription.lessons[0].scheduledAt), 'd MMM yyyy', {
              locale: currentLocale,
            })}{' '}
            —{' '}
            {format(new Date(subscription.lessons.at(-1)?.scheduledAt || ''), 'd MMM yyyy', {
              locale: currentLocale,
            })}
          </p>
        </div>
      </div>
    );
  }

  // Развёрнутый вид (с видео)
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">
            {subscription.subscription.title}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {format(new Date(subscription.lessons[0].scheduledAt), 'd MMMM yyyy', {
              locale: currentLocale,
            })}{' '}
            —{' '}
            {format(new Date(subscription.lessons.at(-1)?.scheduledAt || ''), 'd MMMM yyyy', {
              locale: currentLocale,
            })}{' '}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 w-full">
          {subscription.lessons.map(lesson => (
            <div key={lesson.id} className="flex flex-col gap-2">
              {lesson?.recordingUrl ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-xl">
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${getYouTubeId(
                      lesson?.recordingUrl ?? ''
                    )}`}
                    title={lesson.scheduledAt}
                    allowFullScreen
                  />
                </div>
              ) : user?.role === 'super_admin' ? (
                <div
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedLessonId(lesson.id);
                  }}
                  className="aspect-video w-full flex flex-col gap-2 p-4 cursor-pointer border-2 border-dashed
                    rounded-xl justify-center items-center hover:bg-muted transition-colors"
                >
                  <CirclePlus className="w-10 h-10 sm:w-12 sm:h-12" />
                  <span className="text-sm sm:text-base text-center">{t('add_link')}</span>
                </div>
              ) : (
                <div
                  className="aspect-video w-full flex flex-col gap-2 p-4 border-2 border-dashed
                    rounded-xl justify-center items-center"
                >
                  {t('no_link')}
                </div>
              )}
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                {format(new Date(lesson.scheduledAt), 'd MMMM yyyy', { locale: currentLocale })}
              </p>
            </div>
          ))}
        </div>
      </div>

      {selectedLessonId && (
        <UrlModal lessonId={selectedLessonId} closeModal={() => setSelectedLessonId(null)} />
      )}
    </div>
  );
}
