import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useUser } from '@/providers/UserContext';
import useSubscription from '@/components/Students/Student/components/Subscriptions/useSubscription';
import { Student } from '@/components/Students/interface';
import SubscriptionModal from '@/components/Students/Student/components/Subscriptions/SubscriptionModal';
import { Button } from '@/components/ui/button';
import SubscriptionCard from '@/components/Students/Student/components/Subscriptions/SubscriptionCard';

export default function Subscriptions({ student }: { student: Student }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('Students');
  const { user } = useUser();
  const isAdmin = user?.role === 'super_admin';

  const {
    subscriptions,
    editingId,
    editingDateTime,
    isLoadingChangeAmount,
    isLoadingChangeLessonDate,
    isLoadingDelete,
    editSubscription,
    partialAmount,
    editingLessonId,
    currentLocale,
    changeLessonStatus,
    changePaymentStatus,
    createNewSubscription,
    setEditingDateTime,
    setEditingId,
    handleClickEditSubscription,
    handleDeleteSubscription,
    handleCopyMessage,
    saveAmount,
    setEditSubscription,
    saveLessonDate,
    setPartialAmount,
  } = useSubscription({ student, setOpen });

  const showSubscriptions = subscriptions && isAdmin ? subscriptions : subscriptions?.slice(0, 1);

  return (
    <div className="w-full mx-auto space-y-8">
      {isAdmin && (
        <Button className="bg-accent mx-auto block" onClick={() => setOpen(true)}>
          {t('add_subscription')}
        </Button>
      )}

      <div className="w-full flex flex-col gap-2">
        {showSubscriptions?.map((subscription, idx) => (
          <SubscriptionCard
            key={subscription.id}
            idx={idx}
            currentLocale={currentLocale}
            isLoadingChangeAmount={isLoadingChangeAmount}
            subscription={subscription}
            isLoadingChangeLessonDate={isLoadingChangeLessonDate}
            isLoadingDelete={isLoadingDelete}
            editingId={editingId}
            partialAmount={partialAmount as number}
            handleCopyMessage={handleCopyMessage}
            createNewSubscription={createNewSubscription}
            handleClickEditSubscription={handleClickEditSubscription}
            setEditingId={setEditingId}
            handleDeleteSubscription={handleDeleteSubscription}
            changePaymentStatus={changePaymentStatus}
            saveAmount={saveAmount}
            setPartialAmount={setPartialAmount}
            changeLessonStatus={changeLessonStatus}
            saveLessonDate={saveLessonDate}
            editingDateTime={editingDateTime}
            setEditingDateTime={setEditingDateTime}
            editingLessonId={editingLessonId}
          />
        ))}
      </div>

      <SubscriptionModal
        open={open}
        close={() => {
          setOpen(false);
          setEditSubscription(undefined);
        }}
        studentId={student.id}
        subscription={editSubscription}
      />
    </div>
  );
}
