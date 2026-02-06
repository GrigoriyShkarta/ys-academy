import { Dispatch, SetStateAction, useState } from 'react';
import { Card } from '@/components/ui/card';
import { StudentSubscription } from '@/components/Students/interface';
import SubscriptionButtons from '@/components/Students/Student/components/Subscriptions/SubscriptionCard/SubscriptionButtons';
import { useUser } from '@/providers/UserContext';
import SubscriptionInfo from '@/components/Students/Student/components/Subscriptions/SubscriptionCard/SubscriptionInfo';
import SubscriptionLesson from '@/components/Students/Student/components/Subscriptions/SubscriptionCard/SubscriptionLesson';
import { Locale } from 'date-fns';
import AccordingCard from '@/components/Students/Student/components/Subscriptions/SubscriptionCard/AccordingCard';

interface Props {
  idx: number;
  currentLocale: Locale;
  subscription: StudentSubscription;
  isLoadingChangeAmount: boolean;
  handleCopyMessage: (subscription: StudentSubscription) => void;
  createNewSubscription: (subscriptionId: number) => void;
  handleClickEditSubscription: (subscriptionId: number) => void;
  setEditingId: Dispatch<SetStateAction<number | undefined>>;
  isLoadingDelete: boolean;
  editingId: number | undefined;
  handleDeleteSubscription: (subscriptionId: number) => Promise<void>;
  changePaymentStatus: (subscriptionId: number, status: string) => void;
  saveAmount: (subscriptionId: number) => void;
  partialAmount: number;
  setPartialAmount: Dispatch<SetStateAction<number | undefined>>;
  partialPaymentDate: string | undefined;
  setPartialPaymentDate: Dispatch<SetStateAction<string | undefined>>;
  changeLessonStatus: (subscriptionId: number, lessonId: number, status: string) => void;
  saveLessonDate: (lessonId: number) => void;
  editingDateTime: Date | null;
  setEditingDateTime: Dispatch<SetStateAction<Date | null>>;
  editingLessonId?: number;
  isLoadingChangeLessonDate?: boolean;
}

export default function SubscriptionCard({
  subscription,
  idx,
  currentLocale,
  isLoadingChangeAmount,
  createNewSubscription,
  editingId,
  handleClickEditSubscription,
  handleCopyMessage,
  isLoadingDelete,
  setEditingId,
  handleDeleteSubscription,
  changePaymentStatus,
  saveAmount,
  partialAmount,
  setPartialAmount,
  partialPaymentDate,
  setPartialPaymentDate,
  changeLessonStatus,
  saveLessonDate,
  editingDateTime,
  setEditingDateTime,
  editingLessonId,
  isLoadingChangeLessonDate,
}: Props) {
  const { user } = useUser();
  const [showMore, setShowMore] = useState<number[]>([]);

  const handleClickShowMore = (idx: number) => {
    if (idx === 0 || showMore.includes(idx)) return;
    setShowMore(prev => [...prev, idx]);
  };

  return (
    <Card
      className={`p-2 gap-2 ${
        idx !== 0 && !showMore?.includes(idx) ? 'cursor-pointer hover:opacity-80' : ''
      }`}
      onClick={() => handleClickShowMore(idx)}
    >
      {idx === 0 || showMore?.includes(idx) ? (
        <>
          <div className="flex justify-between items-center w-full">
            <h1 className="text-2xl">{subscription.subscription.title}</h1>

            {user?.role === 'super_admin' && (
              <SubscriptionButtons
                subscription={subscription}
                idx={idx}
                handleCopyMessage={handleCopyMessage}
                createNewSubscription={createNewSubscription}
                handleClickEditSubscription={handleClickEditSubscription}
                setEditingId={setEditingId}
                isLoadingDelete={isLoadingDelete}
                editingId={editingId}
                handleDeleteSubscription={handleDeleteSubscription}
                hiddenButtons={idx !== 0}
                setShowMore={setShowMore}
              />
            )}
          </div>

          <SubscriptionInfo
            currentLocale={currentLocale}
            subscription={subscription}
            isLoadingChangeAmount={isLoadingChangeAmount}
            changePaymentStatus={changePaymentStatus}
            saveAmount={saveAmount}
            partialAmount={partialAmount}
            editingId={editingId}
            setEditingId={setEditingId}
            setPartialAmount={setPartialAmount}
            partialPaymentDate={partialPaymentDate}
            setPartialPaymentDate={setPartialPaymentDate}
          />

          <div className="flex flex-wrap gap-2">
            {subscription.lessons.map(lesson => (
              <SubscriptionLesson
                key={lesson.id}
                lesson={lesson}
                changeLessonStatus={changeLessonStatus}
                saveLessonDate={saveLessonDate}
                setEditingDateTime={setEditingDateTime}
                editingDateTime={editingDateTime}
                subscriptionId={subscription.id}
                editingLessonId={editingLessonId}
                isLoadingChangeLessonDate={isLoadingChangeLessonDate}
                currentLocale={currentLocale}
              />
            ))}
          </div>
        </>
      ) : (
        <AccordingCard
          tile={subscription.subscription.title}
          currentLocale={currentLocale}
          startTime={subscription.lessons[0]?.scheduledAt}
          endTime={subscription.lessons.at(-1)?.scheduledAt || ''}
          setShowMore={setShowMore}
          idx={idx}
          paymentStatus={subscription.paymentStatus}
          paymentDate={subscription.paymentDate}
          amount={subscription.amount}
          price={subscription.subscription.price}
        />
      )}
    </Card>
  );
}
